import { PDFAnnotation, PDFAnnotationTarget, PDFSelector } from '../PDFAnnotation';

// Keep track of annotations per page because PDF.js does lazy rendering.
export const createRenderedAnnotationsMap = () => {

  const rendered: Map<number, PDFAnnotation[]> = new Map();

  const upsert = (a: PDFAnnotation) => {
    const pages = a.target.selector.map((s: PDFSelector) => s.pageNumber);
    pages.forEach(p => {
      const current = rendered.get(p) || [];

      const next = [
        ...current.filter(annotation => annotation.id !== a.id),
        a
      ]

      rendered.set(p, next);
    });
  }

  const updateTarget = (t: PDFAnnotationTarget) => {
    const pages = t.selector.map((s:PDFSelector) => s.pageNumber);
    pages.forEach(p => {
      const current = rendered.get(p) || [];

      const next = current.map(a => a.id === t.annotation ? {
        ...a,
        target: t
      } : a);

      rendered.set(p, next);
    });      
  }

  const get = (page: number) => rendered.get(page);

  return { get, upsert, updateTarget };

}