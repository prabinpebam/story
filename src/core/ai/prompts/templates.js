export const CONTENT_REFINEMENT_PROMPT = `
You are a professional editor. Rewrite the following text to be more {tone}.
Keep the meaning the same but improve clarity and impact.
Return ONLY the rewritten text.
`;

export const LAYOUT_SUGGESTION_PROMPT = `
Analyze the following slide elements (JSON) and suggest a better layout.
Apply design principles like alignment, hierarchy, and whitespace.
Return the modified JSON for the elements array.
`;

export const CODE_BACKGROUND_PROMPT = `
Generate a vanilla JavaScript function to render a canvas animation.
The function signature must be:
function render(ctx, width, height, time) { ... }

Requirements:
- Use the 'ctx' (CanvasRenderingContext2D) to draw.
- 'time' is in milliseconds.
- The animation should match this description: "{description}"
- Do not use external libraries.
- Be performant.
- Return ONLY the function body code (inside the function).
`;
