import { 
  TextAnnotation, 
  TextAnnotatorOptions, 
  TextAnnotator, 
  createTextAnnotator,
  fillDefaults
} from '@recogito/text-annotator';
import { addResizeObserver } from './responsive';
import type { PDFScale } from './PDFScale';
import { createAPI } from './api';
import { PDFAnnotation } from './PDFAnnotation';
import { createPDFViewer } from './createPDFViewer';

import './PDFAnnotator.css';
import '@recogito/text-annotator/dist/text-annotator.css';
import { createPDFAnnotatorState } from './state/PDFAnnotatorState';

export interface PDFAnnotator extends TextAnnotator<PDFAnnotation> {

  currentScale: number;

  currentScaleValue: string | undefined;

  setScale(scale: PDFScale | number): number;

  zoomIn(percentage?: number): number;

  zoomOut(percentag?: number): number;

}

export const createPDFAnnotator = (
  container: HTMLDivElement, 
  pdfURL: string,
  options: TextAnnotatorOptions<PDFAnnotation>
) => createPDFViewer(container, pdfURL).then(pdfViewer => {

  const opts = fillDefaults<PDFAnnotation>(options, {
    annotatingEnabled: true
  });

  const state = createPDFAnnotatorState(container, opts, pdfViewer); 

  // TODO PDF Annotator!

  // const store = createPDFStore(t.state.store as TextAnnotationStore, pdfViewer);

  const pdfAnnotator = {
    ...anno,
    get currentScale() { return pdfViewer.currentScale },
    get currentScaleValue() { return pdfViewer.currentScaleValue },
    ...createAPI(anno, pdfViewer)
  }

  pdfViewer.eventBus.on('textlayerrendered', ({ pageNumber }: { pageNumber: number }) =>
    store.onLazyRender(pageNumber));

  const removeResizeObserver = addResizeObserver(container, () => {
    const { currentScaleValue } = pdfViewer;
    if (
      currentScaleValue === 'auto' ||
      currentScaleValue === 'page-fit' ||
      currentScaleValue === 'page-width'
    ) {
      // Refresh size
      pdfViewer.currentScaleValue = currentScaleValue;
    }

    pdfViewer.update();
  });

});
