// Global variables
let textEditor;
let undoStack = [];
let redoStack = [];
let currentState = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    textEditor = document.getElementById('textEditor');
    currentState = textEditor.value;
    undoStack.push(currentState);
    
    // Add event listeners
    textEditor.addEventListener('input', handleTextChange);
    textEditor.addEventListener('keydown', handleKeyDown);
    textEditor.addEventListener('select', updateButtonStates);
    textEditor.addEventListener('focus', updateButtonStates);
    
    // Update button states initially
    updateButtonStates();
    updateWordCount();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.menu-item')) {
            closeAllMenus();
        }
    });
});

// Menu management functions
function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    const isVisible = menu.classList.contains('show');
    
    // Close all menus first
    closeAllMenus();
    
    // Toggle the clicked menu
    if (!isVisible) {
        menu.classList.add('show');
        updateMenuStates();
    }
}

function closeAllMenus() {
    const menus = document.querySelectorAll('.dropdown-menu');
    menus.forEach(menu => menu.classList.remove('show'));
}

function updateMenuStates() {
    const hasSelection = textEditor.selectionStart !== textEditor.selectionEnd;
    const hasText = textEditor.value.length > 0;
    const canUndo = undoStack.length > 1;
    const canRedo = redoStack.length > 0;
    
    // Update edit menu button states
    document.getElementById('undoBtn').disabled = !canUndo;
    document.getElementById('redoBtn').disabled = !canRedo;
    document.getElementById('cutBtn').disabled = !hasSelection;
    document.getElementById('copyBtn').disabled = !hasSelection;
}

// Text editing functions
function handleTextChange() {
    const newState = textEditor.value;
    if (newState !== currentState) {
        undoStack.push(newState);
        if (undoStack.length > 50) { // Limit undo stack size
            undoStack.shift();
        }
        redoStack = []; // Clear redo stack when new changes are made
        currentState = newState;
        updateButtonStates();
        updateWordCount();
    }
}

function handleKeyDown(event) {
    // Handle keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
            case 'z':
                event.preventDefault();
                if (event.shiftKey) {
                    redoAction();
                } else {
                    undoAction();
                }
                break;
            case 'y':
                event.preventDefault();
                redoAction();
                break;
            case 'x':
                event.preventDefault();
                cutText();
                break;
            case 'c':
                event.preventDefault();
                copyText();
                break;
            case 'v':
                event.preventDefault();
                pasteText();
                break;
            case 'a':
                event.preventDefault();
                selectAllText();
                break;
            case 'f':
                event.preventDefault();
                findText();
                break;
            case 'h':
                event.preventDefault();
                replaceText();
                break;
        }
    }
}

// Edit menu actions
function undoAction() {
    if (undoStack.length > 1) {
        const currentState = undoStack.pop();
        redoStack.push(currentState);
        const previousState = undoStack[undoStack.length - 1];
        textEditor.value = previousState;
        updateButtonStates();
        updateWordCount();
    }
}

function redoAction() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        textEditor.value = nextState;
        updateButtonStates();
        updateWordCount();
    }
}

function cutText() {
    const selectedText = getSelectedText();
    if (selectedText) {
        copyToClipboard(selectedText);
        replaceSelectedText('');
        saveState();
    }
}

function copyText() {
    const selectedText = getSelectedText();
    if (selectedText) {
        copyToClipboard(selectedText);
    }
}

async function pasteText() {
    try {
        const text = await navigator.clipboard.readText();
        replaceSelectedText(text);
        saveState();
    } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const text = prompt('Pega el texto aquí:');
        if (text !== null) {
            replaceSelectedText(text);
            saveState();
        }
    }
}

function selectAllText() {
    textEditor.select();
    updateButtonStates();
}

// Helper functions
function getSelectedText() {
    const start = textEditor.selectionStart;
    const end = textEditor.selectionEnd;
    return textEditor.value.substring(start, end);
}

