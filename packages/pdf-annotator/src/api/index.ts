import type { TextAnnotator } from '@recogito/text-annotator';
import type { EventBus, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { setScale, zoomIn, zoomOut } from './scale';
import { scrollIntoView } from './scrollIntoView';
import { PDFAnnotator } from 'src/PDFAnnotator';

export const createAPI = (anno: PDFAnnotator, viewer: PDFViewer) => {

  return {
    scrollIntoView: scrollIntoView(anno, viewer.eventBus),
    setScale: setScale(viewer),
    zoomIn: zoomIn(viewer),
    zoomOut: zoomOut(viewer)
  }

}