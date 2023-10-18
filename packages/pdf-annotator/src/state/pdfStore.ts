import { 
  Origin, 
  TextAnnotation, 
  TextAnnotationStore, 
  TextAnnotationTarget 
} from '@recogito/text-annotator';
import type { 
  PDFAnnotation, 
  PDFAnnotationTarget, 
  PDFSelector 
} from '../PDFAnnotation';

/**
 * Revives the given annotation target, if needed.
 * 
 * - if there is a valid offsetReference element, it will reconstruct the PDF page number if needed.
 * - vice versa, if there is no offsetReference, but a pageNumber, it will add in the offsetReference element.
 * 
 * Targets that have neither a pageNumber nor an offsetReference shouldn't be possible. (Annotations
 * created by the user will always have an offsetReference, annotations coming from the backend or 
 * realtime channel will always have a page number).
 */
const reviveTarget = (target: PDFAnnotationTarget | TextAnnotationTarget): PDFAnnotationTarget => {
  const { selector } = target;

  const hasValidOffsetReference = 
    'offsetReference' in selector && 
    selector.offsetReference instanceof HTMLElement;

  if (hasValidOffsetReference) {
    if ('pageNumber' in selector) {
      // Already a PDF annotation target - doesn't need reviving
      return target as PDFAnnotationTarget;
    } else {
      // No pageNumber, but offsetReference element -> crosswalk
      const { offsetReference } = target.selector;
      const pageNumber = parseInt(offsetReference.dataset.pageNumber);
    
      return {
        ...target,
        selector: {
          ...target.selector,
          pageNumber 
        }
      };
    }
  } else if ('pageNumber' in selector) {
    const { pageNumber } = selector;
    const offsetReference: HTMLElement = document.querySelector(`.page[data-page-number="${pageNumber}"]`);

    return {
      ...target,
      selector: {
        ...target.selector,
        offsetReference
      } as PDFSelector
    };
  } else { 
    // Has neither offsetReference - shouldn't happen
    console.warn('Invalid PDF annotation target', target);
    return target as PDFAnnotationTarget;
  }
}

/** Helper: revives the target of the given annotation, if needed **/
const revive = (a: PDFAnnotation | TextAnnotation): PDFAnnotation => ({
  ...a,
  target: reviveTarget(a.target)
});

/**
 * The PDF plugin intercepts a few methods on the standard
 * TextAnnotationStore and applies PDF-specific target-reviving.
 */
export const createPDFStore = (store: TextAnnotationStore) => {

  // Keep track of annotations that failed to render
  // because of PDF.js lazy content rendering
  let unrendered: PDFAnnotation[] = [];

  // Intercept and monkey-patch API where needed
  const _addAnnotation = store.addAnnotation;
  store.addAnnotation = (annotation: PDFAnnotation | TextAnnotation, origin = Origin.LOCAL) => {
    const revived = revive(annotation);

    const success = _addAnnotation(revived, origin);
    if (!success)
      unrendered = [...unrendered, revived];

    return success;
  }

  const _bulkAddAnnotation = store.bulkAddAnnotation;
  store.bulkAddAnnotation = (
    annotations: PDFAnnotation[], 
    replace: boolean,
    origin = Origin.LOCAL
  ) => {
    const revived = annotations.map(revive);
    const failed = _bulkAddAnnotation(revived, replace, origin) as PDFAnnotation[];

    // Add them to the list of unrendered annotations
    const unrenderedIds = new Set(unrendered.map(a => a.id));
    
    unrendered = [
      ...unrendered,
      ...failed.filter(a => !unrenderedIds.has(a.id))
    ];

    return failed;
  }

  const _updateAnnotation = store.updateAnnotation;
  store.updateAnnotation = (annotation: PDFAnnotation | TextAnnotation, origin = Origin.LOCAL) =>
    _updateAnnotation(revive(annotation), origin);

  const _updateTarget = store.updateTarget;
  store.updateTarget = (target: PDFAnnotationTarget | TextAnnotationTarget, origin = Origin.LOCAL) => 
    _updateTarget(reviveTarget(target), origin);

  // Callback method for when a new page gets rendered by PDF.js
  const onLazyRender = (page: number) => {
    // Get annotations for this page and +2 in both directions
    const toRender = unrendered.filter(a => {
      const { pageNumber } = a.target.selector;
      return page >= pageNumber - 2 && page <= pageNumber + 2;
    });

    if (toRender.length > 0) {
      // Attempt to update the unrendered annotations in the store
      store.bulkDeleteAnnotation(toRender, Origin.REMOTE);
      store.bulkAddAnnotation(toRender, false, Origin.REMOTE);
    }
  }  

  return {
    ...store,
    onLazyRender
  };

}