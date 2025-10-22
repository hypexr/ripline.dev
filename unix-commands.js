// Simple Unix Command Emulator for RIPLINE Terminal
// Implements common Unix/Linux commands for browser-based terminal

class UnixEmulator {
    constructor() {
        // Default filesystem structure
        const defaultFileSystem = {
            '/': {
                'home': {
                    'user': {
                        'README.txt': 'Welcome to RIPLINE!\n\nWe build habit tracking apps and mobile games.\nType "help" for available commands.',
                        'about.txt': 'RIPLINE Development\n\nFocused on creating meaningful software experiences.\n\nCurrent Projects:\n- Habit Tracking Application\n- Mobile Games (Coming Soon)',
                    }
                },
                'etc': {
                    'motd': 'Welcome to the RIPLINE Terminal!\nType "help" for available commands.\n'
                }
            }
        };

        // Try to load from localStorage
        const savedFS = this.loadFromStorage('ripline_filesystem');
        const savedPath = this.loadFromStorage('ripline_current_path');

        this.fileSystem = savedFS || defaultFileSystem;
        this.currentPath = savedPath || '/home/user';

        this.environment = {
            'USER': 'user',
            'HOME': '/home/user',
            'PWD': this.currentPath,
            'PATH': '/usr/local/bin:/usr/bin:/bin',
            'SHELL': '/bin/bash'
        };
        this.commandHistory = [];

        // Save initial state if nothing was loaded
        if (!savedFS) {
            this.saveToStorage('ripline_filesystem', this.fileSystem);
        }
        if (!savedPath) {
            this.saveToStorage('ripline_current_path', this.currentPath);
        }
    }

