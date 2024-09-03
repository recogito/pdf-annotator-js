import { 
  TextAnnotatorOptions, 
  TextAnnotator, 
  fillDefaults,
  createSpansRenderer,
  SelectionHandler,
  HighlightStyleExpression
} from '@recogito/text-annotator';
import { 
  createBaseAnnotator, 
  createLifecycleObserver, 
  createUndoStack, 
  Filter, 
  User 
} from '@annotorious/core';
import { addResizeObserver } from './responsive';
import type { PDFScale } from './PDFScale';
import { PDFAnnotation } from './PDFAnnotation';
import { createPDFViewer } from './createPDFViewer';
import { createPDFAnnotatorState } from './state/PDFAnnotatorState';
import { 
  setScale as _setScale,
  zoomIn as _zoomIn,
  zoomOut as _zoomOut
 } from './api';

import './PDFAnnotator.css';
import '@recogito/text-annotator/dist/text-annotator.css';

export interface PDFAnnotator extends TextAnnotator<PDFAnnotation, PDFAnnotation> {

  element: HTMLElement;

  currentScale: number;

  currentScaleValue: string | undefined;

  scrollIntoView(annotation: PDFAnnotation): boolean;

  setScale(scale: PDFScale | number): number;

  setStyle(style: HighlightStyleExpression | undefined): void;

  zoomIn(percentage?: number): number;

  zoomOut(percentage?: number): number;

}

export const createPDFAnnotator = (
  container: HTMLDivElement, 
  pdfURL: string,
  options: TextAnnotatorOptions<PDFAnnotation, PDFAnnotation> = {}
): Promise<PDFAnnotator> => createPDFViewer(container, pdfURL).then(({ viewer, viewerElement }) => {
  const opts = fillDefaults<PDFAnnotation, PDFAnnotation>(options, {
    annotatingEnabled: true
  });

  const state = createPDFAnnotatorState(viewer, viewerElement, opts); 

  const { store, viewport } = state;

  const undoStack = createUndoStack<PDFAnnotation>(store);

  // @ts-ignore
  const lifecycle = createLifecycleObserver<PDFAnnotation, PDFAnnotation>(state, undoStack, opts.adapter);

  let currentUser: User = opts.user;

  const highlightRenderer = createSpansRenderer(viewerElement, state, viewport);

  if (opts.style)
    highlightRenderer.setStyle(opts.style);

  const selectionHandler = SelectionHandler(
    container.querySelector('.pdfViewer'), 
    state, 
    opts.annotatingEnabled, 
    '.page'
  );
  selectionHandler.setUser(currentUser);

  viewer.eventBus.on('textlayerrendered', ({ pageNumber }: { pageNumber: number }) =>
    store.onLazyRender(pageNumber));

  const removeResizeObserver = addResizeObserver(container, () => {
    const { currentScaleValue } = viewer;
    if (
      currentScaleValue === 'auto' ||
      currentScaleValue === 'page-fit' ||
      currentScaleValue === 'page-width'
    ) {
      // Refresh size
      viewer.currentScaleValue = currentScaleValue;
    }

    viewer.update();
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

  const scrollIntoView = (annotation: PDFAnnotation) => {
    // TODO
    return true;
  }

  const setFilter = (filter?: Filter) => {
    highlightRenderer.setFilter(filter);
    selectionHandler.setFilter(filter);
  }

  const setScale = _setScale(viewer);

  const setStyle = (style: HighlightStyleExpression | undefined) =>
    highlightRenderer.setStyle(style);

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const setVisible = (visible: boolean) =>
    highlightRenderer.setVisible(visible);

  const zoomIn = _zoomIn(viewer);
  
  const zoomOut = _zoomOut(viewer);

  return {
    ...base,
    element: viewerElement,
    get currentScale() { return viewer.currentScale },
    get currentScaleValue() { return viewer.currentScaleValue },
    destroy,
    getUser,
    on: lifecycle.on,
    off: lifecycle.off,
    setFilter,
    setScale,
    setStyle,
    setUser,
    setVisible,
    scrollIntoView,
    zoomIn,
    zoomOut,
    state
  }

});
