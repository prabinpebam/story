# Story - Presentation Maker

Story is a modern, web-based presentation tool built with vanilla JavaScript. It provides a powerful visual editor for creating interactive and animated presentations directly in the browser.

## Features

- **Visual Editor**: Intuitive drag-and-drop interface for manipulating elements on the canvas.
- **Slide Management**: Create, duplicate, and reorder slides easily.
- **Master Slides & Layouts**: Define global styles and layouts using a robust Master Slide system.
- **Rich Property Inspector**:
  - **Fills**: Support for multiple fill layers (Solid, Gradient, Image, Mesh Gradient, Code).
  - **Strokes**: Multiple stroke layers with customizable styles (Dashed, Dotted).
  - **Effects**: Drop shadows, blurs, and other visual effects.
  - **Typography**: Comprehensive text styling options.
- **Layer Management**: A dedicated layer tree to manage element hierarchy and visibility.
- **Presentation Mode**: Full-screen playback with smooth transitions and animations.
- **AI Integration**: (Experimental) AI-assisted content generation.

## Tech Stack

- **Core**: Vanilla JavaScript (ES Modules)
- **Styling**: CSS Modules & Variables
- **Animation**: Anime.js
- **Icons**: FontAwesome

## Getting Started

Since this project uses native ES Modules, you need to serve it using a local web server to avoid CORS issues with file imports.

1. **Clone the repository**
   ```bash
   git clone https://github.com/prabinpebam/story.git
   cd story
   ```

2. **Start a local server**
   You can use any static file server. Examples:

   **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   ```

   **Using Node.js (http-server):**
   ```bash
   npx http-server .
   ```

   **Using VS Code:**
   Install the "Live Server" extension and click "Go Live".

3. **Open in Browser**
   Navigate to `http://localhost:8000` (or the port shown by your server).

## Project Structure

```
story/
├── index.html          # Entry point
├── src/
│   ├── main.js         # Application initialization
│   ├── core/           # Core logic (Renderer, Store, Input, etc.)
│   ├── ui/             # UI Components (Toolbar, Property Inspector, etc.)
│   ├── utils/          # Helper functions
│   └── ...
├── styles/             # CSS modules
├── documentation/      # Project documentation and plans
└── ...
```

