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
- **Cloud Storage**: Save and load presentations from OneDrive or Google Drive
- **OAuth Authentication**: Sign in with Microsoft or Google accounts
- **AI Integration**: (Experimental) AI-assisted content generation.

## Tech Stack

- **Core**: Vanilla JavaScript (ES Modules)
- **Build**: Vite
- **Testing**: Vitest
- **Styling**: CSS Modules & Variables
- **Animation**: Anime.js
- **Icons**: FontAwesome

## Getting Started

Prereqs:
- Node.js 22.x (see `.nvmrc` / `package.json#engines`)
- Node.js 18+ is the minimum supported by Vite 5

1. **Clone the repository**
   ```bash
   git clone https://github.com/prabinpebam/story.git
   cd story
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

   (If you don't have a lockfile or are modifying dependencies, use `npm install` instead.)

3. **Configure OAuth (optional)**
   
   To enable sign-in with Microsoft/Google:
   ```bash
   cp .env.example .env
   # Edit .env with your OAuth client IDs
   ```
   See [OAuth Setup Guide](./documentation/oauth-setup-guide.md) for detailed instructions.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to `http://localhost:5173`

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
story/
├── index.html          # Entry point
├── src/
│   ├── main.js         # Application initialization
│   ├── core/           # Core logic (Renderer, Store, Input, Auth, etc.)
│   ├── ui/             # UI Components (Toolbar, Property Inspector, etc.)
│   ├── utils/          # Helper functions
│   └── ...
├── styles/             # CSS modules
├── tests/              # Unit and integration tests
├── documentation/      # Project documentation and plans
└── ...
```

