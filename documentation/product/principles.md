# Principles
If you are making any updates or changes to the codebase, the following principles should be respected.

The [Story Product Specification](product-spec.md) is the governing product contract. The [Capability Audit](capability-audit.md) records current evidence, and the [Delivery Roadmap](delivery-roadmap.md) defines dependency order. A domain specification may add detail but may not weaken that contract.

## App integrity
- Small incremental changes
- Mandatory validation with test
    - Use vitest and not jest
- Always call out risks, dependencies and have mitigation plan
- Do not claim implementation from a specification, module, control label, or test filename alone
- Route every document mutation through the canonical transaction model
- Preserve behavior across undo/redo, native-file reopen, collaboration, presentation, and output surfaces

## Design & craft
- Extremely important!!
    - Always stick to the global Design system
    - Always use global CSS variables
    - Always use global common components
    - Avoid inline styles and any local solution
    - UI should always work for Dark and Light mode
    - Do not make duplicate components, use variants instead
- Review IA and relevance of the update/change to IA whenever applicable
- User flows and task flows must be simple and intuitive

### The Goal: One Singular App
- Review the Design system
- Look for scope to make the Design language consistent
- It's OK to revisit older components to make it scale to accommodate new features
- Do a thorough analysis of how a coherent look can be maintained

### Theming as Litmus Test
The design system is only as good as its ability to support multiple themes.

**Theme = Color + Font + Spacing**
- Each theme has its own light and dark mode variants
- A theme is not just colors - it includes typography and spacing
- If the app breaks when switching themes, the design system has hardcoded values

**The Test:**
1. Switch accent color from blue to purple
2. All hover states should turn purple
3. All selected states should turn purple
4. All focus rings should turn purple
5. If ANY blue remains → hardcoded value found

**Planned Themes:**
| Theme | Description |
|-------|-------------|
| Story Default | Current dark-first theme |
| Minimal | Tighter spacing, smaller text |
| Vibrant | Bolder colors, larger targets |
| Corporate | Conservative palette, serif headers |

### Interaction Color Philosophy
- **All interactions use accent color** (not gray)
- Hover = 15% opacity accent (`--color-accent-subtle`)
- Active = 25% opacity accent (`--color-accent-muted`)
- Selected = 100% accent (`--color-accent`)
- This ensures theme switching works perfectly

### Visual Translation Principle
> "If two components solve the same user problem, they should be visually indistinguishable."

- Context menus and dropdown menus both = "pick from a list"
- Therefore they MUST look identical
- Same hover color, same padding, same typography

## Security & privacy
- Design every architecture with security & privacy as the foundation

## Performance
- Performance standard should be set and the experience should never go below the benchmark
- Keep unrelated I/O, indexing, serialization, and network work out of interaction hot paths
- Benchmark realistic small, medium, large, and prolonged-use documents

## Feature compatibility with undo/redo system
- Whenever applicable, always ensure the change/update is compatible with the existing undo/redo system.
- Call out if the undo/redo system needs to be modified to accommodate the new requirements.

## Feature compatibility files storage and serialization
- Whenever applicable, always ensure the change/update is compatible with file storage and serialization.

## Feature compatibility files storage and realtime collaboration
- Whenever applicable, always ensure the change/update is compatible with realtime collaboration.