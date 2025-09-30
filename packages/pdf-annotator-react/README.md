# Recogito React PDF Annotator

## Installation

```sh
npm install @recogito/pdf-annotator @annotorious/react @recogito/react-pdf-annotator
```

## Quick Start

```jsx
import { Annotorious } from '@annotorious/react';
import { PDFAnnotator } from '@recogito/react-pdf-annotator';

export const App = () => {

  return (
    <Annotorious>
      <PDFAnnotator 
        pdfUrl="compressed.tracemonkey-pldi-09.pdf" />
    </Annotorious>
  )

}
```