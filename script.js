require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});

require(['vs/editor/editor.main'], function() {
    // Create the diff editor
    var diffEditor = monaco.editor.createDiffEditor(document.getElementById('editor-container'), {
        theme: 'vs-dark',
        originalEditable: true, // Allow editing the left side too
        automaticLayout: true,
        renderSideBySide: true
    });

    // Initial content
    var originalModel = monaco.editor.createModel(
        '{\n\t"name": "John Doe",\n\t"age": 30\n}',
        'json'
    );
    
    var modifiedModel = monaco.editor.createModel(
        '{\n\t"name": "John Doe",\n\t"age": 31\n}',
        'json'
    );

    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
    });
});
