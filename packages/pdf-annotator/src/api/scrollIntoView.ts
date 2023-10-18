import type { TextAnnotator } from '@recogito/text-annotator';
import type { EventBus } from 'pdfjs-dist/web/pdf_viewer';
import type { PDFAnnotation } from 'src/PDFAnnotation';

export const scrollIntoView = <E extends unknown>(
  anno: TextAnnotator<E>, 
  eventBus: EventBus
) => (annotation: PDFAnnotation) => {
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