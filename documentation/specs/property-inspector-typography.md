# Property Inspector: Typography Specification

## Overview
The Typography section allows users to select fonts, modify their style and size, adjust line and letter spacing, and set the text's alignment. This section is visible only when a text object is selected.

## 1. Text Styles

To support a future design system, the Typography section begins with a Text Style selector. This allows users to apply consistent formatting across the project.

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **Style Selector** | **Text Style:** Selects a predefined text style (e.g., "Header 1", "Body"). Applying a style updates all typography properties to match the style definition. | A **dropdown menu** at the top of the section. Displays the current style name or "No Style". Includes options to "Create Style" or "Detach Style". |
| **Edit Style** | **Edit Style:** (Contextual) Allows updating the style definition itself, propagating changes to all elements using this style. | An **icon** (e.g., pencil or settings) next to the style selector, visible only when a style is selected. |

### 1.1 Style Overrides
When a style is applied, changing any typography property (e.g., Font Size) creates a **local override**.
-   **UI Indication:** The Style Selector might show an asterisk or "modified" state.
-   **Reset:** A "Reset to Style" button appears to revert changes.
-   **Detach:** A "Detach Style" option allows breaking the link to the style, keeping current values as independent properties.

## 2. Font Family, Style, Size, and Fill

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **Font Family** | **Font Family:** Selects the typeface (font) to be used for the text. Default: **Inter**. | A **dropdown menu** showing the currently selected font family name in a light gray box, with a chevron/down arrow on the right. |
| **Font Style** | **Font Style/Weight:** Selects the specific style or weight of the chosen font family (e.g., Regular, Bold, Semibold, Italic). Default: **Regular**. | A **dropdown menu** showing the currently selected style/weight in a light gray box, with a chevron/down arrow on the right. |
| **Font Size** | **Font Size:** Sets the size of the text (in points or pixels). Default: **12**. | A text **input field** showing the font size, typically with a chevron/down arrow to indicate that it can be a dropdown for quick selection or a direct input field for custom values. |
| **Text Fill** | **Text Fill:** Sets the fill of the text characters. Supports **Solid, Gradient, Image, Video, and Code** fills. (Single fill layer only). | A **swatch** (triggering the standard **Fill Flyout**) and **value input**. Uses the same UI component as the Fill section but restricted to one layer. |

## 3. Spacing

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **Line Height Label** | Descriptive label for the line height setting. | Simple text label positioned above the input controls. |
| **Line Height Input** | **Line Height:** Controls the vertical distance between lines of text. Default: **Auto** (automatically calculated based on font size). | A light gray **input field** labeled with an **icon** (an uppercase A with horizontal lines above and below) and the text "Auto". |
| **Letter Spacing Label** | Descriptive label for the letter spacing setting. | Simple text label positioned above the input controls. |
| **Letter Spacing Input** | **Letter Spacing (Tracking):** Controls the horizontal distance between characters. Default: **0%**. | A light gray **input field** labeled with an **icon** (a vertical bar, an uppercase A, and another vertical bar) and the percentage value. |

## 4. Alignment

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **Align Left** | Aligns the text to the **left** edge of the text box. | An **icon** showing three horizontal lines, all aligned to the left. Selected state is darker/boxed. |
| **Align Center** | Aligns the text to the **center** of the text box. | An **icon** showing three horizontal lines, centered. |
| **Align Right** | Aligns the text to the **right** edge of the text box. | An **icon** showing three horizontal lines, all aligned to the right. |
| **Align Top** | Vertically aligns the text to the **top** of the text box. | An **icon** showing a vertical line with a small horizontal line at the top. |
| **Align Middle** | Vertically aligns the text to the **middle** of the text box. | An **icon** showing a vertical line with a small horizontal line in the middle. |
| **Align Bottom** | Vertically aligns the text to the **bottom** of the text box. | An **icon** showing a vertical line with a small horizontal line at the bottom. |
| **Type Settings** | Opens a panel with more **advanced typography settings** (e.g., OpenType features). | A small **icon** resembling a slider or a set of control dials (Right-most). |

## 5. Type Settings Flyout Panel

This panel offers advanced controls for text formatting and is organized into three tabs: **Basics**, **Details**, and **Variable** (the **Variable** tab is only visible when the selected font supports variable settings).

### 5.1 Tabs (Top Navigation)

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **`Basics`** (Tab) | Contains the most common and standard formatting options (Case, Decoration, Lists, etc.). This tab is currently **active**. | Tab-style button with dark, bold text and a line/underline beneath it, indicating it is the selected tab. |
| **`Details`** (Tab) | Contains advanced typographical controls, especially for numbers and OpenType features. | Tab-style button with lighter text, indicating it is not the active tab. |
| **`Variable`** (Tab) | Only appears when a Variable Font is selected. It allows adjustment of the font's custom axes (e.g., Slant, Grade). | Tab-style button with lighter text. |

