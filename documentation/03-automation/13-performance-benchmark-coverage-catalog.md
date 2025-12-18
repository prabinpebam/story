# Performance Benchmark Coverage Catalog (Nothing Missed)

This document defines the **required coverage surface** for performance benchmarking. It is meant to prevent “silent omissions” where a subsystem exists in the app but has no benchmark coverage.

It is intentionally split into:
- **V1 required coverage**: the minimum contract we must always track (currently aligned to the registry in `11-performance-benchmark-report.md`).
- **VNext coverage backlog**: the broader subsystem surface that must be added to reach “nothing missed” across the whole app.

The coverage lint reads the machine-readable JSON block below.

---

## 1) Coverage Rules
- Every registry metric must declare a `category`.
- Every `category` must be defined in this catalog.
- Every V1 required category and scenario must exist in the registry.
- VNext items may be absent from the registry, but are explicitly listed here so they can’t be forgotten.

---

## Appendix A — Coverage Catalog (Machine-Readable)

<!-- BENCH_COVERAGE_CATALOG_JSON_START -->
{
  "coverageSpecVersion": 1,
  "v1RequiredCategories": [
    "interaction.selection",
    "interaction.tool_switch",
    "interaction.drag",
    "interaction.typing",
    "interaction.slide_switch",
    "interaction.theme_switch",
    "smoothness.frames",
    "smoothness.longtasks",
    "render.pipeline",
    "render.hittest",
    "startup",
    "memory"
  ],
  "v1RequiredScenarios": [
    "selection.simple_rect",
    "tool_switch.text",
    "drag.simple_shape",
    "typing.simple_text",
    "slide_switch.typical_deck",
    "theme_switch.typical_deck",
    "idle.typical",
    "render.simple_slide",
    "render.complex_slide",
    "startup.warm",
    "soak.60min"
  ],
  "categories": {
    "interaction.selection": {
      "primaryCode": ["src/core/InputManager.js", "src/core/CanvasManager.js", "src/utils/SelectionUtils.js"],
      "notes": "Selection and inspector-ready latency; includes selection pipeline, UI commit, and hit-test path."
    },
    "interaction.tool_switch": {
      "primaryCode": ["src/ui/Toolbar.js", "src/core/InputManager.js"],
      "notes": "Tool switching and first committed UI/tool state."
    },
    "interaction.drag": {
      "primaryCode": ["src/core/InputManager.js", "src/core/CanvasManager.js"],
      "notes": "Pointerdown → first committed drag feedback."
    },
    "interaction.typing": {
      "primaryCode": ["src/core/text"],
      "notes": "Keydown → caret/glyph commit."
    },
    "interaction.slide_switch": {
      "primaryCode": ["src/core/SlideManager.js"],
      "notes": "Slide change → slide state and render fully committed."
    },
    "interaction.theme_switch": {
      "primaryCode": ["src/boot/theme-hydration.js", "src/core"],
      "notes": "Theme change → stable theme application across UI/canvas."
    },
    "smoothness.frames": {
      "primaryCode": ["src/core/AnimationManager.js"],
      "notes": "Frame time distribution in steady and interaction windows."
    },
    "smoothness.longtasks": {
      "primaryCode": ["src/core"],
      "notes": "Long tasks >50ms during interaction windows."
    },
    "render.pipeline": {
      "primaryCode": ["src/core/renderer", "src/core/canvas"],
      "notes": "Render budgets for simple/complex slides."
    },
    "render.hittest": {
      "primaryCode": ["src/core"],
      "notes": "Hit-testing budgets per pointer event."
    },
    "startup": {
      "primaryCode": ["src/main.js", "src/boot"],
      "notes": "Startup time-to-interactive and first committed frame."
    },
    "memory": {
      "primaryCode": ["src/core", "src/ui"],
      "notes": "Soak/leak indicators (heap delta, detached nodes)."
    }
  },
  "vNextBacklog": {
    "coreSubsystems": [
      "history.undo_redo",
      "clipboard.copy_paste",
      "collaboration.sync_latency",
      "export.pdf_png",
      "import.assets",
      "fonts.loading_and_cache",
      "text.layout_rasterization",
      "media.embed",
      "storage.persistence",
      "store.state_updates"
    ],
    "uiSubsystems": [
      "property_inspector.section_toggle",
      "layer_tree.expand_collapse",
      "slide_list.scroll",
      "docs.search" 
    ],
    "notes": "These items must be translated into concrete scenarios/metrics and then promoted into v1Required* when implemented."
  }
}
<!-- BENCH_COVERAGE_CATALOG_JSON_END -->
