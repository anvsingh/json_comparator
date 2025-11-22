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
    // Check for shared state in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedState = urlParams.get('state');
    if (sharedState) {
        try {
            const decoded = JSON.parse(atob(sharedState));
            originalModel.setValue(decoded.original || '');
            modifiedModel.setValue(decoded.modified || '');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.error('Failed to load shared state', e);
        }
    } else {
        // Load defaults if empty
        originalModel.setValue('{\n\t"name": "John Doe",\n\t"age": 30\n}');
        modifiedModel.setValue('{\n\t"name": "John Doe",\n\t"age": 31\n}');
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

    function sortObject(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(sortObject);

        return Object.keys(obj).sort().reduce((sorted, key) => {
            sorted[key] = sortObject(obj[key]);
            return sorted;
        }, {});
    }

    function formatAndSort(text) {
        try {
            const obj = JSON.parse(text);
            const sorted = sortObject(obj);
            return JSON.stringify(sorted, null, 4);
        } catch (e) {
            alert('Invalid JSON content. Cannot format.');
            return text;
        }
    }

    // --- Event Listeners ---

    // File Inputs
    document.getElementById('file-left').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            document.getElementById('filename-left').textContent = file.name;
            readFile(file, (text) => originalModel.setValue(text));
        }
    });
    document.getElementById('file-right').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            document.getElementById('filename-right').textContent = file.name;
            readFile(file, (text) => modifiedModel.setValue(text));
        }
    });

    // URL Inputs
    document.getElementById('url-left').addEventListener('change', async (e) => {
        if (e.target.value) {
            document.getElementById('filename-left').textContent = 'URL Loaded';
            const text = await fetchJson(e.target.value);
            if (text) originalModel.setValue(text);
        }
    });
    document.getElementById('url-right').addEventListener('change', async (e) => {
        if (e.target.value) {
            document.getElementById('filename-right').textContent = 'URL Loaded';
            const text = await fetchJson(e.target.value);
            if (text) modifiedModel.setValue(text);
        }
    });

    // Toolbar Actions
    document.getElementById('format-btn').addEventListener('click', () => {
        const originalVal = originalModel.getValue();
        const modifiedVal = modifiedModel.getValue();

        // Try to format original
        try {
            if (originalVal.trim()) {
                const obj = JSON.parse(originalVal);
                const sorted = sortObject(obj);
                originalModel.setValue(JSON.stringify(sorted, null, 4));
            }
        } catch (e) {
            console.warn('Left side is not valid JSON');
        }

        // Try to format modified
        try {
            if (modifiedVal.trim()) {
                const obj = JSON.parse(modifiedVal);
                const sorted = sortObject(obj);
                modifiedModel.setValue(JSON.stringify(sorted, null, 4));
            }
        } catch (e) {
            console.warn('Right side is not valid JSON');
        }
    });

    document.getElementById('swap-btn').addEventListener('click', () => {
        const temp = originalModel.getValue();
        originalModel.setValue(modifiedModel.getValue());
        modifiedModel.setValue(temp);

        // Swap filenames too
        const leftName = document.getElementById('filename-left').textContent;
        const rightName = document.getElementById('filename-right').textContent;
        document.getElementById('filename-left').textContent = rightName;
        document.getElementById('filename-right').textContent = leftName;
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        originalModel.setValue('');
        modifiedModel.setValue('');
        document.getElementById('filename-left').textContent = '';
        document.getElementById('filename-right').textContent = '';
    });

    let isSideBySide = true;
    document.getElementById('view-toggle-btn').addEventListener('click', (e) => {
        isSideBySide = !isSideBySide;
        diffEditor.updateOptions({ renderSideBySide: isSideBySide });
        e.target.textContent = isSideBySide ? 'Split View' : 'Inline View';
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

        // If user drops 2 files, load them into both
        if (files.length >= 2) {
            document.getElementById('filename-left').textContent = files[0].name;
            readFile(files[0], (text) => originalModel.setValue(text));

            document.getElementById('filename-right').textContent = files[1].name;
            readFile(files[1], (text) => modifiedModel.setValue(text));
            return;
        }

        // If user drops 1 file, check which side they dropped it on
        if (files.length === 1) {
            const windowWidth = window.innerWidth;
            const dropX = e.clientX;

            // If dropped on the right half, load to right editor
            if (dropX > windowWidth / 2) {
                document.getElementById('filename-right').textContent = files[0].name;
                readFile(files[0], (text) => modifiedModel.setValue(text));
            } else {
                // Otherwise default to left
                document.getElementById('filename-left').textContent = files[0].name;
                readFile(files[0], (text) => originalModel.setValue(text));
            }
        }
    });
});