### 5.2 Basics Tab Content

#### Text Alignment and Transformation

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **Justify Alignment Icon** | **Text Alignment: Justify.** Distributes text evenly between margins, aligning both left and right edges. | An **icon** showing four horizontal lines, aligned to both the left and right edges. |
| **Text Decoration Icon (T with line)** | **Decoration: Underline/Strikethrough.** Toggles the application of an underline or strikethrough to the text. | An **icon** of an uppercase T with a horizontal line below it (for underline), likely a dropdown or toggle. The line is currently visible, suggesting **Underline** is active. |
| **`aA` Icon** | **Letter Case: Small Caps.** Converts all lowercase letters to uppercase letters that are reduced in size (small caps). | An **icon** showing a normal size 'a' and a smaller size 'A' (`aA`). This is one of a set of case transformation controls. |
| **`A` Icon** | **Letter Case: Uppercase.** Converts all text characters to uppercase. | An **icon** of a capital 'A' in a box/button. |
| **`a` Icon** | **Letter Case: Lowercase.** Converts all text characters to lowercase. | An **icon** of a lowercase 'a' in a box/button. |
| **`Aa` Icon** | **Letter Case: Capitalize.** Converts the first letter of every word to uppercase. | An **icon** of a capital 'A' and a lowercase 'a' (`Aa`) in a box/button. |

#### Vertical and Paragraph Spacing

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **`Vertical trim` Label** | Descriptive label for the Vertical Trim setting. | Simple text label. |
| **`Cap Height` Dropdown** | **Vertical Trim:** Controls how the text layer's bounding box relates to the actual text ascenders and descenders. The option selected is **Cap Height**. | A dropdown input field showing the current setting (`Cap Height`) with a down arrow/chevron. |
| **`Paragraph spacing` Label** | Descriptive label for the Paragraph Spacing setting. | Simple text label. |
| **Icon `10` (Input)** | **Paragraph Spacing:** Sets the vertical spacing (in $\text{px}$) between separate paragraphs. The current value is **10**. | A light gray **input field** with an **icon** (a paragraph symbol/double P or two blocks) and the numerical value. |
| **`Paragraph indentation` Label** | Descriptive label for the Paragraph Indentation setting. | Simple text label. |
| **Icon `0` (Input)** | **Paragraph Indentation:** Sets the horizontal indent (in $\text{px}$) for the first line of a paragraph. The current value is **0**. | A light gray **input field** with an **icon** (a block with a smaller, indented line) and the numerical value. |

#### Lists and Truncation

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **Bullet List Icon** | **Lists: Bullet List.** Applies a bullet point list format to the selected text. | An **icon** showing a standard bullet list (dots next to lines). |
| **Numbered List Icon** | **Lists: Numbered List.** Applies a numbered list format to the selected text. | An **icon** showing a numbered list (numbers next to lines). |
| **`List spacing` Label** | Descriptive label for the List Spacing setting. | Simple text label. |
| **Icon `10` (Input)** | **List Spacing:** Sets the vertical spacing (in $\text{px}$) between list items (bullets or numbers). The current value is **10**. | A light gray **input field** with an **icon** (a stack of lines with a space between them) and the numerical value. |
| **`Truncate text` Toggle** | **Truncate Text:** When enabled, it hides text content that overflows the bounding box, instead of allowing it to wrap vertically. | A **toggle switch** (slider), currently set to the **Off** position. |
| **`Max lines` Label/Input** | **Max Lines:** When Truncate Text is enabled, this sets the maximum number of lines before the text is truncated/hidden. | A text **input field** for a numerical value. This is typically **disabled/grayed out** when "Truncate text" is off. |

### 5.3 Details Tab Content

#### Numerals

| Property | Typical Functionality |
| :--- | :--- |
| **Figure Style** | Controls the style of numbers (e.g., Proportional, Tabular). |
| **Position** | Controls the position of numbers (e.g., Normal, Superscript, Subscript). |
| **Fractions** | Applies automatic fractional forms (e.g., converting "1/2" into a proper fraction glyph). |

#### OpenType Features

| Property | Typical Functionality |
| :--- | :--- |
| **Ligatures** | Toggles standard and discretionary ligatures (connecting characters like 'fi' or 'ffl'). |
| **Stylistic Sets** | Allows selection of font-specific alternate character sets. |
| **Contextual Alternates**| Toggles glyph variations based on surrounding characters. |
