import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, DrawingStyle } from '@annotorious/react';
import { Filter, TextAnnotation, TextAnnotatorOptions } from '@recogito/text-annotator';
import { createPDFAnnotator, PDFAnnotator as VanillaPDFAnnotator, PDFScale } from '@recogito/pdf-annotator';

import '@recogito/pdf-annotator/pdf-anntator.css';
import './PDFAnnotator.css';

export type PDFAnnotatorProps<E extends unknown> = TextAnnotatorOptions<E> & {

  children?: ReactNode | JSX.Element;

  filter?: Filter;

  style?: DrawingStyle | ((annotation: TextAnnotation) => DrawingStyle);

  pdfUrl: string;

  pageSize?: PDFScale | number;

  onRendered?(): void;

}

export const PDFAnnotator = <E extends unknown>(props: PDFAnnotatorProps<E>) => {

  const { children, style, pdfUrl, ...opts } = props;

  const el = useRef<HTMLDivElement>(null);

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {    
    createPDFAnnotator(el.current, pdfUrl, opts)
      .then(anno => {
        anno.setStyle(props.style);
        setAnno(anno);

        props.onRendered && props.onRendered();
      });
  }, []);

  useEffect(() => {
    if (props.pageSize && anno)
      (anno as VanillaPDFAnnotator).setScale(props.pageSize);
  }, [props.pageSize])

  useEffect(() => {
    if (!anno)
      return;
    
    anno.setStyle(props.style);
  }, [props.style]);

  useEffect(() => {
    if (!anno)
      return;
    
    anno.setFilter(props.filter);
  }, [props.filter]);

  return (
    <div 
      ref={el} 
      className="r6o-pdf-container">
      {children}
    </div>
  )

}