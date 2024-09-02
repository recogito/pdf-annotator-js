import { TextAnnotationStore } from '@recogito/text-annotator';
import { PDFAnnotation } from '../PDFAnnotation';

export interface PDFAnnotationStore extends TextAnnotationStore<PDFAnnotation> {

  onLazyRender(page: number): void;   
  
}