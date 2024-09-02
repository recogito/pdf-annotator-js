import { 
  TextAnnotatorOptions, 
  TextAnnotator, 
  fillDefaults,
  createSpansRenderer,
  SelectionHandler
} from '@recogito/text-annotator';
import { 
  createBaseAnnotator, 
  createLifecycleObserver, 
  createUndoStack, 
  User 
} from '@annotorious/core';
import { addResizeObserver } from './responsive';
import type { PDFScale } from './PDFScale';
import { PDFAnnotation } from './PDFAnnotation';
import { createPDFViewer } from './createPDFViewer';
import { createPDFAnnotatorState } from './state/PDFAnnotatorState';

import './PDFAnnotator.css';
import '@recogito/text-annotator/dist/text-annotator.css';

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

  const { store, viewport } = state;

  const undoStack = createUndoStack<PDFAnnotation>(store);

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

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<PDFAnnotation, PDFAnnotation>(state, undoStack);

  const getUser = () => currentUser;

  const destroy = () => {
    removeResizeObserver();
  }

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  return {
    ...base,
    get currentScale() { return pdfViewer.currentScale },
    get currentScaleValue() { return pdfViewer.currentScaleValue },
    destroy,
    getUser,
    setUser,
    on: lifecycle.on,
    off: lifecycle.off
  }

});
