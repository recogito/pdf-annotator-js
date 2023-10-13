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
  Annotator, 
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

import 'pdfjs-dist/web/pdf_viewer.css';

import '@recogito/text-annotator/dist/text-annotator.css';
import './PDFAnnotator.css';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url);

const CMAP_URL = 'pdfjs-dist/cmaps/';
const CMAP_PACKED = true;

const ENABLE_XFA = true;

export interface PDFAnnotator<T extends unknown = TextAnnotation> extends Annotator<TextAnnotation, T> {

  // For future use

}

export const createPDFAnnotator = (
  container: HTMLDivElement, 
  pdfURL: string,
  opts: TextAnnotatorOptions
): Promise<PDFAnnotator> => new Promise((resolve, reject) => {
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

  let anno: TextAnnotator;

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

  const toPDF = (annotation: TextAnnotation): PDFAnnotation => {
    const { target } = annotation;

    return {
      ...annotation,
      target: toPDFTarget(target)
    };
  }

  eventBus.on('pagesinit', () => {
    // 'auto' | 'page-fit' | 'page-actual' | 'page-width'
    pdfViewer.currentScaleValue = 'page-width';

    anno = createTextAnnotator(viewerContainer, {
      ...opts,
      offsetReferenceSelector: '.page'
    }); 

    const store = anno.state.store as TextAnnotationStore;

    const revive = (a: PDFAnnotation | TextAnnotation): PDFAnnotation => {
      const { selector } = a.target;

      const hasValidOffsetReference = 
        'offsetReference' in selector && 
        selector.offsetReference instanceof HTMLElement;

      if (hasValidOffsetReference) {
        if ('pageNumber' in selector) {
          // Already a PDF annotation - doesn't need reviving
          return a as PDFAnnotation;
        } else {
          return toPDF(a);
        }
      } else if ('pageNumber' in selector) {
        const { pageNumber } = selector;

        const offsetReference: HTMLElement = document.querySelector(`.page[data-page-number="${pageNumber}"]`);
  
        return {
          ...a,
          target: {
            ...a.target,
            selector: {
              ...a.target.selector,
              offsetReference
            } as PDFSelector
          }
        };
      } else { 
        // Has neither offsetReference - shouldn't happen
        console.warn('Invalid PDF annotation', a);
        return a as PDFAnnotation;
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
      _updateAnnotation(toPDF(annotation), origin);
  
    const _updateTarget = store.updateTarget;
    store.updateTarget = (target: PDFAnnotationTarget | TextAnnotationTarget, origin = Origin.LOCAL) => 
      _updateTarget(toPDFTarget(target), origin);
  });

  // Listen to the first 'textlayerrendered' event
  const onInit = () => {
    resolve(anno);
    eventBus.off('textlayerrendered', onInit);
  }

  eventBus.on('textlayerrendered', onInit);  

  eventBus.on('textlayerrendered', (evt: any) => {
    if (unrendered.length > 0)
      anno.state.store.bulkAddAnnotation(unrendered, false, Origin.REMOTE);
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

  addResizeObserver(container, () => pdfViewer.currentScaleValue = 'page-width');
});