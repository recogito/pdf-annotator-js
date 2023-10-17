import React, { useEffect } from 'react';
import { useAnnotations, useAnnotator } from '@annotorious/react';
import { PDFAnnotator } from '../src';
import { PDFAnnotation, PDFAnnotator as VanillaPDFAnnotator } from '@recogito/pdf-annotator';

export const App = () => {

  const anno = useAnnotator<VanillaPDFAnnotator>();

  const annotations = useAnnotations();

  useEffect(() => {
    if (anno)
      anno.loadAnnotations('annotations.json');
  }, [anno]);

  const jumpTo = (annotation: PDFAnnotation) => () => {
    const success = anno.scrollIntoView(annotation);

    if (!success) {
      // If the jump wasn't successful, just jump to the page
      // instead. (The annotation wasn't rendered, but PDF.js
      // will have created the page container DIV already!)
      const { pageNumber } = annotation.target.selector;

      let timeout: number; 

      const onScroll = (evt: Event) => {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          onScrollComplete();
        }, 100);
      };

      const onScrollComplete = () => {
        anno.scrollIntoView(annotation);
        document.removeEventListener('scroll', onScroll, true);
      }

      document.addEventListener('scroll', onScroll, true);

      const page = document.querySelector(`.page[data-page-number="${pageNumber}"]`);
      page?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return (
    <>
      <PDFAnnotator 
        pdfUrl="compressed.tracemonkey-pldi-09.pdf" />

      <ul className="annotation-list">
        {annotations.map(annotation => (
          <li key={annotation.id} onClick={jumpTo(annotation)}>
            {annotation.target.selector.pageNumber} : {annotation.target.selector.quote}
          </li>
        ))}
      </ul>
    </>
  )

}