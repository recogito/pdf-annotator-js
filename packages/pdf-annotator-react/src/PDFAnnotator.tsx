import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, Formatter } from '@annotorious/react';
import { TextAnnotatorOptions } from '@recogito/text-annotator';
import { createPDFAnnotator, PDFAnnotator as VanillaPDFAnnotator, PDFScale } from '@recogito/pdf-annotator';

import '@recogito/pdf-annotator/pdf-anntator.css';
import './PDFAnnotator.css';

export type PDFAnnotatorProps<E extends unknown> = TextAnnotatorOptions<E> & {

  children?: ReactNode | JSX.Element;

  formatter?: Formatter;

  pdfUrl: string;

  pageSize?: PDFScale | number;

}

export const PDFAnnotator = <E extends unknown>(props: PDFAnnotatorProps<E>) => {

  const { children, formatter, pdfUrl, ...opts } = props;

  const el = useRef<HTMLDivElement>(null);

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {    
    createPDFAnnotator(el.current, pdfUrl, opts)
      .then(anno => {
        anno.setFormatter(props.formatter);
        setAnno(anno);
      });
  }, []);

  useEffect(() => {
    if (props.pageSize && anno)
      (anno as VanillaPDFAnnotator).setScale(props.pageSize);
  }, [props.pageSize])

  useEffect(() => {
    if (!anno)
      return;
    
    anno.setFormatter(props.formatter);
  }, [props.formatter]);

  return (
    <div 
      ref={el} 
      className="r6o-pdf-container">
      {children}
    </div>
  )

}