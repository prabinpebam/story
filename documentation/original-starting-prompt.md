# Original prompt, Dont change
(Just for record)
This should be a modern presentation maker.

# Features
- All the major slide management and presentation fucntionalities
- Master slides
- Transitions
     - Fade
     - morph/smart animate
     - others
- Advanced formatting options for text and paragraph
- Text styles
- Font selection, system fonts and web fonts
- Icon's library from free-to-use icons from places like fontawesome and the noun project. 
- Layout management, snapping, arrange align.
- Layer management
- Image cropping, adjustments, filters
- Rich background for slide
    - Images
    - dynamically generated mesh gradient with controolable parameters
    - regular gradients like liners, radial, conical etc.
    - Interactive code based background using html canvas optimization.
- Clear edit and presentation mode
- Scalable UI modal that consistently presents various objects to be edited and their control presented in an intuitive manner.
- AI assisted creation
    - Setup
        - Add api link and key and other option
        - Prompting that helps in refining slide content, design and background.
        - Prompting that explicitly allows advance code based customization of the slide background. Exclusive code preview and editing mode for slide background. Allow use of libraries.

# Tech spec
- Plain html css js
- Use libraries if required
- use https://animejs.com/documentation/ for animation
- No typescript
- Make it scalable
- Keep individual files modular and preferrably less than 500 lines.

# UI
- **Design System:** "Tactile Precision" (See [UI Design System](./specs/design-system/ui-design-system.md))
- **Theme:** Dark Mode default, High Contrast.
- **Layout:** 4-Zone Workspace (Rail, Stage, Inspector, Dock).
- **Aesthetics:** Teenage Engineering inspired (Industrial, Functional).