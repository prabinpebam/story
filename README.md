# Story - Presentation Design Environment

Story is a professional, browser-based presentation design environment. Its product goal combines Figma-class design capability with PowerPoint-class presentation capability in one document and one authoring workflow.

- A Figma user should feel at home creating precise, reusable visual design.
- A PowerPoint user should feel at home structuring, rehearsing, delivering, and exporting a presentation.

The governing requirements, current audit, and delivery sequence are documented in:

- [Product Specification](./documentation/product/product-spec.md)
- [Complete Specification System](./documentation/product/specification/README.md)
- [R1 Preview Profile](./documentation/product/specification/profiles/R1-preview.md)
- [Familiarity and Story-Native Benchmark](./documentation/product/specification/benchmarks/familiarity-and-story-native.md)
- [Capability Audit](./documentation/product/capability-audit.md)
- [Requirement Status](./documentation/product/requirement-status.md)
- [Delivery Roadmap](./documentation/product/delivery-roadmap.md)
- [Documentation Guide](./documentation/README.md)

## Current Foundation

- **Visual Editor**: Direct manipulation, selection, transforms, snapping, vector editing, booleans, and masks.
- **Slide Management**: Create, duplicate, and reorder slides easily.
- **Master Slides & Layouts**: Define global styles and layouts using a robust Master Slide system.
- **Rich Property Inspector**:
  - **Fills**: Support for multiple fill layers (Solid, Gradient, Image, Mesh Gradient, Code).
  - **Strokes**: Multiple stroke layers with customizable styles (Dashed, Dotted).
  - **Effects**: Drop shadows, blurs, and other visual effects.
  - **Typography**: Comprehensive text styling options.
- **Layer Management**: A dedicated layer tree to manage element hierarchy and visibility.
- **Presentation Mode**: Full-screen playback with smooth transitions and animations.
- **Presenter Workflow**: Speaker notes, Presenter View, timings, navigation, transitions, and Morph.
- **Cloud Foundation**: OneDrive and Google Drive providers with Microsoft and Google authentication.
- **AI Integration**: (Experimental) AI-assisted content generation.

This list describes the strongest current foundations, not completion of the full product goal. See the capability audit for verified, partial, specified-only, and missing areas.

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
   See [OAuth Setup Guide](./documentation/guides/oauth-setup-guide.md) for detailed instructions.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to `http://localhost:5173`

## Testing

```bash
# Validate the complete product specification graph
npm run spec:validate
```

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

