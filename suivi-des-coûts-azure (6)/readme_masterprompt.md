# Master Regenerative Prompt: Azure Cost Tracker Application (V.2)

## OBJECTIVE

Generate a complete, self-contained, single-page web application for tracking Microsoft Azure costs. The application must be built exclusively with vanilla HTML, CSS, and JavaScript (ES6+), without any frameworks like React, Vue, Angular, or TypeScript. The application must be fully functional offline, storing all data in the browser's IndexedDB. The entire user interface and all text must be in French.

## PROJECT STRUCTURE

Create the following three files in the root directory. Do not use any subdirectories.
1.  `index.html`: The main HTML document.
2.  `style.css`: All CSS styles for the application.
3.  `app.js`: All JavaScript logic.

## CORE TECHNOLOGIES

-   **HTML5**: For the structure and content.
-   **CSS3**: For styling. Use CSS variables for theming.
-   **Vanilla JavaScript (ES6+)**: For all application logic, DOM manipulation, and event handling.
-   **IndexedDB**: For client-side storage of all cost entries.
-   **Chart.js**: Use this library for data visualization. Include it via a CDN link in `index.html`.

## DETAILED SPECIFICATIONS

### 1. `index.html` File

-   **Structure**: Standard HTML5 boilerplate. `lang="fr"`.
-   **Head**:
    -   `meta` tags for charset and viewport.
    -   `<title>Suivi des coûts Azure</title>`.
    -   Link to `style.css`.
    -   CDN script tag for Chart.js: `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>`.
-   **Body**:
    -   `<header>` for the top bar containing the title and a settings button (cogwheel SVG icon, fill #FFFFFF).
    -   `<main>` container with a responsive grid layout.
    -   Three main `div` containers with IDs: `comparison-container`, `entries-container`, and `annual-review-container`.
    -   A `<button id="fab">` for the Floating Action Button with a `+`.
    -   A generic modal structure (`<div id="modal-backdrop">`) hidden by default. It must contain the modal `div` with a header, title, close button, and content area.
    -   A dedicated container for the custom chart tooltip: `<div id="chart-tooltip" class="chart-tooltip" style="opacity: 0; pointer-events: none;"></div>`.
    -   Link to `app.js` at the end of the body.

### 2. `style.css` File

-   **Theming**:
    -   Use a `:root` selector to define CSS variables for a light theme, including a color for the "Autre" category.
    -   Use a `[data-theme="dark"]` selector to override variables for the dark theme.
-   **Components Styling**:
    -   **Cards**: Background, rounded corners, subtle box-shadow.
    -   **FAB**: Circular, fixed bottom-right, accent color, hover effect.
    -   **Modals**: Centered with a backdrop. Can be closed by clicking the backdrop or a red `×` button.
    -   **Forms**: Clean inputs and selects with consistent padding, borders, and focus states.
    -   **Custom Tooltip**: Must have a non-transparent background (`var(--bg-secondary)`), proper padding, a border, a high `z-index`, and crucially, `pointer-events: none;` to prevent flickering.
-   **Responsiveness**: Use media queries to ensure good UX on all device sizes.

### 3. `app.js` File

-   **Structure**: Wrap the entire script in a `DOMContentLoaded` event listener.
-   **State Management**: Use a single `state` object to hold application data (`entries`, `searchTerm`, etc.). Use functions to update state and trigger re-renders.
-   **IndexedDB Service**: Create a `db` object to abstract all IndexedDB operations (`init`, `getAllEntries`, `addEntry`, `updateEntry`, `deleteEntry`, `exportData`, `importData`).
-   **Rendering**:
    -   Create distinct `render...()` functions for each major UI component (`renderEntriesList`, `renderComparisonView`, `renderAnnualReview`).
    -   These functions read from the `state` object and generate HTML to update the DOM.
-   **Modal Logic**:
    -   Create `openModal(title, content)` and `closeModal()` functions.
    -   Create "content generator" functions for each modal type (`getAddEditModalContent`, `getSettingsModalContent`, `getInfoModalContent`).
-   **Chart Logic**:
    -   Maintain variables for Chart.js instances.
    -   Create `renderDonutChart(...)` and `renderBarChart(...)` functions. Before creating a new chart, destroy the old instance (`chart.destroy()`) to prevent issues.
    -   **Custom Tooltips**: Implement a Chart.js `external` tooltip handler that updates the content and position of the single `<div id="chart-tooltip">` element. This is mandatory to fix z-index and flickering issues.
    -   **"Autre" Category Logic**: The `renderDonutChart` function must calculate if the user-provided `totalTTC` is greater than the sum of the defined cost categories. If it is, the difference must be displayed as a new "Autre" slice on the chart.
-   **Event Handling**:
    -   Use event delegation on `document` for dynamically created elements.
    -   **FAB Click**: Opens the "Add Entry" modal.
    -   **Settings Icon Click**: Opens the "Settings" modal.
    -   **Settings Modal**: Provides options for theme (light/dark/system), JSON export (downloads a file), and JSON import (opens a file picker, warns about overwriting data). An "i" button opens another modal listing "Chart.js" as a library.
    -   **Entries List**: Search bar performs a "like" search on month and year. A button toggles sort order. Each entry has edit/delete buttons.
    -   **Comparison View**: Two dropdowns allow selecting months. It defaults to the latest two. It shows "mois1année : xxx euro vs mois2année xxx euro -> augmentation/baisse de x %".
    -   **Annual Review**: A dropdown selects a year (only years with data are shown). It shows a bar chart of monthly TTC costs. It also displays stats: first vs. last month cost difference, and trend vs. previous year.

### 4. Application Flow & Feature Details

-   **Initial Load**: `app.js` initializes, applies the theme, connects to IndexedDB, fetches entries, populates the `state`, and calls the main `render()` function.
-   **Add/Edit Entry Form**: The form must include an optional input field for `Prix TTC`. If left blank, its value is calculated from the sub-categories. The form must show a live calculation of the sum of the sub-categories.
-   **Data Integrity**: All cost inputs should be handled as floats. The `totalTTC` provided by the user is the source of truth for an entry's total cost.
-   **Text Content**: All user-facing text (titles, labels, buttons, placeholders, alerts) must be in **French**.
