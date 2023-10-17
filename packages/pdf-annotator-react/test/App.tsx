import React, { useEffect } from 'react';
import { useAnnotations, useAnnotator } from '@annotorious/react';
import { PDFAnnotator } from '../src';

export const App = () => {

  const anno = useAnnotator();

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
          <li key={annotation.id}>
            {annotation.target.selector.quote}
          </li>
        ))}
      </ul>
    </>
  )

}