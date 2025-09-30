# Recogito PDF Annotator

A JavaScript library for PDF annotation, using [PDF.js](https://mozilla.github.io/pdf.js/) and the [Recogito Text Annotator](https://github.com/recogito/text-annotator-js).

![Animated screenshot of the Recogito PDF Annotator](/animated-screenshot.gif "Animated screenshot of the Recogito PDF Annotator")

## Installation

```sh
npm install @recogito/pdf-annotator
```


## Quick Start

```js
import { createPDFAnnotator } from '@recogito/pdf-annotator';

var anno = await createPDFAnnotator(
  document.getElementById('container');, 
  'compressed.tracemonkey-pldi-09.pdf'
);

// Load annotations from a file
anno.loadAnnotations('annotations.json');

// Listen to user events
anno.on('createAnnotation', annotation => {
  console.log('new annotation', annotation);
});     
```

## Configuration Options

```js
const anno = createPDFAnnotator(element, url, options);
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `annotatingEnabled` | `boolean` | `true` | Enable or disable interactive creation of new annotations. |
| `dismissOnNotAnnotatable` | `'NEVER' \| 'ALWAYS' \| function` | `'NEVER'` | Controls whether the current selection is dismissed when clicking outside of annotatable content. |
| `mergeHighlights` | `object` | `undefined` | Merge adjacent highlights. Options: `horizontalTolerance` and `verticalTolerance` (in pixels) |
| `selectionMode` | `'shortest' \| 'all'` | `'shortest'` | When the user selects overlapping annotations: select all or only the shortest. |
| `style` | `HighlightStyleExpression` | `undefined` | Custom styling function for highlights. |
| `user` | `User` | anonymous guest | Current user information, automatically added to created or updated annotations. |

## Annotator API

### Properties

#### `currentScale: number`
The current numeric scale value of the PDF viewer.

```js
console.log(anno.currentScale);
```

#### `currentScaleValue: string`
The current scale setting value of the PDF viewer.

```js
console.log(anno.currentScaleValue); // e.g. 'page-fit'
```

### Methods

The PDF annotator supports all the API methods of the [underlying text annotator instance](https://github.com/recogito/text-annotator-js#annotator-api). The following additional methods are available:

#### `setScale(size: PDFScale | number): void`
Sets the PDF viewer scale.

```js
anno.setScale(2);
anno.setScale('page-fit');
```

#### `zoomIn(percentage? number): void`
Zoom the PDF viewer by a given percentage (default: 10).

```js
anno.zoomIn();
```

#### `zoomOut(percentage? number): void`
Zoom the PDF viewer out by a given percentage (default: 10).

```js
anno.zoomOut();
```

### Events

The PDF annotator supports all the events of the [underlying text annotator instance](https://github.com/recogito/text-annotator-js#events).