import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';

interface Point { x: number, y: number };

const clientPointToPDFPoint = (pt: Point, page: pdfjsViewer.PDFPageView): Point => {
  const { canvas } = page;

  const { left, top } = canvas.getBoundingClientRect();

  const { offsetWidth, offsetHeight } = canvas;

  const offsetX = pt.x - left;
  const offsetY = pt.y - top;

  // PDF viewport height, width and scale
  const { height, width, scale } = page.viewport;

  // Canvas and PDF coords are flipped in Y axis
  const bottom = canvas.offsetHeight - offsetY;

  const pdfX = width * offsetX / offsetWidth / scale;
  const pdfY = height * bottom / offsetHeight / scale;

  const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
  return { x: round(pdfX), y: round(pdfY) };
}

const rectToQuadPoints = (rect: DOMRect, page: pdfjsViewer.PDFPageView) => {
  // QuadPoint-compliant: starting bottom-left, counter-clockwise.
  const p1 = { x: rect.left, y: rect.bottom };
  const p2 = { x: rect.right, y: rect.bottom };
  const p3 = { x: rect.right, y: rect.top };
  const p4 = { x: rect.left, y: rect.top };

  const pdfPoints = [p1, p2, p3, p4].map(pt => clientPointToPDFPoint(pt, page));

  return pdfPoints.reduce<number[]>((qp, point) => {
    return [...qp, point.x, point.y];
  },[]);
}

export const getQuadPoints = (rects: DOMRect[], page: pdfjsViewer.PDFPageView) =>
  rects.reduce<number[]>((qp, rect) => [...qp, ...rectToQuadPoints(rect, page)], []);