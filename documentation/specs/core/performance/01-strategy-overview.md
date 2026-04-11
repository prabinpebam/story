# Progressive Loading Strategy: Overview

## Goal
To optimize the **perceived performance** of the application by prioritizing the rendering of critical visual elements. The objective is to reduce the time users spend staring at a blank screen or a generic loader, and instead provide immediate visual feedback that the app is responsive and loading their specific context.

## Core Principles Alignment
- **Performance**: We aim to lower the Time to First Paint (TTFP) and Time to Interactive (TTI) metrics, ensuring the experience meets our high performance benchmarks.
- **Design & Craft**: The loading sequence must be smooth, flicker-free, and visually coherent with the user's chosen theme. No jarring transitions or "default theme" flashes.
- **App Integrity**: Changes will be modular, separating the boot process into distinct, testable phases.
- **Resilience**: The strategy must account for network failures or slow connections. Users should never be stuck in an infinite loading state without feedback.

## The Loading Sequence
The application load process is broken down into four distinct phases, designed to execute sequentially to manage user attention and system resources.

1.  **Phase 1: Immediate Boot (The Anchor)**
    - **Visual**: App logo centered in the viewport.
    - **Goal**: Instant feedback (< 100ms) that the URL has hit and the app is alive.

2.  **Phase 2: Theme Hydration (The Context)**
    - **Visual**: Background colors and basic layout variables are applied.
    - **Goal**: Prevent "Flash of Default Theme". The app must render in the user's preferred theme (Dark/Light/Custom) immediately.

3.  **Phase 3: App Shell & Shimmers (The Structure)**
    - **Visual**: The App Chrome (Toolbar, Sidebar, Property Pane) renders with "Shimmer" placeholders.
    - **Goal**: Establish layout stability (Zero CLS) and indicate where content will appear.

4.  **Phase 4: Content Hydration (The Substance)**
    - **Visual**: The active slide renders, followed by UI panel contents, then background caching.
    - **Goal**: Prioritize what the user needs to see *now* (the active slide) over what they might need *later* (slide 50).

## Success Metrics
- **First Contentful Paint (FCP)**: < 500ms (Logo)
- **Theme Applied**: < 100ms (Blocking script in head)
- **App Shell Visible**: < 1000ms
- **Active Slide Interactive**: < 2000ms
