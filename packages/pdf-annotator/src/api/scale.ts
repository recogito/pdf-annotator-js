import type { PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
import type { PDFScale } from '../PDFScale';

// Zoom/scale-related Annotator API function implementations

export const setScale = (viewer: PDFViewer) => (size: PDFScale | number) => { 
  if (typeof size === 'number')
    viewer.currentScale = size;
  else
    viewer.currentScaleValue = size;  

  return viewer.currentScale;
}

export const zoomIn = (viewer: PDFViewer) => (percentage?: number) => {
  const factor = viewer.currentScale + (percentage || 10) / 100;
  viewer.currentScale = Math.min(50, factor);
  return viewer.currentScale;
}

export const zoomOut = (viewer: PDFViewer) => (percentage?: number) => {
  const factor = viewer.currentScale - (percentage || 10) / 100;
  viewer.currentScale = factor;
  return viewer.currentScale;
}