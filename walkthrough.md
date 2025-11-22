# JSON Comparator Verification Walkthrough

## Goal
Verify that the JSON Comparator web application loads correctly and functions as expected.

## Steps

1. **Open the Application**
   - Open the file `index.html` in your web browser.
   - You can do this by double-clicking the file in your file explorer or dragging it into a browser window.
   - Path: `/home/anuj/.gemini/antigravity/scratch/json_comparator/index.html`

2. **Verify Layout**
   - Check if the header "JSON Comparator" is visible.
   - Ensure the dark theme is applied.
   - Confirm there are two side-by-side editor panes.

3. **Test Comparison**
   - You should see default JSON content in both panes.
   - **Left Pane (Original):** `{"name": "John Doe", "age": 30}`
   - **Right Pane (Modified):** `{"name": "John Doe", "age": 31}`
   - Verify that the line with `"age"` is highlighted to show the difference.

4. **Test Editing**
   - Try changing the JSON in the left or right pane.
   - The diff view should update automatically to reflect your changes.

5. **Test Syntax Highlighting**
   - Type some invalid JSON (e.g., remove a quote).
   - Verify that the editor shows a red squiggle indicating a syntax error.
