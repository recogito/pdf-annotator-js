import { 
  TextAnnotatorOptions, 
  TextAnnotator, 
  fillDefaults,
  createSpansRenderer,
  SelectionHandler
} from '@recogito/text-annotator';
import { addResizeObserver } from './responsive';
import type { PDFScale } from './PDFScale';
import { PDFAnnotation } from './PDFAnnotation';
import { createPDFViewer } from './createPDFViewer';
import { createPDFAnnotatorState } from './state/PDFAnnotatorState';

import './PDFAnnotator.css';
import '@recogito/text-annotator/dist/text-annotator.css';
import { createLifecycleObserver, createUndoStack, User } from '@annotorious/core';
import { createAPI } from './api';

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
  options: TextAnnotatorOptions<PDFAnnotation> = {}
) => createPDFViewer(container, pdfURL).then(pdfViewer => {
  const opts = fillDefaults<PDFAnnotation>(options, {
    annotatingEnabled: true
  });

  const state = createPDFAnnotatorState(container, opts, pdfViewer); 

  const { hover, selection, store, viewport } = state;

  const undoStack = createUndoStack(store);

  // @ts-ignore
  const lifecycle = createLifecycleObserver<PDFAnnotation, PDFAnnotation>(state, undoStack, opts.adapter);

  let currentUser: User = opts.user;

  const highlightRenderer = createSpansRenderer(container, state, viewport);

  if (opts.style)
    highlightRenderer.setStyle(opts.style);

  const selectionHandler = SelectionHandler(
    container.querySelector('.pdfViewer'), 
    state, 
    opts.annotatingEnabled, 
    '.page'
  );
  selectionHandler.setUser(currentUser);

  /*

  const pdfAnnotator = {
    ...anno,
    get currentScale() { return pdfViewer.currentScale },
    get currentScaleValue() { return pdfViewer.currentScaleValue },
    ...createAPI(anno, pdfViewer)
  }
  */

  // pdfViewer.eventBus.on('textlayerrendered', ({ pageNumber }: { pageNumber: number }) =>
  //   store.onLazyRender(pageNumber));
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

  const destroy = () => {
    removeResizeObserver();
  }

  return {
    destroy,
    get currentScale() { return pdfViewer.currentScale },
    get currentScaleValue() { return pdfViewer.currentScaleValue }
  }

});
