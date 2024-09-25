import { createPresencePainter, createSpansRenderer, fillDefaults, SelectionHandler } from '@recogito/text-annotator';
import type { HighlightStyleExpression, TextAnnotator, TextAnnotatorOptions } from '@recogito/text-annotator';
import { createBaseAnnotator, createLifecycleObserver, createUndoStack } from '@annotorious/core';
import type { Filter, PresenceProvider, User } from '@annotorious/core';
import { addResizeObserver } from './responsive';
import type { PDFScale } from './PDFScale';
import type { PDFAnnotation } from './PDFAnnotation';
import { createPDFViewer } from './createPDFViewer';
import { createPDFAnnotatorState } from './state';
import { 
  setScale as _setScale,
  zoomIn as _zoomIn,
  zoomOut as _zoomOut,
  scrollIntoView as _scrollIntoView
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

  const { store, viewport, selection } = state;

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

    highlightRenderer.destroy();
    selectionHandler.destroy();
    
    undoStack.destroy();
  }

  const scrollIntoView = _scrollIntoView(viewer, viewerElement, store);

  const setFilter = (filter?: Filter) => {
    highlightRenderer.setFilter(filter);
    selectionHandler.setFilter(filter);
  }

  const setPresenceProvider = (provider: PresenceProvider) => {
    if (provider) {
      highlightRenderer.setPainter(createPresencePainter(provider, opts.presence));
      provider.on('selectionChange', () => highlightRenderer.redraw());
    }
  }

  const setScale = _setScale(viewer);

  const setSelected = (arg?: string | string[]) => {
    if (arg) {
      selection.setSelected(arg);
    } else {
      selection.clear();
    }
  }

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
    setPresenceProvider,
    setScale,
    setSelected,
    setStyle,
    setUser,
    setVisible,
    scrollIntoView,
    zoomIn,
    zoomOut,
    state
  }

});
