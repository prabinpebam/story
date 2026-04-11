# 26 — AI Features

> Taskflows for AI-powered content generation, code fills, layout suggestions, and prompt refinement.

## AI Service Configuration

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| AI-01 | Configure AI provider | Settings → AI provider | Provider set: OpenAI, Anthropic (Claude), or Azure OpenAI; persisted in localStorage | — |
| AI-02 | Set API key | Enter API key in settings | Key stored in localStorage; used for all subsequent AI calls | — |
| AI-03 | Set model | Select model (default: gpt-4o) | Model used for `generate(prompt, context)` calls; temperature 0.7 | — |

## Code Fill AI Generation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| AI-04 | Generate code fill | Enter prompt → click Generate in CodeTab Custom | AI generates `{init, draw}` object with canvas render function; preview updates on 240×140 canvas | `UPDATE_ELEMENT({style:{fills}})` |
| AI-05 | Update code fill | Enter modification prompt → click Update | AI modifies existing code using CODE_FILL_UPDATE_PROMPT template | `UPDATE_ELEMENT({style:{fills}})` |
| AI-06 | Refine prompt | Refine checkbox enabled → Generate | PROMPT_REFINEMENT_PROMPT transforms vague input into detailed visual description before generation | — |
| AI-07 | Code fill mouse API | Code fill with interactivity | Generated code receives mouse object: x, y, nx, ny, px, py, isDown, pressed, released, vx, vy, isOver, distFromCenter, angleFromCenter | — |

## Code Background Generation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| AI-08 | Generate background code | AI prompt for background | CODE_BACKGROUND_PROMPT generates `render(ctx, w, h, time)` function | — |

## Content & Layout AI

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| AI-09 | Refine text content | Select text → AI refine | CONTENT_REFINEMENT_PROMPT rewrites with specified tone (clarity/impact) | — |
| AI-10 | Suggest layout | AI layout suggestion | LAYOUT_SUGGESTION_PROMPT analyzes slide elements JSON, suggests positioning | — |
