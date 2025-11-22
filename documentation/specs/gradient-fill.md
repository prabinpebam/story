# Gradient Fill Specification

## 1. Gradient Flyout Panel Features
This panel allows for precise, numerical control over the gradient settings.

* **Gradient Type Selector:** A dropdown menu to select the geometric calculation of the gradient:
    * **Linear:** A straight progression from one side to another.
    * **Radial:** Radiates outward from a center point.
    * **Angular:** Sweeps around a center point (like a radar scan).
    * **Diamond:** Radiates outward in a rhombus shape.
* **Orientation Tools:**
    * **Swap/Reverse:** (Double arrow icon) Swaps the start and end colors instantly.
    * **Rotate:** (Curved arrow icon) Rotates the entire gradient axis by 90 degrees clockwise.
* **Gradient Ramp (Slider):**
    * A visual bar displaying the current color transition.
    * **Teardrop Handles:** Represent "Stops." These can be dragged left/right to change the color distribution (how fast one color blends into another).
* **Stops List (Table View):**
    * **Add Stop Button (+):** Adds a new color stop to the gradient.
    * **Position Input (%):** Numerical field (0-100%) to place a stop precisely.
    * **Color Swatch/Hex:** Displays the color code; clicking the swatch opens the color picker.
        * *Note: The color picker used for stops is a simplified version. It only contains the Solid Color controls (HSB area, sliders, hex input) and excludes the tabs for Gradient, Image, Video, or Code fills.*
    * **Opacity Input (%):** Controls the transparency of that specific stop (allowing for fade-to-transparent gradients).
    * **Remove Button (-):** Deletes the specific stop from the list.

---

## 2. Inline (On-Canvas) Edit Interaction
This feature allows "Direct Manipulation." Instead of guessing numbers in a panel, the user interacts with the gradient visually directly on the object.

### A. The Gradient Axis (The White Line)
* **Visual Representation:** A solid white line overlays the shape, representing the direction and length of the gradient.
* **Start & End Points (Circles/Nodes):** The two endpoints of the line determine the gradient's angle and spread.
    * **Action:** Dragging these endpoints stretches, shrinks, or rotates the gradient.

### B. Stop Handles (Diamonds/Squares on the line)
* **Visual Representation:** Small square or diamond markers situated along the gradient axis. These correspond exactly to the "Stops" in the flyout panel.
* **Action:** Dragging these along the line adjusts the blend point (e.g., pushing the blue area to cover more of the shape).

### C. Shape Shaping Handles (Perpendicular Nodes)
* *Visible in Radial and Diamond modes.*
* **Visual Representation:** A handle connected to the center point by a perpendicular line.
* **Action:** Dragging this handle adjusts the **Aspect Ratio** (making a Radial circle into an Oval) or the **Width** of the Diamond.

### D. Angular Handle
* *Visible in Angular mode.*
* **Visual Representation:** The line acts as the "hand" of a clock.
* **Action:** Dragging the endpoint rotates the starting degree of the angle sweep.

---

## 3. Interaction Logic (Mouse & Keyboard)

Here is how the user performs specific operations directly on the canvas:

* **Selecting a Color:**
    * **Action:** Click any square Stop Handle on the canvas line.
    * **Result:** The Flyout Panel updates to show the color settings for *that specific stop*, allowing you to change its Hex or Opacity immediately.

* **Moving a Stop:**
    * **Action:** Click and Drag a Stop Handle along the axis line.
    * **Result:** The color transition shifts in real-time.

* **Adding a New Stop:**
    * **Action:** Hover anywhere over the gradient axis line where there is no existing handle. The cursor likely changes to a `+`. **Click once.**
    * **Result:** A new Stop Handle appears at that exact location, inheriting the color of the gradient at that specific pixel.

* **Removing a Stop:**
    * **Action:** Hold the **`Ctrl`** (or `Cmd` on Mac) key and click on an existing Stop Handle. OR, drag the handle far away from the line and release (if supported).
    * **Result:** The handle disappears, and the gradient recalculates between the remaining stops.
