# Feature Spec: AI Assisted Creation

## 1. Overview
The AI Copilot acts as a creative partner, assisting with content generation, design refinement, and complex code generation for backgrounds.

## 2. Configuration
- **Settings Panel:**
    - **Provider:** Dropdown (OpenAI, Anthropic, Local LLM).
    - **API Key:** Secure input field (stored in `localStorage` or encrypted).
    - **Base URL:** Option to point to a proxy or custom endpoint.
    - **Model:** Select specific models (e.g., GPT-4o, Claude 3.5 Sonnet).

## 3. Content Copilot
### 3.1 Text Refinement
- **Trigger:** Select a text box -> Click "AI" icon in the toolbar.
- **Actions:**
    - **Summarize:** Shorten the text to bullet points.
    - **Expand:** Elaborate on a point.
    - **Tone Shift:** "Make it Professional", "Make it Witty", "Make it Minimal".
    - **Translate:** Convert text to another language.

### 3.2 Layout Intelligence
- **Trigger:** "Auto-Layout" button.
- **Function:** Analyzes the elements on the slide and rearranges them based on design principles (Grid, Hierarchy, Balance).
- **Implementation:** Heuristic-based or LLM-based (sending element bounding boxes as JSON to the model).

## 4. Code-Based Background Generator
This is the most advanced AI feature.
- **Interface:** A chat-like prompt box in the Background panel.
- **Workflow:**
    1.  User types: "A retro synthwave grid that moves towards the horizon, neon pink and blue."
    2.  AI generates JavaScript/Canvas code.
    3.  Code is automatically injected into the **Code-Based Background** engine.
    4.  Live preview updates.
- **Refinement:**
    - User can say: "Make the grid lines thicker" or "Change pink to purple".
    - AI modifies the existing code and re-injects it.
- **Exclusive Code Mode:**
    - Users can click "View Code" to see what the AI wrote and manually tweak it.

## 5. Slide Generation (Future)
- **Prompt to Deck:** "Create a pitch deck for a coffee shop."
- **Output:** Generates 5-10 slides with placeholder text and images structured logically.
