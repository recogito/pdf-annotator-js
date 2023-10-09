import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, Formatter } from '@annotorious/react';
import { TextAnnotatorOptions } from '@recogito/text-annotator';
import { createPDFAnnotator } from '@recogito/pdf-annotator';

import '@recogito/pdf-annotator/pdf-anntator.css';
import './PDFAnnotator.css';

export type PDFAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode;

  formatter?: Formatter;

  pdfUrl: string;

}

export const PDFAnnotator = (props: PDFAnnotatorProps) => {

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