function replaceSelectedText(newText) {
    const start = textEditor.selectionStart;
    const end = textEditor.selectionEnd;
    const beforeText = textEditor.value.substring(0, start);
    const afterText = textEditor.value.substring(end);
    textEditor.value = beforeText + newText + afterText;
    textEditor.selectionStart = textEditor.selectionEnd = start + newText.length;
    textEditor.focus();
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function saveState() {
    handleTextChange();
}

function updateButtonStates() {
    const hasSelection = textEditor.selectionStart !== textEditor.selectionEnd;
    const hasText = textEditor.value.length > 0;
    const canUndo = undoStack.length > 1;
    const canRedo = redoStack.length > 0;
    
    // Update toolbar buttons if they exist
    const toolbarButtons = document.querySelectorAll('.toolbar button');
    toolbarButtons.forEach(button => {
        const title = button.getAttribute('title');
        if (title === 'Cortar' || title === 'Copiar') {
            button.disabled = !hasSelection;
        }
    });
}

function updateWordCount() {
    const text = textEditor.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    
    document.getElementById('wordCount').textContent = `Palabras: ${words}`;
    document.getElementById('charCount').textContent = `Caracteres: ${chars}`;
}

// Format functions
function formatBold() {
    const selectedText = getSelectedText();
    if (selectedText) {
        replaceSelectedText(`**${selectedText}**`);
        saveState();
    }
}

function formatItalic() {
    const selectedText = getSelectedText();
    if (selectedText) {
        replaceSelectedText(`*${selectedText}*`);
        saveState();
    }
}

function formatUnderline() {
    const selectedText = getSelectedText();
    if (selectedText) {
        replaceSelectedText(`_${selectedText}_`);
        saveState();
    }
}

// Find and replace functions
function findText() {
    document.getElementById('findModal').style.display = 'block';
    document.getElementById('findInput').focus();
}

function replaceText() {
    document.getElementById('replaceModal').style.display = 'block';
    document.getElementById('replaceFind').focus();
}

function closeFindModal() {
    document.getElementById('findModal').style.display = 'none';
}

function closeReplaceModal() {
    document.getElementById('replaceModal').style.display = 'none';
}

function performFind() {
    const searchText = document.getElementById('findInput').value;
    if (searchText) {
        const text = textEditor.value;
        const index = text.indexOf(searchText, textEditor.selectionEnd);
        if (index !== -1) {
            textEditor.selectionStart = index;
            textEditor.selectionEnd = index + searchText.length;
            textEditor.focus();
        } else {
            alert('Texto no encontrado');
        }
    }
    closeFindModal();
}

function performReplace() {
    const findText = document.getElementById('replaceFind').value;
    const replaceWithText = document.getElementById('replaceWith').value;
    
    if (findText) {
        const selectedText = getSelectedText();
        if (selectedText === findText) {
            replaceSelectedText(replaceWithText);
            saveState();
        } else {
            // Find next occurrence
            const text = textEditor.value;
            const index = text.indexOf(findText, textEditor.selectionEnd);
            if (index !== -1) {
                textEditor.selectionStart = index;
                textEditor.selectionEnd = index + findText.length;
                textEditor.focus();
                return;
            } else {
                alert('Texto no encontrado');
            }
        }
    }
    closeReplaceModal();
}

function performReplaceAll() {
    const findText = document.getElementById('replaceFind').value;
    const replaceWithText = document.getElementById('replaceWith').value;
    
    if (findText) {
        const newText = textEditor.value.replaceAll(findText, replaceWithText);
        textEditor.value = newText;
        saveState();
        updateWordCount();
        alert('Reemplazo completado');
    }
    closeReplaceModal();
}

// File operations (basic implementations)
function newDocument() {
    if (textEditor.value && confirm('¿Estás seguro de que quieres crear un nuevo documento? Se perderán los cambios no guardados.')) {
        textEditor.value = '';
        undoStack = [''];
        redoStack = [];
        currentState = '';
        updateWordCount();
        updateButtonStates();
    }
}

function openDocument() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                textEditor.value = e.target.result;
                saveState();
                updateWordCount();
                updateButtonStates();
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function saveDocument() {
    const text = textEditor.value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const findModal = document.getElementById('findModal');
    const replaceModal = document.getElementById('replaceModal');
    
    if (event.target === findModal) {
        closeFindModal();
    }
    if (event.target === replaceModal) {
        closeReplaceModal();
    }
}