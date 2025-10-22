// Simple Vi/Vim Editor Implementation for RIPLINE Terminal
// Implements basic vi modal editing functionality

class ViEditor {
    constructor(filename, content, saveCallback, exitCallback) {
        this.filename = filename;
        this.lines = content ? content.split('\n') : [''];
        this.saveCallback = saveCallback;
        this.exitCallback = exitCallback;

        this.cursorRow = 0;
        this.cursorCol = 0;
        this.mode = 'normal'; // 'normal', 'insert', 'command'
        this.commandBuffer = '';
        this.yankBuffer = '';
        this.message = '';
        this.modified = false;

        this.element = null;
        this.setupUI();
        this.render();
        this.attachEventListeners();
    }

    setupUI() {
        // Create editor container
        this.element = document.createElement('div');
        this.element.className = 'vi-editor';
        this.element.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            padding: 20px;
            box-sizing: border-box;
        `;

        // Content area
        this.contentArea = document.createElement('pre');
        this.contentArea.style.cssText = `
            flex: 1;
            overflow: auto;
            margin: 0;
            white-space: pre;
            font-size: 14px;
            line-height: 1.4;
        `;

        // Status line
        this.statusLine = document.createElement('div');
        this.statusLine.style.cssText = `
            padding: 5px 0;
            border-top: 1px solid #00ff00;
            margin-top: 10px;
        `;

        this.element.appendChild(this.contentArea);
        this.element.appendChild(this.statusLine);
        document.body.appendChild(this.element);
    }

    render() {
        // Render content with cursor
        let output = '';

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];

            if (i === this.cursorRow) {
                // Current line - show cursor
                for (let j = 0; j <= line.length; j++) {
                    if (j === this.cursorCol) {
                        if (this.mode === 'insert') {
                            output += '|'; // Insert mode cursor
                        } else {
                            output += (j < line.length) ? `[${line[j]}]` : '[█]';
                        }
                    } else if (j < line.length) {
                        output += line[j];
                    }
                }
                output += '\n';
            } else {
                output += line + '\n';
            }
        }

        this.contentArea.textContent = output;

        // Update status line
        const modeStr = this.mode.toUpperCase();
        const modifiedStr = this.modified ? '[+]' : '';
        const posStr = `${this.cursorRow + 1},${this.cursorCol + 1}`;

        if (this.mode === 'command') {
            this.statusLine.textContent = `:${this.commandBuffer}`;
        } else if (this.message) {
            this.statusLine.textContent = this.message;
        } else {
            this.statusLine.textContent = `-- ${modeStr} -- ${modifiedStr} "${this.filename}" ${this.lines.length}L  ${posStr}`;
        }
    }

    attachEventListeners() {
        this.keyHandler = (e) => this.handleKey(e);
        document.addEventListener('keydown', this.keyHandler);
    }

    handleKey(e) {
        e.preventDefault();
        this.message = '';

        if (this.mode === 'normal') {
            this.handleNormalMode(e);
        } else if (this.mode === 'insert') {
            this.handleInsertMode(e);
        } else if (this.mode === 'command') {
            this.handleCommandMode(e);
        }

        this.render();
    }

    handleNormalMode(e) {
        const key = e.key;

        // Movement
        if (key === 'h' || key === 'ArrowLeft') {
            this.cursorCol = Math.max(0, this.cursorCol - 1);
        } else if (key === 'j' || key === 'ArrowDown') {
            this.cursorRow = Math.min(this.lines.length - 1, this.cursorRow + 1);
            this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length);
        } else if (key === 'k' || key === 'ArrowUp') {
            this.cursorRow = Math.max(0, this.cursorRow - 1);
            this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length);
        } else if (key === 'l' || key === 'ArrowRight') {
            this.cursorCol = Math.min(this.lines[this.cursorRow].length, this.cursorCol + 1);
        }

        // Line movement
        else if (key === '0') {
            this.cursorCol = 0;
        } else if (key === '$') {
            this.cursorCol = this.lines[this.cursorRow].length;
        } else if (key === 'g' && e.shiftKey) { // G
            this.cursorRow = this.lines.length - 1;
        }

        // Insert mode
        else if (key === 'i') {
            this.mode = 'insert';
        } else if (key === 'a') {
            this.cursorCol = Math.min(this.lines[this.cursorRow].length, this.cursorCol + 1);
            this.mode = 'insert';
        } else if (key === 'o') {
            this.lines.splice(this.cursorRow + 1, 0, '');
            this.cursorRow++;
            this.cursorCol = 0;
            this.mode = 'insert';
            this.modified = true;
        } else if (key === 'O' && e.shiftKey) {
            this.lines.splice(this.cursorRow, 0, '');
            this.cursorCol = 0;
            this.mode = 'insert';
            this.modified = true;
        }

        // Delete
        else if (key === 'x') {
            if (this.cursorCol < this.lines[this.cursorRow].length) {
                const line = this.lines[this.cursorRow];
                this.lines[this.cursorRow] = line.slice(0, this.cursorCol) + line.slice(this.cursorCol + 1);
                this.modified = true;
            }
        } else if (key === 'd' && e.shiftKey) { // D - delete to end of line
            this.lines[this.cursorRow] = this.lines[this.cursorRow].slice(0, this.cursorCol);
            this.modified = true;
        }

        // Yank (copy) line
        else if (key === 'y' && e.shiftKey) { // Y
            this.yankBuffer = this.lines[this.cursorRow];
            this.message = 'yanked line';
        }

        // Paste
        else if (key === 'p') {
            if (this.yankBuffer) {
                this.lines.splice(this.cursorRow + 1, 0, this.yankBuffer);
                this.cursorRow++;
                this.modified = true;
            }
        }

        // Command mode
        else if (key === ':') {
            this.mode = 'command';
            this.commandBuffer = '';
        }
    }

    handleInsertMode(e) {
        const key = e.key;

        if (key === 'Escape') {
            this.mode = 'normal';
            this.cursorCol = Math.max(0, this.cursorCol - 1);
        } else if (key === 'Enter') {
            const line = this.lines[this.cursorRow];
            const before = line.slice(0, this.cursorCol);
            const after = line.slice(this.cursorCol);

            this.lines[this.cursorRow] = before;
            this.lines.splice(this.cursorRow + 1, 0, after);
            this.cursorRow++;
            this.cursorCol = 0;
            this.modified = true;
        } else if (key === 'Backspace') {
            if (this.cursorCol > 0) {
                const line = this.lines[this.cursorRow];
                this.lines[this.cursorRow] = line.slice(0, this.cursorCol - 1) + line.slice(this.cursorCol);
                this.cursorCol--;
                this.modified = true;
            } else if (this.cursorRow > 0) {
                // Join with previous line
                const currentLine = this.lines[this.cursorRow];
                this.cursorRow--;
                this.cursorCol = this.lines[this.cursorRow].length;
                this.lines[this.cursorRow] += currentLine;
                this.lines.splice(this.cursorRow + 1, 1);
                this.modified = true;
            }
        } else if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
            const line = this.lines[this.cursorRow];
            this.lines[this.cursorRow] = line.slice(0, this.cursorCol) + key + line.slice(this.cursorCol);
            this.cursorCol++;
            this.modified = true;
        }
    }

    handleCommandMode(e) {
        const key = e.key;

        if (key === 'Escape') {
            this.mode = 'normal';
            this.commandBuffer = '';
        } else if (key === 'Enter') {
            this.executeCommand(this.commandBuffer);
            this.commandBuffer = '';
        } else if (key === 'Backspace') {
            this.commandBuffer = this.commandBuffer.slice(0, -1);
            if (this.commandBuffer === '') {
                this.mode = 'normal';
            }
        } else if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
            this.commandBuffer += key;
        }
    }

    executeCommand(cmd) {
        if (cmd === 'w') {
            // Write file
            this.save();
            this.message = `"${this.filename}" ${this.lines.length}L written`;
            this.mode = 'normal';
        } else if (cmd === 'q') {
            // Quit
            if (this.modified) {
                this.message = 'No write since last change (add ! to override)';
                this.mode = 'normal';
            } else {
                this.close();
            }
        } else if (cmd === 'q!') {
            // Force quit
            this.close();
        } else if (cmd === 'wq' || cmd === 'x') {
            // Write and quit
            this.save();
            this.close();
        } else {
            this.message = `Not an editor command: ${cmd}`;
            this.mode = 'normal';
        }
    }

    save() {
        const content = this.lines.join('\n');
        if (this.saveCallback) {
            this.saveCallback(this.filename, content);
        }
        this.modified = false;
    }

    close() {
        document.removeEventListener('keydown', this.keyHandler);
        document.body.removeChild(this.element);
        if (this.exitCallback) {
            this.exitCallback();
        }
    }
}

// Make available in browser
if (typeof window !== 'undefined') {
    window.ViEditor = ViEditor;
}
