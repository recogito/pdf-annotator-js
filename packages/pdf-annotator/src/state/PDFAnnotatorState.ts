import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import { 
  AnnotatorState, 
  createTextAnnotatorState, 
  HoverState, 
  SelectionState, 
  TextAnnotatorOptions
} from '@recogito/text-annotator';
import type { 
  StoreChangeEvent, 
  StoreObserver, 
  StoreObserveOptions, 
  ViewportState 
} from '@annotorious/core';
import { PDFAnnotation } from '../PDFAnnotation';
import { PDFAnnotationStore } from './PDFAnnotationStore';
import { getQuadPoints } from './getQuadPoints';

export interface PDFAnnotatorState extends AnnotatorState<PDFAnnotation> {

  store: PDFAnnotationStore;

  selection: SelectionState<PDFAnnotation>;

  hover: HoverState<PDFAnnotation>;

  viewport: ViewportState;

}

export const createPDFAnnotatorState = (
  container: HTMLDivElement, 
  opts: TextAnnotatorOptions<PDFAnnotation>,
  viewer: pdfjsViewer.PDFViewer
) => {

  // The 'inner' text annotator
  const { store: innerStore, selection, hover, viewport } = createTextAnnotatorState(container.querySelector('.pdfViewer'), opts.userSelectAction);

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
      // if (shouldNotify(observer, event))
      observer.onChange(event);
    });
  }

  innerStore.observe(event => {
    const { changes } = event;

    // Annotations coming from the innerStore or all TextAnnotations!
    // const deleted = (changes.deleted || []);
    const created = (changes.created || []);
    const updated = (changes.updated || []);

    // TODO for testing only
    const toCrosswalk = updated.map(u => u.newValue);
    
    toCrosswalk.forEach(a => {
      // TODO how do we know the page number!?
      const page = viewer.getPageView(0);

      const rects = innerStore.getAnnotationRects(a.id);
      const quadpoints = getQuadPoints(rects, page);
      console.log(quadpoints);
    })

  });

  return {
    hover,
    selection,
    store: { 
      ...innerStore,
      observe,
      unobserve
    },
    viewport
  }
  
}
