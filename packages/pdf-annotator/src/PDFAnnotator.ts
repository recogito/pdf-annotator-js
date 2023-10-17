// Modified from https://github.com/mozilla/pdf.js/blob/master/examples/components/simpleviewer.js

/* Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { 
  Origin, 
  TextAnnotation, 
  TextAnnotationStore, 
  TextAnnotatorOptions, 
  TextAnnotator, 
  TextAnnotationTarget,
  createTextAnnotator } from '@recogito/text-annotator';
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer';
import { addResizeObserver } from './responsive';
import type { PDFAnnotation, PDFAnnotationTarget, PDFSelector } from './PDFAnnotation';
import type { PDFScale } from './PDFScale';

import 'pdfjs-dist/web/pdf_viewer.css';
import '@recogito/text-annotator/dist/text-annotator.css';
import './PDFAnnotator.css';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url);

const CMAP_URL = 'pdfjs-dist/cmaps/';
const CMAP_PACKED = true;

const ENABLE_XFA = true;

export interface PDFAnnotator<E extends unknown = TextAnnotation> extends TextAnnotator<E> {

  currentScale: number;

  currentScaleValue: string | undefined;

  setScale(scale: PDFScale | number): number;

  zoomIn(percentage?: number): number;

  zoomOut(percentag?: number): number;

}

export const createPDFAnnotator = <E extends unknown = TextAnnotation>(
  container: HTMLDivElement, 
  pdfURL: string,
  opts: TextAnnotatorOptions<E>
): Promise<PDFAnnotator<E>> => new Promise((resolve, reject) => {
  // Container needs a DIV child - cf. https://github.com/mozilla/pdf.js/blob/master/examples/components/simpleviewer.html
  const viewerContainer = document.createElement('div');
  viewerContainer.className = 'pdfViewer';

  container.appendChild(viewerContainer);

  const eventBus = new pdfjsViewer.EventBus();

  // (Optionally) enable hyperlinks within PDF files.
  const pdfLinkService = new pdfjsViewer.PDFLinkService({
    eventBus
  });

  // (Optionally) enable find controller.
  const pdfFindController = new pdfjsViewer.PDFFindController({
    eventBus,
    linkService: pdfLinkService,
  });

  const pdfViewer = new pdfjsViewer.PDFViewer({
    container,
    eventBus,
    linkService: pdfLinkService,
    findController: pdfFindController
  });

  pdfLinkService.setViewer(pdfViewer);

  // Monkey-patch the anno store instance so we can support PDF.js 
  // lazy page rendering
  let unrendered: TextAnnotation[] = [];

  let anno: TextAnnotator<E>;

  const setScale = (size: PDFScale | number) => { 
    if (typeof size === 'number')
      pdfViewer.currentScale = size;
    else
      pdfViewer.currentScaleValue = size;  

    return pdfViewer.currentScale;
  }

  const zoomIn = (percentage?: number) => {
    const factor = pdfViewer.currentScale + (percentage || 10) / 100;
    pdfViewer.currentScale = Math.min(50, factor);
    return pdfViewer.currentScale;
  }

  const zoomOut = (percentage?: number) => {
    const factor = pdfViewer.currentScale - (percentage || 10) / 100;
    pdfViewer.currentScale = factor;
    return pdfViewer.currentScale;
  }

  const toPDFTarget = (target: TextAnnotationTarget): PDFAnnotationTarget => {
    const { offsetReference } = target.selector;

    const pageNumber = parseInt(offsetReference.dataset.pageNumber);

    return {
      ...target,
      selector: {
        ...target.selector,
        pageNumber 
      }
    };
  }

  eventBus.on('pagesinit', () => {
    // Default to scale = auto
    pdfViewer.currentScaleValue = 'auto';

    anno = createTextAnnotator(viewerContainer, {
      ...opts,
      offsetReferenceSelector: '.page'
    }); 

    const store = anno.state.store as TextAnnotationStore;

    const revive = (a: PDFAnnotation | TextAnnotation): PDFAnnotation => ({
      ...a,
      target: reviveTarget(a.target)
    });

    const reviveTarget = (target: PDFAnnotationTarget | TextAnnotationTarget): PDFAnnotationTarget => {
      const { selector } = target;

      const hasValidOffsetReference = 
        'offsetReference' in selector && 
        selector.offsetReference instanceof HTMLElement;

      if (hasValidOffsetReference) {
        if ('pageNumber' in selector) {
          // Already a PDF annotation target - doesn't need reviving
          return target as PDFAnnotationTarget;
        } else {
          return toPDFTarget(target);
        }
      } else if ('pageNumber' in selector) {
        const { pageNumber } = selector;

        const offsetReference: HTMLElement = document.querySelector(`.page[data-page-number="${pageNumber}"]`);
  
        return {
          ...target,
          selector: {
            ...target.selector,
            offsetReference
          } as PDFSelector
        };
      } else { 
        // Has neither offsetReference - shouldn't happen
        console.warn('Invalid PDF annotation target', target);
        return target as PDFAnnotationTarget;
      }
    }

    const _addAnnotation = store.addAnnotation;
    store.addAnnotation = (annotation: PDFAnnotation | TextAnnotation, origin = Origin.LOCAL) => {
      const revived = revive(annotation);

      const success = _addAnnotation(revived, origin);
      if (!success)
        unrendered = [...unrendered, annotation];

      return success;
    }

    const _bulkAddAnnotation = store.bulkAddAnnotation;
    store.bulkAddAnnotation = (
      annotations: PDFAnnotation[], 
      replace: boolean,
      origin = Origin.LOCAL
    ) => {
      const revived = annotations.map(revive);
      unrendered = _bulkAddAnnotation(revived, replace, origin);
      return unrendered;
    }

    const _updateAnnotation = store.updateAnnotation;
    store.updateAnnotation = (annotation: PDFAnnotation | TextAnnotation, origin = Origin.LOCAL) =>
      _updateAnnotation(revive(annotation), origin);
  
    const _updateTarget = store.updateTarget;
    store.updateTarget = (target: PDFAnnotationTarget | TextAnnotationTarget, origin = Origin.LOCAL) => 
      _updateTarget(reviveTarget(target), origin);
  });

  // Listen to the first 'textlayerrendered' event
  const onInit = () => {
    resolve({
      ...anno,
      get currentScale() { return pdfViewer.currentScale },
      get currentScaleValue() { return pdfViewer.currentScaleValue },
      setScale,
      zoomIn,
      zoomOut
    } as PDFAnnotator<E>);

    eventBus.off('textlayerrendered', onInit);
  }

  eventBus.on('textlayerrendered', onInit);  

  eventBus.on('textlayerrendered', () => {
    if (unrendered.length > 0) {
      // Hack - remove the unrendered annotations from the store, and the
      // attempt to re-add
      const { store } = anno.state;
      store.bulkDeleteAnnotation(unrendered);
      store.bulkAddAnnotation(unrendered, false, Origin.REMOTE);
    }
  });

  pdfjsLib.getDocument({
    url: pdfURL,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    enableXfa: ENABLE_XFA
  }).promise.then(pdfDocument => {
    pdfViewer.setDocument(pdfDocument);
    pdfLinkService.setDocument(pdfDocument);
  }).catch(error => reject(error));

  addResizeObserver(container, () => {
    const { currentScaleValue } = pdfViewer;
    if (
      currentScaleValue === 'auto' ||
      currentScaleValue === 'page-fit' ||
      currentScaleValue === 'page-width'
    ) {
      // Refresh size
      pdfViewer.currentScaleValue = currentScaleValue;
    }

    pdfViewer.update();
  });
});