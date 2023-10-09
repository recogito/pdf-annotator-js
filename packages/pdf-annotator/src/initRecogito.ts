import { TextAnnotator } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';

export const initRecogito = (container: HTMLDivElement) => {

  const anno = TextAnnotator(container);

}