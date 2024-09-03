import type { PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { scrollIntoView as _scrollIntoView } from '@recogito/text-annotator';
import { PDFAnnotation } from '../PDFAnnotation';
import { PDFAnnotationStore } from '../state/PDFAnnotationStore';

export const scrollIntoView = (
  viewer: PDFViewer,
  viewerElement: HTMLDivElement,
  store: PDFAnnotationStore
) => (annotation: PDFAnnotation) => {
  const p = annotation.target.selector[0].pageNumber;
  const page = document.querySelector(`.page[data-page-number="${p}"]`);

  setTimeout(() => {
    // Scroll to page first
    page?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) ;

    // Then scroll to the annotation
    const success = _scrollIntoView(viewerElement, store)(annotation);

    // If the jump wasn't successful, just jump to the page instead. 
    // The annotation wasn't rendered, but there is at least the (empty)
    // page container DIV.
    if (!success) {
      // We'll listen to textlayerrendered events until our target page (+1) comes up
      const onTextLayerRendered =  ({ pageNumber }: { pageNumber: number }) => {
        if (pageNumber === p) {
          // Follow up scroll
          setTimeout(() => _scrollIntoView(viewerElement, store)(annotation), 500);

          // Unregister this listener
          viewer.eventBus.off('textlayerrendered', onTextLayerRendered);
        }
      }

      viewer.eventBus.on('textlayerrendered', onTextLayerRendered);  

      // Just to ensure we don't have any dangling listeners
      setTimeout(() => viewer.eventBus.off('textlayerrendered', onTextLayerRendered), 2000);
    }
  }, 1);

  // Not really true. More like 'I've done my best'. But needed to statisfy the interface.
  return true;
}