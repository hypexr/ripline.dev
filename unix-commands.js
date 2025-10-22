// Simple Unix Command Emulator for RIPLINE Terminal
// Implements common Unix/Linux commands for browser-based terminal

class UnixEmulator {
    constructor() {
        this.fileSystem = {
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
        this.currentPath = '/home/user';
        this.environment = {
            'USER': 'user',
            'HOME': '/home/user',
            'PWD': '/home/user',
            'PATH': '/usr/local/bin:/usr/bin:/bin',
            'SHELL': '/bin/bash'
        };
        this.commandHistory = [];
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
            return args.join(' ');
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

        // Parse command and arguments
        const parts = commandLine.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);

        // Check if command exists
        if (command in this.commands) {
            try {
                return this.commands[command].call(this, args);
            } catch (error) {
                return `Error executing ${command}: ${error.message}`;
            }
        } else {
            return `${command}: command not found`;
        }
    }

    getCurrentPath() {
        return this.currentPath;
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
