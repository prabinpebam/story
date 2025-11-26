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

## Available Variables (globally available in scope):
- ctx: CanvasRenderingContext2D - The 2D drawing context
- canvas: HTMLCanvasElement - The canvas element (access .width and .height)
- mouse: Object - Mouse state with the following properties:
  - mouse.x, mouse.y: Position in canvas pixels (0 to width/height)
  - mouse.nx, mouse.ny: Normalized position (0 to 1)
  - mouse.px, mouse.py: Previous frame position
  - mouse.isDown: Boolean, true if mouse button is held
  - mouse.pressed: Boolean, true only on the frame of click
  - mouse.released: Boolean, true only on the frame of release
  - mouse.vx, mouse.vy: Velocity in pixels per second
  - mouse.isOver: Boolean, true if mouse is over this element
  - mouse.distFromCenter: Distance from canvas center in pixels
  - mouse.angleFromCenter: Angle from canvas center in radians

## Required Format:
return {
    // Optional: initialization (called once)
    init: function() {
        this.myState = [];
    },
    
    // Required: called every frame
    draw: function(t) {
        // t is time in seconds (float)
        const w = canvas.width;
        const h = canvas.height;
        
        // Your drawing code using ctx...
        // Access mouse state via the 'mouse' object
    }
};

## Requirements:
- The animation should match this description: "{description}"
- Use the mouse object for any interactive behavior
- Do not use external libraries
- Be creative, visual, and performant
- Return ONLY valid JavaScript code. No markdown, no explanations.

## Mouse Interaction Examples:
- Particles that follow the cursor: use mouse.x, mouse.y
- Effects on click: check mouse.pressed
- Drag interactions: check mouse.isDown with mouse.x, mouse.y
- Trail effects: use mouse.px, mouse.py for previous position
- Hover effects: check mouse.isOver
`;

export const CODE_FILL_UPDATE_PROMPT = `
You are an expert Generative Art coder.
Update the following existing code based on the user's request.

Existing Code:
{existingCode}

User Request: "{request}"

## Available Variables:
- ctx: CanvasRenderingContext2D
- canvas: HTMLCanvasElement
- mouse: Object with properties (x, y, nx, ny, px, py, isDown, pressed, released, vx, vy, isOver, distFromCenter, angleFromCenter)

Requirements:
- Keep the structure (return object with draw function, optional init).
- Use the mouse object for any interactive behavior requests.
- Modify the code to satisfy the request.
- Return ONLY the valid JavaScript code. No markdown.
`;

export const PROMPT_REFINEMENT_PROMPT = `
You are an expert prompt engineer for generative art code.
Your task is to refine the user's prompt into a detailed, specific instruction for generating canvas animation code.

User Prompt: "{userPrompt}"

Guidelines:
1. Make it specific and detailed suitable for a code generation model.
2. Clarify vague terms (e.g., "cool background" -> "dynamic particle system with glowing trails").
3. Ensure NO specific details from the original prompt are lost.
4. Focus on visual description, motion, colors, and behavior.
5. Return ONLY the refined prompt text. No explanations.
`;