    // LocalStorage helpers
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return null;
        }
    }

    // Persist filesystem changes
    persistFileSystem() {
        this.saveToStorage('ripline_filesystem', this.fileSystem);
    }

    // Persist current path
    persistCurrentPath() {
        this.saveToStorage('ripline_current_path', this.currentPath);
    }

    // Helper: Navigate filesystem
    resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        }
        const parts = this.currentPath.split('/').filter(p => p);
        const newParts = path.split('/').filter(p => p);

        for (const part of newParts) {
            if (part === '..') {
                parts.pop();
            } else if (part !== '.') {
                parts.push(part);
            }
        }
        return '/' + parts.join('/');
    }

    getNode(path) {
        const fullPath = this.resolvePath(path);
        const parts = fullPath.split('/').filter(p => p);
        let current = this.fileSystem['/'];

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return null;
            }
        }
        return current;
    }

    // Command implementations
    commands = {
        help: () => {
            return `Available commands:
  help          - Show this help message
  ls            - List directory contents
  cd [dir]      - Change directory
  pwd           - Print working directory
  cat [file]    - Display file contents
  echo [text]   - Display a line of text
  clear         - Clear the terminal
  whoami        - Print current user
  date          - Display current date and time
  uname         - Print system information
  env           - Print environment variables
  history       - Show command history
  mkdir [dir]   - Create a directory
  touch [file]  - Create an empty file
  rm [file]     - Remove a file
  tree          - Display directory tree

Type any command to try it out!`;
        },

        ls: (args) => {
            const path = args[0] || this.currentPath;
            const node = this.getNode(path);

            if (!node) {
                return `ls: cannot access '${args[0] || '.'}': No such file or directory`;
            }

            if (typeof node === 'string') {
                return args[0] || '.';
            }

            const entries = Object.keys(node);
            if (entries.length === 0) {
                return '';
            }

            return entries.map(name => {
                const isDir = typeof node[name] === 'object';
                return isDir ? `${name}/` : name;
            }).join('  ');
        },

        cd: (args) => {
            if (!args[0]) {
                this.currentPath = this.environment.HOME;
                this.environment.PWD = this.currentPath;
                this.persistCurrentPath();
                return '';
            }

            const newPath = this.resolvePath(args[0]);
            const node = this.getNode(newPath);

            if (!node) {
                return `cd: ${args[0]}: No such file or directory`;
            }

            if (typeof node === 'string') {
                return `cd: ${args[0]}: Not a directory`;
            }

            this.currentPath = newPath;
            this.environment.PWD = this.currentPath;
            this.persistCurrentPath();
            return '';
        },

        pwd: () => {
            return this.currentPath;
        },

        cat: (args) => {
            if (!args[0]) {
                return 'cat: missing file operand';
            }

            const node = this.getNode(args[0]);

            if (!node) {
                return `cat: ${args[0]}: No such file or directory`;
            }

            if (typeof node !== 'string') {
                return `cat: ${args[0]}: Is a directory`;
            }

            return node;
        },

        echo: (args) => {
            // Join arguments and remove surrounding quotes
            const text = args.join(' ');
            // Remove surrounding single or double quotes
            return text.replace(/^["']|["']$/g, '');
        },

        clear: () => {
            return '__CLEAR__';
        },

        whoami: () => {
            return this.environment.USER;
        },

        date: () => {
            return new Date().toString();
        },

        uname: (args) => {
            if (args.includes('-a')) {
                return 'RIPLINE 1.0.0 RIPLINE Terminal x86_64 GNU/JavaScript';
            }
            return 'RIPLINE';
        },

        env: () => {
            return Object.entries(this.environment)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
        },

        history: () => {
            return this.commandHistory
                .map((cmd, i) => `${i + 1}  ${cmd}`)
                .join('\n');
        },

        mkdir: (args) => {
            if (!args[0]) {
                return 'mkdir: missing operand';
            }

            const path = this.resolvePath(args[0]);
            const parts = path.split('/').filter(p => p);
            const dirName = parts.pop();
            const parentPath = '/' + parts.join('/');
            const parent = this.getNode(parentPath);

            if (!parent) {
                return `mkdir: cannot create directory '${args[0]}': No such file or directory`;
            }

            if (typeof parent !== 'object') {
                return `mkdir: cannot create directory '${args[0]}': Not a directory`;
            }

            if (dirName in parent) {
                return `mkdir: cannot create directory '${args[0]}': File exists`;
            }

            parent[dirName] = {};
            this.persistFileSystem();
            return '';
        },

        touch: (args) => {
            if (!args[0]) {
                return 'touch: missing file operand';
            }

            const path = this.resolvePath(args[0]);
            const parts = path.split('/').filter(p => p);
            const fileName = parts.pop();
            const parentPath = '/' + parts.join('/');
            const parent = this.getNode(parentPath);

            if (!parent) {
                return `touch: cannot touch '${args[0]}': No such file or directory`;
            }

            if (typeof parent !== 'object') {
                return `touch: cannot touch '${args[0]}': Not a directory`;
            }

            if (!(fileName in parent)) {
                parent[fileName] = '';
            }
            this.persistFileSystem();
            return '';
        },

        rm: (args) => {
            if (!args[0]) {
                return 'rm: missing operand';
            }

            const path = this.resolvePath(args[0]);
            const parts = path.split('/').filter(p => p);
            const fileName = parts.pop();
            const parentPath = '/' + parts.join('/');
            const parent = this.getNode(parentPath);

            if (!parent || !(fileName in parent)) {
                return `rm: cannot remove '${args[0]}': No such file or directory`;
            }

            if (typeof parent[fileName] === 'object') {
                return `rm: cannot remove '${args[0]}': Is a directory`;
            }

            delete parent[fileName];
            this.persistFileSystem();
            return '';
        },

        tree: () => {
            const buildTree = (node, prefix = '', isLast = true) => {
                let result = '';
                const entries = Object.entries(node);

                entries.forEach(([name, value], index) => {
                    const isLastEntry = index === entries.length - 1;
                    const connector = isLastEntry ? '└── ' : '├── ';
                    const isDir = typeof value === 'object';

                    result += prefix + connector + name + (isDir ? '/\n' : '\n');

                    if (isDir) {
                        const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
                        result += buildTree(value, newPrefix, isLastEntry);
                    }
                });

                return result;
            };

            const node = this.getNode(this.currentPath);
            return this.currentPath + '/\n' + buildTree(node);
        }
    };

    execute(commandLine) {
        if (!commandLine.trim()) {
            return '';
        }

        // Add to history
        this.commandHistory.push(commandLine);

        // Check for output redirection (> or >>)
        let redirectMode = null;
        let redirectFile = null;
        let actualCommand = commandLine;

        // Parse redirection operators
        const appendMatch = commandLine.match(/^(.+?)\s*>>\s*(.+)$/);
        const overwriteMatch = commandLine.match(/^(.+?)\s*>\s*(.+)$/);

        if (appendMatch) {
            redirectMode = 'append';
            actualCommand = appendMatch[1].trim();
            redirectFile = appendMatch[2].trim();
        } else if (overwriteMatch) {
            redirectMode = 'overwrite';
            actualCommand = overwriteMatch[1].trim();
            redirectFile = overwriteMatch[2].trim();
        }

        // Parse command and arguments
        const parts = actualCommand.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);

        // Execute the command
        let output = '';
        if (command in this.commands) {
            try {
                output = this.commands[command].call(this, args);
            } catch (error) {
                return `Error executing ${command}: ${error.message}`;
            }
        } else {
            return `${command}: command not found`;
        }

        // Handle redirection
        if (redirectMode && redirectFile) {
            const writeResult = this.writeToFile(redirectFile, output, redirectMode);
            if (writeResult) {
                return writeResult; // Error message
            }
            return ''; // Success - no output
        }

        return output;
    }

    writeToFile(filePath, content, mode) {
        // Resolve the file path
        const fullPath = this.resolvePath(filePath);
        const parts = fullPath.split('/').filter(p => p);
        const fileName = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = this.getNode(parentPath);

        if (!parent) {
            return `bash: ${filePath}: No such file or directory`;
        }

        if (typeof parent !== 'object') {
            return `bash: ${filePath}: Not a directory`;
        }

        // Check if target exists and is a directory
        if (fileName in parent && typeof parent[fileName] === 'object') {
            return `bash: ${filePath}: Is a directory`;
        }

        // Write to file
        if (mode === 'append' && fileName in parent) {
            parent[fileName] += content;
        } else {
            parent[fileName] = content;
        }

        this.persistFileSystem();
        return null; // Success
    }

    getCurrentPath() {
        return this.currentPath;
    }

    // Tab completion helper
    getCompletions(partial) {
        const parts = partial.trim().split(/\s+/);

        // If no space, complete command names
        if (parts.length === 1) {
            const prefix = parts[0];
            const commands = Object.keys(this.commands).filter(cmd => cmd.startsWith(prefix));
            return { type: 'command', matches: commands, prefix };
        }

        // If space exists, complete file/directory paths
        const command = parts[0];
        const pathPrefix = parts[parts.length - 1];

        // Get directory to search
        let searchDir = this.currentPath;
        let filePrefix = pathPrefix;

        if (pathPrefix.includes('/')) {
            const lastSlash = pathPrefix.lastIndexOf('/');
            const dirPart = pathPrefix.substring(0, lastSlash + 1);
            filePrefix = pathPrefix.substring(lastSlash + 1);
            searchDir = this.resolvePath(dirPart);
        }

        const node = this.getNode(searchDir);
        if (!node || typeof node !== 'object') {
            return { type: 'path', matches: [], prefix: pathPrefix };
        }

        // Find matching files/directories
        const matches = Object.keys(node)
            .filter(name => name.startsWith(filePrefix))
            .map(name => {
                const isDir = typeof node[name] === 'object';
                return isDir ? name + '/' : name;
            });

        return { type: 'path', matches, prefix: pathPrefix, filePrefix };
    }
}

// Make available in browser
if (typeof window !== 'undefined') {
    window.UnixEmulator = UnixEmulator;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnixEmulator;
}
