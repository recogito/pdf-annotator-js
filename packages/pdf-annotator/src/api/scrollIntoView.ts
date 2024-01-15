import type { TextAnnotator } from '@recogito/text-annotator';
import type { EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';
import type { PDFAnnotation } from 'src/PDFAnnotation';

export const scrollIntoView = <E extends unknown>(
  anno: TextAnnotator<E>, 
  eventBus: EventBus
) => (annotation: PDFAnnotation) => {  
  const p = annotation.target.selector.pageNumber;

  // Always scroll to page first
  const page = document.querySelector(`.page[data-page-number="${p}"]`);
  page?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const success = anno.scrollIntoView(annotation);

  // If the jump wasn't successful, just jump to the page
  // instead. (The annotation wasn't rendered, but PDF.js
  // will have created the page container DIV already!)
  if (!success) {
    // We'll listen to textlayerrendered events until our target page (+1) comes up
    const onTextLayerRendered =  ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === p) {
        // Follow up scroll
        setTimeout(() => anno.scrollIntoView(annotation), 500);

        // Unregister this listener
        eventBus.off('textlayerrendered', onTextLayerRendered);
      }
    }

    eventBus.on('textlayerrendered', onTextLayerRendered);  

    // Just to ensure we don't have dangling listeners
    setTimeout(() => eventBus.off('textlayerrendered', onTextLayerRendered), 2000);
  }

}