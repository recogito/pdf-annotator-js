import type { TextAnnotator } from '@recogito/text-annotator';
import type { EventBus, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { setScale, zoomIn, zoomOut } from './scale';
import { scrollIntoView } from './scrollIntoView';

export const createAPI = <E extends unknown>(anno: TextAnnotator<E>, viewer: PDFViewer, eventBus: EventBus) => {

  return {
    scrollIntoView: scrollIntoView(anno, eventBus),
    setScale: setScale(viewer),
    zoomIn: zoomIn(viewer),
    zoomOut: zoomOut(viewer)
  }

}