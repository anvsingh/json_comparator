# JSON Comparator Walkthrough & Capabilities

## Overview
The JSON Comparator is now a fully-featured professional tool designed for developers to diff, format, and share JSON data. It goes beyond simple text comparison by offering semantic understanding and productivity workflows.

## Current Capabilities

### 1. Smart Data Input
A powerful web-based tool for comparing JSON and other structured data formats with advanced features like multi-format support, schema validation, and export capabilities.

## Capabilities

### 1. Multi-Format Support
- **Auto-Detection**: Automatically detects file format from extension or content
- **JSON**: Native support with syntax highlighting
- **XML**: Converts XML to JSON for comparison
- **CSV**: Parses CSV files with headers into JSON arrays
- **Excel (.xlsx)**: Extracts first sheet and converts to JSON
- **YAML**: Parses YAML files into JSON

### 2. Smart Data Input
- **Drag & Drop**: Drop 1-2 files anywhere. Single files load based on drop position (left/right half of screen)
- **File Upload**: Dedicated upload buttons for left and right sides
- **URL Fetching**: Load JSON/XML/CSV/YAML directly from URLs
- **File Name Display**: Shows the loaded file name next to each upload button

### 3. Semantic Comparison
- **Format & Sort**: Recursively sorts all JSON keys alphabetically and pretty-prints with 4-space indentation

### 4. Productivity Tools
- **Swap Sides**: Exchange content and filenames between left and right editors
- **Clear All**: Reset both editors to a clean state
- **Split / Inline Toggle**: Switch between side-by-side and unified diff views

### 5. Theme Support
- **Dark Theme**: The default professional look for low-light environments
- **Light Theme**: A clean, high-contrast look for bright environments
- **Warm Theme**: A sepia/solarized palette designed to reduce eye strain during long sessions

### 6. Advanced Filtering & Noise Reduction
- **Ignore Keys**: Enter comma-separated keys (e.g., `id, timestamp, uuid`) to strip them from *both* sides before comparison

### 7. Schema Validation
- **JSON Schema**: Upload a JSON Schema file to validate both sides
- **Real-time Validation**: Automatically validates content when schema is loaded
- **Error Reporting**: Shows validation status and logs errors to console

### 8. Diff Export
- **HTML Report**: Export a styled HTML report with side-by-side comparison
- **Markdown**: Export comparison as markdown with code blocks
- **Summary**: Copy a summary of changes (additions, modifications, deletions) to clipboard

### 9. Local History (Auto-Save)
- **Persistence**: Your work is automatically saved to browser's local storage
- **Auto-Restore**: Content and filenames are restored when you return

### 10. Sharing & Export
- **Share State**: Generate a URL containing current JSON content for instant sharing

## Verification Checklist

### Core Functionality
- [x] **Application Loads**: Dark theme UI with toolbar and dual-pane editor
- [x] **Monaco Editor**: Syntax highlighting, error detection, and diff rendering active

### Multi-Format Support
- [x] **Format Selector**: Dropdown with Auto-detect, JSON, XML, CSV, YAML options
- [x] **XML Conversion**: Upload XML file, converts to JSON with attributes preserved
- [x] **CSV Conversion**: Upload CSV file, converts to JSON array with headers
- [x] **Excel Conversion**: Upload .xlsx file, extracts first sheet as JSON
- [x] **YAML Conversion**: Upload YAML file, converts to JSON

### Feature Verification
- [x] **Theme Toggle**: Switching between Dark, Light, and Warm themes works
- [x] **Drag & Drop**: Multi-format files load correctly based on drop position
- [x] **Advanced Features**:
    - **Ignore Keys**: Adding `id` removes `id` fields from diff view
    - **Local History**: Refreshing page restores previous content
- [x] **Schema Validation**:
    - Upload valid schema shows "✓ Schema loaded"
    - Invalid schema shows "✗ Invalid schema"
    - Validation errors logged to console
- [x] **Export Functions**:
    - Export as HTML downloads styled report
    - Export as Markdown downloads .md file
    - Copy Summary copies change count to clipboard
- [x] **URL Fetch**: Valid URLs load content; invalid URLs show alert
- [x] **Format & Sort**: Messy JSON is prettified and keys are sorted
- [x] **Swap**: Content and filenames exchange correctly
- [x] **Clear**: Both editors reset to empty state
- [x] **View Toggle**: Switches between split and inline diff views
- [x] **Share**: Generates shareable URL with encoded state

## Example Workflows

### Comparing API Responses
1. Load two API responses (JSON or XML)
2. Add `timestamp, requestId` to Ignore Keys
3. Click "Apply Ignore" to remove noise
4. Review semantic differences in the diff view

### Validating Against Schema
1. Upload your JSON Schema file
2. Load JSON files to compare
3. Check console for validation errors
4. Export HTML report for documentation

### Converting Excel to JSON
1. Drag an Excel file onto the left side
2. See the first sheet converted to JSON
3. Compare with another data source
4. Export as Markdown for sharing
