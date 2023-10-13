import React, { useEffect } from 'react';
import { useAnnotator } from '@annotorious/react';
import { PDFAnnotator } from '../src';

export const App = () => {

  const anno = useAnnotator();

  useEffect(() => {
    if (anno)
      anno.loadAnnotations('annotations.json');
  }, [anno]);

  return (
    <PDFAnnotator 
      pdfUrl="compressed.tracemonkey-pldi-09.pdf" />
  )

}