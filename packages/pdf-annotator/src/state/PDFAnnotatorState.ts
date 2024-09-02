import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import { 
  AnnotatorState, 
  createTextAnnotatorState, 
  HoverState, 
  SelectionState, 
  TextAnnotatorOptions
} from '@recogito/text-annotator';
import { ViewportState } from '@annotorious/core';
import { PDFAnnotation } from '../PDFAnnotation';
import { PDFAnnotationStore } from './PDFAnnotationStore';

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
  const inner = createTextAnnotatorState(container, opts.userSelectAction);

  
}
