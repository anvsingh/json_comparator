# JSON Comparator Walkthrough & Capabilities

## Overview
The JSON Comparator is now a fully-featured professional tool designed for developers to diff, format, and share JSON data. It goes beyond simple text comparison by offering semantic understanding and productivity workflows.

## Current Capabilities

### 1. Smart Data Input
Getting data into the tool is seamless with multiple supported methods:
- **Drag & Drop**: 
    - Drag a file to the **Left Half** of the screen to load it into the Original view.
    - Drag a file to the **Right Half** to load it into the Modified view.
    - Drag **Two Files** at once to populate both sides instantly.
- **File Upload**: Use the dedicated "Upload" buttons for standard file picking.
- **URL Fetching**: Paste a URL (e.g., raw GitHub content) to fetch and load JSON directly.
- **File Name Display**: The tool displays the name of the loaded file or "URL Loaded" for context.

### 2. Semantic Comparison
- **Format & Sort**: The "Killer Feature". It parses the JSON, recursively sorts all keys alphabetically, and pretty-prints the result. This allows you to compare JSON objects based on their *structure* rather than their key order (e.g., `{"a":1, "b":2}` == `{"b":2, "a":1}`).
- **Robust Error Handling**: If one side contains invalid JSON, the tool gracefully warns you via the console but still formats the valid side.

### 3. Productivity Tools
- **Swap Sides (⇄)**: Instantly exchange the content and filenames between the Original and Modified views.
- **Clear All**: Reset both editors to a clean state.
- **Split / Inline Toggle**: Switch between the standard side-by-side diff view and a unified inline view for different visualization preferences.

### 4. Theme Support
- **Dark Theme**: The default professional look for low-light environments.
- **Light Theme**: A clean, high-contrast look for bright environments.
- **Warm Theme**: A sepia/solarized palette designed to reduce eye strain during long sessions.

### 5. Advanced Filtering & Noise Reduction
- **Ignore Keys**: Enter comma-separated keys (e.g., `id, timestamp, uuid`) to strip them from *both* sides before comparison. This is crucial for comparing API responses where dynamic fields create noise.

### 6. Local History (Auto-Save)
- **Persistence**: Your work is automatically saved to your browser's local storage. If you accidentally refresh or close the tab, your JSON and filenames will be restored when you return.

### 7. Sharing & Export
- **Share State**: Click "Share" to generate a URL containing the current JSON content (compressed in the URL parameters). This allows for instant sharing of specific comparison states with colleagues.

## Verification Checklist

### Core Functionality
- [x] **Application Loads**: Dark theme UI with toolbar and dual-pane editor.
- [x] **Monaco Editor**: Syntax highlighting, error detection, and diff rendering are active.

### Feature Verification
- [x] **Theme Toggle**:
    - Switching to **Light** changes background to white and editor to light theme.
    - Switching to **Warm** changes background to sepia and editor to light theme.
    - Switching back to **Dark** restores the default look.
- [x] **Drag & Drop**: 
    - Dropping on left updates left editor.
    - Dropping on right updates right editor.
    - Dropping 2 files updates both.
- [x] **Advanced Features**:
    - **Ignore Keys**: Adding `id` removes `id` fields from the diff view.
    - **Local History**: Refreshing the page restores the previous content.
- [x] **URL Fetch**: Valid URLs load content; invalid URLs show an alert.
- [x] **Format & Sort**: 
    - Messy JSON is prettified.
    - Key order is standardized.
    - Invalid JSON on one side doesn't block the other.
- [x] **Swap**: Content and filenames flip correctly.
- [x] **Sharing**: "Share" button copies a valid URL; opening that URL restores the state.
