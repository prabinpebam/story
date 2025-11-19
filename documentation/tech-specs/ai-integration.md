# Technical Specification: AI Copilot Integration

## 1. Overview
The AI Copilot acts as an intelligent assistant for content generation, design refinement, and code generation for custom backgrounds. It is designed to be model-agnostic, supporting multiple providers via a unified interface.

## 2. Supported Providers
The system will support the following API providers:
- **Azure AI Foundry:** For enterprise-grade scalability and access to various models.
- **OpenAI API:** Access to GPT-4o/GPT-4-turbo for high-quality reasoning.
- **Anthropic Claude API:** Access to Claude 3.5 Sonnet for superior coding capabilities (specifically for the "Code Background" feature).

## 3. Architecture

### 3.1 AI Service Layer (`src/core/ai/AIService.js`)
A singleton service that handles API keys, model selection, and request dispatching.

```javascript
class AIService {
  constructor() {
    this.config = {
      provider: 'openai', // 'azure', 'anthropic'
      apiKey: null,
      endpoint: null, // For Azure
      model: 'gpt-4o'
    };
  }

  async generate(prompt, context = {}) {
    // Strategy pattern to select provider
    const provider = this.getProvider(this.config.provider);
    return await provider.send(prompt, context);
  }
}
```

### 3.2 Prompt Engineering
Prompts are stored as templates in `src/core/ai/prompts/`.
- **Content Refinement:** "Rewrite this text to be more concise/professional..."
- **Layout Suggestion:** "Given these elements, suggest a JSON layout structure..."
- **Background Code:** "Generate a vanilla JS canvas animation that looks like [description]..."

## 4. Features & Implementation

### 4.1 Setup & Configuration
- **UI:** A settings modal tab for "AI Configuration".
- **Storage:** API keys are stored in `localStorage` (encrypted/obfuscated if possible, but client-side only) or session memory. *Note: For a production app, a backend proxy is recommended to hide keys, but for this "Vanilla JS" standalone version, user-provided keys are the standard.*

### 4.2 Content Copilot
- **Trigger:** Context menu on text elements -> "AI Rewrite".
- **Flow:**
    1.  User selects text.
    2.  Selects "Make Professional".
    3.  App sends text + instruction to AI.
    4.  App shows diff/preview.
    5.  User accepts -> Text updates.

### 4.3 Design Copilot (Layouts)
- **Trigger:** "Magic Layout" button in toolbar.
- **Flow:**
    1.  App serializes current slide elements (types, dimensions).
    2.  Sends JSON representation to AI.
    3.  AI returns updated JSON with new coordinates/styles.
    4.  App applies changes with animation.

### 4.4 Code Background Generator (The "Hacker Mode")
This is the most advanced feature, leveraging **Claude 3.5 Sonnet** (recommended) for its coding prowess.

- **Input:** Natural language description (e.g., "A matrix rain effect but in orange and blue").
- **Output:** Executable JavaScript code for the `render(ctx, width, height, time)` function.
- **Safety:** Code is executed in a sandboxed environment (or strict `Function` scope) to prevent crashing the main app.
- **Editor:** A built-in Monaco Editor (or simple textarea) allows the user to tweak the generated code.

## 5. Data Privacy
- No user data is sent to the AI unless explicitly triggered.
- API Keys are strictly local.
