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
import type { Annotator } from '@annotorious/core';
import { TextAnnotation, TextAnnotator, TextAnnotatorOptions } from '@recogito/text-annotator';
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer';

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

  eventBus.on('pagesinit', () => {
    // We can use pdfViewer now, e.g. let's change default scale.
    pdfViewer.currentScaleValue = 'page-width';

    const anno = TextAnnotator(viewerContainer, opts);    
    resolve(anno);
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
});