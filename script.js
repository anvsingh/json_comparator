require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
    // --- Initialization ---
    var diffEditor = monaco.editor.createDiffEditor(document.getElementById('editor-container'), {
        theme: 'vs-dark',
        originalEditable: true,
        automaticLayout: true,
        renderSideBySide: true,
        scrollBeyondLastLine: false
    });

    var originalModel = monaco.editor.createModel('{}', 'json');
    var modifiedModel = monaco.editor.createModel('{}', 'json');

    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
    });

    // --- State Management ---
    let originalRaw = '';
    let modifiedRaw = '';

    // 1. Check for shared state in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedState = urlParams.get('state');

    if (sharedState) {
        try {
            const decoded = JSON.parse(atob(sharedState));
            originalRaw = decoded.original || '';
            modifiedRaw = decoded.modified || '';
            originalModel.setValue(originalRaw);
            modifiedModel.setValue(modifiedRaw);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.error('Failed to load shared state', e);
        }
    } else {
        // 2. Try to load from Local History
        if (!loadState()) {
            // 3. Load defaults if nothing else found
            const defaultOriginal = {
                "product": {
                    "id": "p-1001",
                    "name": "SuperWidget 3000",
                    "price": 29.99,
                    "tags": ["gadget", "new", "sale"],
                    "specs": {
                        "weight": "200g",
                        "dimensions": { "width": 10, "height": 20 }
                    }
                },
                "metadata": {
                    "created_at": "2023-10-27T10:00:00Z",
                    "updated_by": "admin"
                }
            };

            const defaultModified = {
                "product": {
                    "id": "p-1001",
                    "name": "SuperWidget 3000 Pro", // Changed
                    "price": 39.99, // Changed
                    "tags": ["gadget", "premium"], // Changed
                    "specs": {
                        "weight": "180g", // Changed
                        "dimensions": { "width": 10, "height": 20 }
                    }
                },
                "metadata": {
                    "created_at": "2023-10-27T10:00:00Z",
                    "updated_by": "system" // Changed
                }
            };

            originalRaw = JSON.stringify(defaultOriginal, null, 4);
            modifiedRaw = JSON.stringify(defaultModified, null, 4);

            originalModel.setValue(originalRaw);
            modifiedModel.setValue(modifiedRaw);
        }
    }

    // --- Helper Functions ---
    function readFile(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => callback(e.target.result);
        reader.readAsText(file);
    }

    async function fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            return text;
        } catch (e) {
            alert(`Failed to fetch URL: ${e.message}`);
            return null;
        }
    }

    // --- Format Detection & Conversion ---
    function detectFormat(filename, content) {
        const formatSelect = document.getElementById('format-select').value;
        if (formatSelect !== 'auto') return formatSelect;

        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'xml') return 'xml';
        if (ext === 'csv') return 'csv';
        if (ext === 'xlsx' || ext === 'xls') return 'excel';
        if (ext === 'yaml' || ext === 'yml') return 'yaml';

        // Content-based detection
        if (content.trim().startsWith('<')) return 'xml';
        if (content.includes('\n') && content.includes(',')) return 'csv';

        return 'json';
    }

    function xmlToJson(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        if (xmlDoc.getElementsByTagName('parsererror').length) {
            throw new Error('Invalid XML');
        }

        function parseNode(node) {
            if (node.nodeType === 3) return node.nodeValue; // Text node

            const obj = {};

            // Attributes
            if (node.attributes && node.attributes.length > 0) {
                obj['@attributes'] = {};
                for (let attr of node.attributes) {
                    obj['@attributes'][attr.name] = attr.value;
                }
            }

            // Child nodes
            if (node.childNodes && node.childNodes.length > 0) {
                for (let child of node.childNodes) {
                    if (child.nodeType === 3 && child.nodeValue.trim() === '') continue;

                    const childName = child.nodeName;
                    const childValue = parseNode(child);

                    if (obj[childName]) {
                        if (!Array.isArray(obj[childName])) {
                            obj[childName] = [obj[childName]];
                        }
                        obj[childName].push(childValue);
                    } else {
                        obj[childName] = childValue;
                    }
                }
            }

            return Object.keys(obj).length === 0 ? null : obj;
        }

        return parseNode(xmlDoc.documentElement);
    }

    function csvToJson(csvString) {
        const result = Papa.parse(csvString, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        if (result.errors.length > 0) {
            console.warn('CSV parsing errors:', result.errors);
        }

        return result.data;
    }

    function excelToJson(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            callback(jsonData);
        };
        reader.readAsArrayBuffer(file);
    }

    function yamlToJson(yamlString) {
        return jsyaml.load(yamlString);
    }

    function convertToJson(content, format, filename, callback) {
        try {
            let jsonObj;

            switch (format) {
                case 'xml':
                    jsonObj = xmlToJson(content);
                    break;
                case 'csv':
                    jsonObj = csvToJson(content);
                    break;
                case 'yaml':
                    jsonObj = yamlToJson(content);
                    break;
                case 'json':
                default:
                    jsonObj = JSON.parse(content);
            }

            callback(JSON.stringify(jsonObj, null, 4));
        } catch (e) {
            console.error('Format conversion error:', e);
            callback(content); // Return original on error
        }
    }

    // --- Schema Validation ---
    let schemaValidator = null;

    function validateWithSchema(jsonString) {
        if (!schemaValidator) return { valid: true };

        try {
            const data = JSON.parse(jsonString);
            const valid = schemaValidator(data);

            return {
                valid: valid,
                errors: schemaValidator.errors || []
            };
        } catch (e) {
            return { valid: false, errors: [{ message: 'Invalid JSON' }] };
        }
    }

    function sortObject(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(sortObject);

        return Object.keys(obj).sort().reduce((sorted, key) => {
            sorted[key] = sortObject(obj[key]);
            return sorted;
        }, {});
    }

    function removeKeys(obj, keysToRemove) {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(item => removeKeys(item, keysToRemove));

        return Object.keys(obj).reduce((acc, key) => {
            if (!keysToRemove.includes(key)) {
                acc[key] = removeKeys(obj[key], keysToRemove);
            }
            return acc;
        }, {});
    }

    function areFiltersActive() {
        const ignoreInput = document.getElementById('ignore-keys').value.trim();
        return !!ignoreInput;
    }

    function applyAdvancedFilters(text) {
        try {
            let obj = JSON.parse(text);

            // 1. Ignore Keys
            const ignoreInput = document.getElementById('ignore-keys').value.trim();
            if (ignoreInput && typeof obj === 'object' && obj !== null) {
                const keysToRemove = ignoreInput.split(',').map(k => k.trim());
                obj = removeKeys(obj, keysToRemove);
            }

            // 2. Sort & Format
            // If it's a primitive (string/number/boolean), just return it as string
            if (typeof obj !== 'object' || obj === null) {
                return String(obj);
            }

            // Otherwise sort and stringify
            const sorted = sortObject(obj);
            return JSON.stringify(sorted, null, 4);
        } catch (e) {
            console.warn('Cannot process content', e);
            return text;
        }
    }

    function formatAndSort(text) {
        // Now delegates to the advanced pipeline
        return applyAdvancedFilters(text);
    }

    // --- Diff Export Functions ---
    function generateDiffSummary() {
        const original = originalModel.getValue();
        const modified = modifiedModel.getValue();

        try {
            const origObj = JSON.parse(original);
            const modObj = JSON.parse(modified);

            const changes = findChanges(origObj, modObj);
            let summary = `Diff Summary:\n- ${changes.added.length} fields added\n- ${changes.modified.length} fields modified\n- ${changes.deleted.length} fields deleted\n- Total changes: ${changes.total}\n`;

            if (changes.added.length > 0) {
                summary += `\nAdded:\n${changes.added.map(c => `  + ${c.path}: ${JSON.stringify(c.value)}`).join('\n')}`;
            }
            if (changes.modified.length > 0) {
                summary += `\nModified:\n${changes.modified.map(c => `  ~ ${c.path}: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`).join('\n')}`;
            }
            if (changes.deleted.length > 0) {
                summary += `\nDeleted:\n${changes.deleted.map(c => `  - ${c.path}: ${JSON.stringify(c.value)}`).join('\n')}`;
            }

            return summary;
        } catch (e) {
            return 'Unable to generate summary (invalid JSON)';
        }
    }

    function findChanges(obj1, obj2, path = '') {
        let added = [], modified = [], deleted = [];

        const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

        for (const key of allKeys) {
            const newPath = path ? `${path}.${key}` : key;

            if (!(key in obj1)) {
                added.push({ path: newPath, value: obj2[key] });
            } else if (!(key in obj2)) {
                deleted.push({ path: newPath, value: obj1[key] });
            } else if (typeof obj1[key] === 'object' && obj1[key] !== null &&
                typeof obj2[key] === 'object' && obj2[key] !== null &&
                !Array.isArray(obj1[key]) && !Array.isArray(obj2[key])) {
                // Recurse for nested objects
                const nested = findChanges(obj1[key], obj2[key], newPath);
                added.push(...nested.added);
                modified.push(...nested.modified);
                deleted.push(...nested.deleted);
            } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
                modified.push({ path: newPath, oldValue: obj1[key], newValue: obj2[key] });
            }
        }

        return {
            added,
            modified,
            deleted,
            total: added.length + modified.length + deleted.length
        };
    }

    function exportAsHTML() {
        const original = originalModel.getValue();
        const modified = modifiedModel.getValue();
        const summary = generateDiffSummary();

        const html = `<!DOCTYPE html>
<html>
<head>
    <title>JSON Comparison Report</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
        h1 { color: #4ec9b0; }
        .summary { background: #252526; padding: 15px; border-radius: 5px; margin: 20px 0; white-space: pre-wrap; }
        .container { display: flex; gap: 20px; }
        .pane { flex: 1; background: #252526; padding: 15px; border-radius: 5px; }
        pre { margin: 0; white-space: pre-wrap; }
        .added { color: #4ec9b0; }
        .modified { color: #dcdcaa; }
        .deleted { color: #f48771; }
    </style>
</head>
<body>
    <h1>JSON Comparison Report</h1>
    <div class="summary"><pre>${escapeHtml(summary)}</pre></div>
    <div class="container">
        <div class="pane">
            <h2>Original</h2>
            <pre>${escapeHtml(original)}</pre>
        </div>
        <div class="pane">
            <h2>Modified</h2>
            <pre>${escapeHtml(modified)}</pre>
        </div>
    </div>
</body>
</html>`;

        downloadFile(html, 'comparison-report.html', 'text/html');
    }

    function exportAsMarkdown() {
        const original = originalModel.getValue();
        const modified = modifiedModel.getValue();
        const summary = generateDiffSummary();

        const markdown = `# JSON Comparison Report

## Summary
\`\`\`
${summary}
\`\`\`

## Original
\`\`\`json
${original}
\`\`\`

## Modified
\`\`\`json
${modified}
\`\`\`
`;

        downloadFile(markdown, 'comparison-report.md', 'text/markdown');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- Local History ---
    function saveState() {
        const state = {
            original: originalRaw, // Save RAW state, not filtered state
            modified: modifiedRaw,
            originalName: document.getElementById('filename-left').textContent,
            modifiedName: document.getElementById('filename-right').textContent
        };
        localStorage.setItem('jsonComparatorState', JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem('jsonComparatorState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.original) {
                    originalRaw = state.original;
                    originalModel.setValue(originalRaw);
                }
                if (state.modified) {
                    modifiedRaw = state.modified;
                    modifiedModel.setValue(modifiedRaw);
                }
                if (state.originalName) document.getElementById('filename-left').textContent = state.originalName;
                if (state.modifiedName) document.getElementById('filename-right').textContent = state.modifiedName;
                return true;
            } catch (e) {
                console.error('Failed to load local history', e);
            }
        }
        return false;
    }

    // Auto-save & Raw State Sync
    let saveTimeout;
    let isProgrammaticUpdate = false;

    const onDidChange = (model, isOriginal) => {
        // Only save to localStorage, never overwrite raw state
        // Raw state is the source of truth and should only be set by explicit actions
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveState, 1000);
    };

    originalModel.onDidChangeContent(() => onDidChange(originalModel, true));
    modifiedModel.onDidChangeContent(() => onDidChange(modifiedModel, false));

    // --- Event Listeners ---

    // File Inputs with Format Conversion
    document.getElementById('file-left').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            document.getElementById('filename-left').textContent = file.name;

            const format = detectFormat(file.name, '');

            if (format === 'excel') {
                excelToJson(file, (jsonData) => {
                    const jsonString = JSON.stringify(jsonData, null, 4);
                    originalRaw = jsonString;
                    originalModel.setValue(jsonString);
                });
            } else {
                readFile(file, (text) => {
                    convertToJson(text, format, file.name, (jsonString) => {
                        originalRaw = jsonString;
                        originalModel.setValue(jsonString);
                    });
                });
            }
        }
    });

    document.getElementById('file-right').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            document.getElementById('filename-right').textContent = file.name;

            const format = detectFormat(file.name, '');

            if (format === 'excel') {
                excelToJson(file, (jsonData) => {
                    const jsonString = JSON.stringify(jsonData, null, 4);
                    modifiedRaw = jsonString;
                    modifiedModel.setValue(jsonString);
                });
            } else {
                readFile(file, (text) => {
                    convertToJson(text, format, file.name, (jsonString) => {
                        modifiedRaw = jsonString;
                        modifiedModel.setValue(jsonString);
                    });
                });
            }
        }
    });

    // URL Inputs
    document.getElementById('url-left').addEventListener('change', async (e) => {
        if (e.target.value) {
            document.getElementById('filename-left').textContent = 'URL Loaded';
            const text = await fetchJson(e.target.value);
            if (text) {
                originalRaw = text;
                originalModel.setValue(text);
            }
        }
    });
    document.getElementById('url-right').addEventListener('change', async (e) => {
        if (e.target.value) {
            document.getElementById('filename-right').textContent = 'URL Loaded';
            const text = await fetchJson(e.target.value);
            if (text) {
                modifiedRaw = text;
                modifiedModel.setValue(text);
            }
        }
    });

    // Toolbar Actions
    document.getElementById('format-btn').addEventListener('click', () => {
        isProgrammaticUpdate = true;

        // Sync raw state from editor if empty (for copy-pasted content)
        if (!originalRaw.trim() && originalModel.getValue().trim()) {
            originalRaw = originalModel.getValue();
        }
        if (!modifiedRaw.trim() && modifiedModel.getValue().trim()) {
            modifiedRaw = modifiedModel.getValue();
        }

        // Always filter from RAW source
        if (originalRaw.trim()) {
            const filtered = applyAdvancedFilters(originalRaw);
            originalModel.setValue(filtered);
        }
        if (modifiedRaw.trim()) {
            const filtered = applyAdvancedFilters(modifiedRaw);
            modifiedModel.setValue(filtered);
        }

        // Force Monaco to refresh layout after setValue
        requestAnimationFrame(() => {
            diffEditor.layout();
            isProgrammaticUpdate = false;
        });
    });

    document.getElementById('apply-filters-btn').addEventListener('click', () => {
        document.getElementById('format-btn').click();
    });

    document.getElementById('swap-btn').addEventListener('click', () => {
        // Swap RAW
        const tempRaw = originalRaw;
        originalRaw = modifiedRaw;
        modifiedRaw = tempRaw;

        // Swap Editor
        const tempVal = originalModel.getValue();
        originalModel.setValue(modifiedModel.getValue());
        modifiedModel.setValue(tempVal);

        // Swap filenames
        const leftName = document.getElementById('filename-left').textContent;
        const rightName = document.getElementById('filename-right').textContent;
        document.getElementById('filename-left').textContent = rightName;
        document.getElementById('filename-right').textContent = leftName;
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        originalRaw = '';
        modifiedRaw = '';
        originalModel.setValue('');
        modifiedModel.setValue('');
        document.getElementById('filename-left').textContent = '';
        document.getElementById('filename-right').textContent = '';
        localStorage.removeItem('jsonComparatorState');
    });

    let isSideBySide = true;
    document.getElementById('view-toggle-btn').addEventListener('click', (e) => {
        isSideBySide = !isSideBySide;
        diffEditor.updateOptions({ renderSideBySide: isSideBySide });
        e.target.textContent = isSideBySide ? 'Split View' : 'Inline View';
    });
    // Schema Validation
    document.getElementById('schema-file').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            readFile(file, (text) => {
                try {
                    const schema = JSON.parse(text);
                    const ajv = new Ajv7();
                    schemaValidator = ajv.compile(schema);
                    document.getElementById('schema-status').textContent = '✓ Schema loaded';
                    document.getElementById('schema-status').style.color = '#4ec9b0';

                    // Validate current content
                    const leftValidation = validateWithSchema(originalModel.getValue());
                    const rightValidation = validateWithSchema(modifiedModel.getValue());

                    if (!leftValidation.valid || !rightValidation.valid) {
                        console.warn('Schema validation errors:', { left: leftValidation.errors, right: rightValidation.errors });
                    }
                } catch (e) {
                    document.getElementById('schema-status').textContent = '✗ Invalid schema';
                    document.getElementById('schema-status').style.color = '#f48771';
                    console.error('Schema error:', e);
                }
            });
        }
    });

    // Export Menu Toggle
    document.getElementById('export-btn').addEventListener('click', () => {
        const menu = document.getElementById('export-menu');
        menu.classList.toggle('hidden');
    });

    // Close export menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('export-menu');
        const btn = document.getElementById('export-btn');
        if (!menu.contains(e.target) && e.target !== btn) {
            menu.classList.add('hidden');
        }
    });

    // Export Options
    document.getElementById('export-html').addEventListener('click', () => {
        exportAsHTML();
        document.getElementById('export-menu').classList.add('hidden');
    });

    document.getElementById('export-markdown').addEventListener('click', () => {
        exportAsMarkdown();
        document.getElementById('export-menu').classList.add('hidden');
    });

    document.getElementById('copy-summary').addEventListener('click', () => {
        const summary = generateDiffSummary();
        navigator.clipboard.writeText(summary).then(() => {
            alert('Summary copied to clipboard!');
        });
        document.getElementById('export-menu').classList.add('hidden');
    });

    document.getElementById('share-btn').addEventListener('click', () => {
        const state = {
            original: originalModel.getValue(),
            modified: modifiedModel.getValue()
        };
        try {
            const encoded = btoa(JSON.stringify(state));
            const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`;
            navigator.clipboard.writeText(url).then(() => {
                const btn = document.getElementById('share-btn');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = originalText, 2000);
            });
        } catch (e) {
            alert('Content too large to share via URL');
        }
    });

    // Drag and Drop
    const dropZone = document.body;
    const overlay = document.getElementById('drag-overlay');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    let dragCounter = 0;
    dropZone.addEventListener('dragenter', (e) => {
        dragCounter++;
        overlay.classList.remove('hidden');
    });

    dropZone.addEventListener('dragleave', (e) => {
        dragCounter--;
        if (dragCounter === 0) overlay.classList.add('hidden');
    });

    dropZone.addEventListener('drop', (e) => {
        dragCounter = 0;
        overlay.classList.add('hidden');

        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        // Helper function to load file with format conversion
        const loadFileWithConversion = (file, isLeft) => {
            const format = detectFormat(file.name, '');
            const filenameElement = isLeft ? 'filename-left' : 'filename-right';
            const model = isLeft ? originalModel : modifiedModel;

            document.getElementById(filenameElement).textContent = file.name;

            if (format === 'excel') {
                excelToJson(file, (jsonData) => {
                    const jsonString = JSON.stringify(jsonData, null, 4);
                    if (isLeft) originalRaw = jsonString;
                    else modifiedRaw = jsonString;
                    model.setValue(jsonString);
                });
            } else {
                readFile(file, (text) => {
                    convertToJson(text, format, file.name, (jsonString) => {
                        if (isLeft) originalRaw = jsonString;
                        else modifiedRaw = jsonString;
                        model.setValue(jsonString);
                    });
                });
            }
        };

        // If user drops 2 files, load them into both
        if (files.length >= 2) {
            loadFileWithConversion(files[0], true);
            loadFileWithConversion(files[1], false);
            return;
        }

        // If user drops 1 file, check which side they dropped it on
        if (files.length === 1) {
            const windowWidth = window.innerWidth;
            const dropX = e.clientX;

            // If dropped on the right half, load to right editor
            if (dropX > windowWidth / 2) {
                loadFileWithConversion(files[0], false);
            } else {
                // Otherwise default to left
                loadFileWithConversion(files[0], true);
            }
        }
    });

    // Theme Selector
    document.getElementById('theme-select').addEventListener('change', (e) => {
        const theme = e.target.value;

        // Update Body Class
        document.body.classList.remove('light-theme', 'warm-theme');
        if (theme !== 'dark') {
            document.body.classList.add(`${theme}-theme`);
        }

        // Update Monaco Theme
        if (theme === 'dark') {
            monaco.editor.setTheme('vs-dark');
        } else {
            monaco.editor.setTheme('vs');
        }
    });
});
