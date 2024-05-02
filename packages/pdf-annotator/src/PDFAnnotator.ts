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
  TextAnnotation, 
  TextAnnotationStore, 
  TextAnnotatorOptions, 
  TextAnnotator, 
  createTextAnnotator
} from '@recogito/text-annotator';
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import { addResizeObserver } from './responsive';
import type { PDFScale } from './PDFScale';
import { createPDFStore } from './state';
import { createAPI } from './api';

import 'pdfjs-dist/web/pdf_viewer.css';
import '@recogito/text-annotator/dist/text-annotator.css';
import './PDFAnnotator.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
  // Container needs a DIV child - cf:
  // https://github.com/mozilla/pdf.js/blob/master/examples/components/simpleviewer.html
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

  eventBus.on('pagesinit', () => {    
    // Default to scale = auto
    pdfViewer.currentScaleValue = 'auto';

    const anno = createTextAnnotator(viewerContainer, {
      ...opts,
      offsetReferenceSelector: '.page'
    }); 

    const store = createPDFStore(anno.state.store as TextAnnotationStore);

    // Listen to the first 'textlayerrendered' event (once)
    const onInit = () => {
      resolve({
        ...anno,
        get currentScale() { return pdfViewer.currentScale },
        get currentScaleValue() { return pdfViewer.currentScaleValue },
        ...createAPI(anno, pdfViewer, eventBus)
      } as PDFAnnotator<E>);

      eventBus.off('textlayerrendered', onInit);
    }

    eventBus.on('textlayerrendered', onInit);  

    eventBus.on('textlayerrendered', ({ pageNumber }: { pageNumber: number }) =>
      store.onLazyRender(pageNumber));
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
    const { currentScaleValue } = pdfViewer;
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