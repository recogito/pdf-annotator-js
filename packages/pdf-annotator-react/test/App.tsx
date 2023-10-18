import React, { useEffect } from 'react';
import { useAnnotations, useAnnotator } from '@annotorious/react';
import { PDFAnnotator } from '../src';
import { PDFAnnotator as VanillaPDFAnnotator } from '@recogito/pdf-annotator';

export const App = () => {

  const anno = useAnnotator<VanillaPDFAnnotator>();

  const annotations = useAnnotations();

  useEffect(() => {
    if (anno)
      anno.loadAnnotations('annotations.json');
  }, [anno]);

  return (
    <>
      <PDFAnnotator 
        pdfUrl="compressed.tracemonkey-pldi-09.pdf" />

      <ul className="annotation-list">
        {annotations.map(annotation => (
          <li key={annotation.id} onClick={() => anno.scrollIntoView(annotation)}>
            {annotation.target.selector.pageNumber} : {annotation.target.selector.quote}
          </li>
        ))}
      </ul>
    </>
  )

}