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

export const CODE_FILL_PROMPT = `
You are an expert Generative Art coder.
Generate a JavaScript object that defines a canvas animation.
The code must return an object with a 'draw' function.

Format:
return {
    draw: function(t) {
        // t is time in seconds
        const w = canvas.width;
        const h = canvas.height;
        // ... drawing code using ctx ...
    }
};

Requirements:
- Use 'ctx' (CanvasRenderingContext2D) which is globally available in the scope.
- Use 'canvas' (HTMLCanvasElement) which is globally available.
- 't' is time in seconds (float).
- The animation should match this description: "{description}"
- Do not use external libraries.
- Be creative and visual.
- Return ONLY the valid JavaScript code. No markdown, no explanations.
`;

export const CODE_FILL_UPDATE_PROMPT = `
You are an expert Generative Art coder.
Update the following existing code based on the user's request.

Existing Code:
{existingCode}

User Request: "{request}"

Requirements:
- Keep the structure (return object with draw function).
- Modify the code to satisfy the request.
- Return ONLY the valid JavaScript code. No markdown.
`;
