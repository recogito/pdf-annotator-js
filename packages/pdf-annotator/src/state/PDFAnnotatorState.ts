import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import { 
  createTextAnnotatorState, 
  HoverState, 
  Origin, 
  SelectionState, 
  TextAnnotation, 
  TextAnnotationTarget, 
  TextAnnotatorOptions,
  TextAnnotatorState,
  TextSelector
} from '@recogito/text-annotator';
import { shouldNotify } from '@annotorious/core';
import type { 
  StoreChangeEvent, 
  StoreObserveOptions, 
  StoreObserver, 
  ViewportState, 
  Update,
} from '@annotorious/core';
import { PDFAnnotation, PDFAnnotationTarget } from '../PDFAnnotation';
import { getQuadPoints, reviveAnnotation, reviveTarget } from './utils';
import { PDFAnnotationStore } from './PDFAnnotationStore';

export interface PDFAnnotatorState extends TextAnnotatorState<PDFAnnotation> {

  store: PDFAnnotationStore;

  selection: SelectionState<PDFAnnotation>;

  hover: HoverState<PDFAnnotation>;

  viewport: ViewportState;

}

export const createPDFAnnotatorState = (
  viewer: pdfjsViewer.PDFViewer,
  viewerElement: HTMLDivElement, 
  opts: TextAnnotatorOptions<PDFAnnotation>
): PDFAnnotatorState => {

  // The 'inner' text annotator
  const { store: innerStore, selection, hover, viewport } = createTextAnnotatorState(viewerElement, opts.userSelectAction);

  const observers: StoreObserver<PDFAnnotation>[] = [];

  const observe = (onChange: { (event: StoreChangeEvent<PDFAnnotation>): void }, options: StoreObserveOptions = {}) =>
    observers.push({ onChange, options });

  const unobserve = (onChange: { (event: StoreChangeEvent<PDFAnnotation>): void }) => {
    const idx = observers.findIndex(observer => observer.onChange == onChange);
    if (idx > -1)
      observers.splice(idx, 1);
  }

  const emit = (event: StoreChangeEvent<PDFAnnotation>) => {
    observers.forEach(observer => {
      if (shouldNotify(observer, event))
        observer.onChange(event);
    });
  }

  const toPDFAnnotationTarget = (target: TextAnnotationTarget) => {
    const rects = innerStore.getAnnotationRects(target.annotation);

    const toPDFSelector = (s: TextSelector) => {
      const pageNumber = parseInt(s.offsetReference.dataset.pageNumber);
      return {
        ...s,
        pageNumber,
        quadpoints: getQuadPoints(rects, viewer.getPageView(pageNumber - 1))
      }
    }

    return {
      ...target,
      selector: target.selector.map(toPDFSelector)
    } as PDFAnnotationTarget;
  }

  const toPDFAnnotation = (t: TextAnnotation) => ({
    ...t,
    target: toPDFAnnotationTarget(t.target)
  });

  /**********************/
  /* Wrapped store API **/
  /**********************/

  const addAnnotation = (annotation: PDFAnnotation, origin = Origin.LOCAL) => {
    const revived = reviveAnnotation(annotation);

    const success = innerStore.addAnnotation(revived, origin);
    // upsertRenderedAnnotation(revived);

    return success;
  }

  const bulkAddAnnotation = (
    annotations: PDFAnnotation[], 
    replace: boolean,
    origin = Origin.LOCAL
  ) => {
    const revived = annotations.map(reviveAnnotation);

    const failed = innerStore.bulkAddAnnotation(revived, replace, origin) as PDFAnnotation[];
    // revived.forEach(upsertRenderedAnnotation);

    return failed;
  }

  const updateAnnotation = (annotation: PDFAnnotation, origin = Origin.LOCAL) => {
    const revived = reviveAnnotation(annotation);
    
    innerStore.updateAnnotation(revived, origin);

    // upsertRenderedAnnotation(revived);
  }

  const updateTarget = (target: PDFAnnotationTarget, origin = Origin.LOCAL) => {
    const revived = reviveTarget(target);

    innerStore.updateTarget(revived, origin);

    // updateRenderedTarget(revived);
  }

  // Callback method for when a new page gets rendered by PDF.js
  const onLazyRender = (page: number) => {   
    console.log('onLazyRender ' + page); 
    /*
    const pages = [page - 2, page - 1, page, page + 1, page + 2].filter(n => n >= 0);
    
    const toRender = pages.reduce<PDFAnnotation[]>((annotations, page) => (
      [...annotations, ...(rendered.get(page) || [])]
    ), []).map(({ id }) => store.getAnnotation(id));

    if (toRender.length > 0)
      // Attempt to update the unrendered annotations in the store      
      store.bulkUpsertAnnotations(toRender, Origin.REMOTE);
    */
  }  

  innerStore.observe(event => {
    const { changes } = event;

    // Annotations coming from the innerStore or all TextAnnotations!
    const created: PDFAnnotation[] = (changes.created || []).map(toPDFAnnotation);
    created.forEach(a => innerStore.updateAnnotation(a, Origin.REMOTE));

    const updated = (changes.updated || []).map(e => {
      if (e.targetUpdated) {
        const newTarget = toPDFAnnotationTarget(e.targetUpdated.newTarget as TextAnnotationTarget);
        const oldValue: PDFAnnotation = toPDFAnnotation(e.oldValue);

        const newValue: PDFAnnotation = {
          ...e.newValue,
          target: newTarget
        };

        return {
          ...e,
          oldValue,
          newValue,
          targetUpdated: e.targetUpdated ? ({
            oldTarget: oldValue.target,
            newTarget: newValue.target
          }) : undefined
        } as Update<PDFAnnotation>;
      } else {
        return e as Update<PDFAnnotation>
      }
    });

    updated.forEach(u => innerStore.updateAnnotation(u.newValue, Origin.REMOTE));

    const deleted: PDFAnnotation[] = (changes.deleted || []).map(toPDFAnnotation);

    const crosswalked = {
      ...event,
      changes: {
        created,
        updated,
        deleted
      }
    } as StoreChangeEvent<PDFAnnotation>;

    emit(crosswalked);
  }, { origin: Origin.LOCAL });

  return {
    hover,
    selection,
    // @ts-ignore
    store: { 
      ...innerStore,
      addAnnotation,
      bulkAddAnnotation,
      observe,
      onLazyRender,
      unobserve,
      updateAnnotation
    },
    viewport,

  }
  
}
