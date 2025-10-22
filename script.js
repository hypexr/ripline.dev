// RIPLINE.DEV - Dynamic BBS Terminal Experience

// Matrix-style animated background
class MatrixBackground {
    constructor() {
        this.canvas = document.getElementById('matrix-bg');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80;

        // BBS-style characters
        this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`';
        this.characters += '░▒▓█▀▄│─┌┐└┘├┤┬┴┼';

        this.init();
        this.animate();

        window.addEventListener('resize', () => this.init());
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Create particles
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            char: this.characters[Math.floor(Math.random() * this.characters.length)],
            size: 12 + Math.random() * 8,
            opacity: 0.3 + Math.random() * 0.4,
            life: Math.random() * 100
        };
    }

    updateParticle(particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life++;

        // Change character occasionally
        if (Math.random() < 0.02) {
            particle.char = this.characters[Math.floor(Math.random() * this.characters.length)];
        }

        // Wrap around screen
        if (particle.x < 0) particle.x = this.canvas.width;
        if (particle.x > this.canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = this.canvas.height;
        if (particle.y > this.canvas.height) particle.y = 0;

        // Occasionally change direction slightly
        if (Math.random() < 0.01) {
            particle.vx += (Math.random() - 0.5) * 0.1;
            particle.vy += (Math.random() - 0.5) * 0.1;

            // Limit velocity
            particle.vx = Math.max(-1, Math.min(1, particle.vx));
            particle.vy = Math.max(-1, Math.min(1, particle.vy));
        }
    }

    drawParticle(particle) {
        this.ctx.font = `${particle.size}px "Courier New", monospace`;
        this.ctx.fillStyle = `rgba(0, 255, 0, ${particle.opacity})`;
        this.ctx.fillText(particle.char, particle.x, particle.y);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw all particles
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Clock update
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const clockElement = document.getElementById('clock');
    if (clockElement) {
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// Typing effect for command
function typeCommand() {
    const commandElement = document.querySelector('.typing-effect');
    if (!commandElement) return;

    const text = commandElement.textContent;
    commandElement.textContent = '';
    commandElement.style.opacity = '1';

    let index = 0;
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            commandElement.textContent += text[index];
            index++;
        } else {
            clearInterval(typeInterval);
        }
    }, 100);
}

// Random screen glitch effect (very subtle)
function screenGlitch() {
    const container = document.querySelector('.container');
    if (Math.random() < 0.002) { // Very rare
        container.style.transform = `translate(${(Math.random() - 0.5) * 5}px, ${(Math.random() - 0.5) * 5}px)`;
        setTimeout(() => {
            container.style.transform = 'translate(0, 0)';
        }, 50);
    }
}

// BBS-style modem loading effect - line by line, character by character
function bbsModemLoad() {
    const content = document.querySelector('.terminal-content');
    const allElements = content.querySelectorAll('pre, h2, h3, p, div.terminal-line');

    let elementIndex = 0;

    function processNextElement() {
        if (elementIndex >= allElements.length) {
            return;
        }

        const el = allElements[elementIndex];
        elementIndex++;

        // Skip the last terminal-line (contains the blinking cursor)
        if (el.classList.contains('terminal-line') && el.querySelector('.cursor')) {
            // Just make it visible without processing
            el.style.visibility = 'visible';
            processNextElement();
            return;
        }

        // Skip if element is empty or only whitespace
        if (!el.textContent.trim()) {
            processNextElement();
            return;
        }

        // Just reveal the element (preserves HTML like links)
        el.style.visibility = 'visible';

        // Delay before processing next element for staggered appearance
        setTimeout(processNextElement, el.tagName === 'PRE' ? 100 : 50);
    }

    processNextElement();
}

// Terminal input handler
let currentTerminalLine = null;
let currentInputSpan = null;
let currentCursor = null;
let inputText = '';
let isActive = false;
let unixEmulator = null;

function createNewTerminalLine() {
    const terminalContent = document.querySelector('.terminal-content');

    // Create new terminal line
    const newLine = document.createElement('div');
    newLine.className = 'terminal-line';
    newLine.style.visibility = 'visible';

    // Create prompt with current user and directory
    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    const currentUser = unixEmulator ? unixEmulator.getCurrentUser() : 'kmitnick';
    let currentDir = unixEmulator ? unixEmulator.getCurrentPath() : '~';
    const homeDir = unixEmulator ? unixEmulator.environment.HOME : '/home/user/kmitnick';

    // Replace home directory with ~
    if (currentDir === homeDir) {
        currentDir = '~';
    } else if (currentDir.startsWith(homeDir + '/')) {
        currentDir = '~' + currentDir.substring(homeDir.length);
    }

    const promptChar = currentUser === 'root' ? '#' : '$';
    prompt.textContent = `${currentUser}@ripline:${currentDir}${promptChar}`;

    // Create input span
    const inputSpan = document.createElement('span');
    inputSpan.className = 'terminal-input';

    // Create cursor
    const cursor = document.createElement('span');
    cursor.className = 'cursor active';
    cursor.textContent = '█';

    // Assemble the line
    newLine.appendChild(prompt);
    newLine.appendChild(document.createTextNode(' '));
    newLine.appendChild(inputSpan);
    newLine.appendChild(cursor);

    // Append to terminal content
    terminalContent.appendChild(newLine);

    // Update current references
    currentTerminalLine = newLine;
    currentInputSpan = inputSpan;
    currentCursor = cursor;
    inputText = '';
}

function displayCommandOutput(output) {
    if (!output) return;

    // Handle special commands
    if (output === '__CLEAR__') {
        // Clear all terminal lines except the header/footer
        const terminalContent = document.querySelector('.terminal-content');
        const allLines = terminalContent.querySelectorAll('.terminal-line, .terminal-output');
        allLines.forEach(line => line.remove());
        return;
    }

    if (output === '__VI_OPENED__') {
        // Vi editor opened, don't show output
        return;
    }

    if (output && output.startsWith('__USER_SWITCHED__:')) {
        // User switched, don't show output - new prompt will reflect the change
        return;
    }

    const terminalContent = document.querySelector('.terminal-content');

    // Create output element
    const outputDiv = document.createElement('div');
    outputDiv.className = 'terminal-output';
    outputDiv.style.visibility = 'visible';
    outputDiv.style.whiteSpace = 'pre-wrap';
    outputDiv.style.margin = '5px 0';
    outputDiv.textContent = output;

    // Append after the current terminal line
    terminalContent.appendChild(outputDiv);
}

function activateTerminal() {
    if (!isActive) {
        isActive = true;
        if (currentCursor) {
            currentCursor.classList.add('active');
        }
    }
}

function deactivateTerminal() {
    if (isActive) {
        isActive = false;
        if (currentCursor) {
            currentCursor.classList.remove('active');
        }
    }
}

// Functions to disable/enable terminal for vi editor
window.disableTerminal = function() {
    deactivateTerminal();
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'none';
    }
};

window.enableTerminal = function() {
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'flex';
    }
    // Reactivate the existing terminal
    activateTerminal();
    window.scrollTo(0, document.body.scrollHeight);
};

function setupClickHandlers() {
    // Set up initial terminal references immediately
    const terminalLine = document.querySelector('div.terminal-line:last-of-type');
    if (terminalLine) {
        const cursor = terminalLine.querySelector('.cursor');
        if (cursor) {
            currentTerminalLine = terminalLine;
            currentCursor = cursor;
        }
    }

    // Make entire terminal content clickable to activate
    const terminalContent = document.querySelector('.terminal-content');
    if (terminalContent) {
        terminalContent.addEventListener('click', (e) => {
            activateTerminal();
            e.stopPropagation();
        });
    }

    // Handle clicks outside terminal to deactivate
    document.addEventListener('click', (e) => {
        const terminalContent = document.querySelector('.terminal-content');

        // Check if click is on a link or interactive element
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            // Don't activate terminal if clicking on a link
            return;
        }

        // If click is outside terminal content, deactivate
        if (terminalContent && !terminalContent.contains(e.target)) {
            deactivateTerminal();
        } else if (terminalContent && terminalContent.contains(e.target)) {
            // Don't activate if clicking on text content elements
            const clickedElement = e.target;
            const isTextElement = ['P', 'H2', 'H3', 'SPAN', 'PRE'].includes(clickedElement.tagName);
            const isProjectDiv = clickedElement.classList.contains('project');

            // Activate terminal if clicking on:
            // - terminal-content itself
            // - content-section (whitespace areas)
            // - terminal-line or its children
            // But NOT on text elements (P, H2, H3, etc.) or project divs
            if (!isTextElement && !isProjectDiv) {
                activateTerminal();
            }
        }
    });
}

function initTerminalInput() {
    const terminalLine = document.querySelector('div.terminal-line:last-of-type');
    const cursor = terminalLine.querySelector('.cursor');
    const prompt = terminalLine.querySelector('.prompt');

    // Update prompt with current user and directory
    if (prompt && unixEmulator) {
        const currentUser = unixEmulator.getCurrentUser();
        let currentDir = unixEmulator.getCurrentPath();
        const homeDir = unixEmulator.environment.HOME;

        // Replace home directory with ~
        if (currentDir === homeDir) {
            currentDir = '~';
        } else if (currentDir.startsWith(homeDir + '/')) {
            currentDir = '~' + currentDir.substring(homeDir.length);
        }

        const promptChar = currentUser === 'root' ? '#' : '$';
        prompt.textContent = `${currentUser}@ripline:${currentDir}${promptChar}`;
    }

    // Create a span to hold the typed text
    const inputSpan = document.createElement('span');
    inputSpan.className = 'terminal-input';
    terminalLine.insertBefore(inputSpan, cursor);

    // Set current references
    currentTerminalLine = terminalLine;
    currentInputSpan = inputSpan;
    currentCursor = cursor;

    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        // Only handle input if terminal is active
        if (!isActive) return;

        // Prevent default for terminal-related keys
        if (e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab' || e.key.length === 1) {
            e.preventDefault();
        }

        if (e.key === 'Backspace') {
            inputText = inputText.slice(0, -1);
            currentInputSpan.textContent = inputText;
        } else if (e.key === 'Tab') {
            // Tab completion
            if (!inputText.trim()) return;

            const completions = unixEmulator.getCompletions(inputText);

            if (completions.matches.length === 1) {
                // Single match - auto complete
                const match = completions.matches[0];

                if (completions.type === 'command') {
                    inputText = match;
                } else if (completions.type === 'path') {
                    // Replace the path part
                    const parts = inputText.split(/\s+/);
                    const pathPrefix = completions.prefix;

                    if (pathPrefix.includes('/')) {
                        const lastSlash = pathPrefix.lastIndexOf('/');
                        const dirPart = pathPrefix.substring(0, lastSlash + 1);
                        parts[parts.length - 1] = dirPart + match;
                    } else {
                        parts[parts.length - 1] = match;
                    }

                    inputText = parts.join(' ');
                }

                currentInputSpan.textContent = inputText;
            } else if (completions.matches.length > 1) {
                // Multiple matches - show them
                const matchList = completions.matches.join('  ');
                displayCommandOutput(matchList);
            }
        } else if (e.key === 'Enter') {
            // Execute the command
            const output = unixEmulator.execute(inputText);

            // Remove cursor from current line
            currentCursor.classList.remove('active');
            currentCursor.style.display = 'none';

            // Display command output
            displayCommandOutput(output);

            // Create new terminal line
            createNewTerminalLine();

            // Scroll to bottom
            window.scrollTo(0, document.body.scrollHeight);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            // Regular character
            inputText += e.key;
            currentInputSpan.textContent = inputText;
        }
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Unix emulator
    unixEmulator = new UnixEmulator();

    // Start matrix background
    new MatrixBackground();

    // Update clock
    updateClock();
    setInterval(updateClock, 1000);

    // Set up click handlers immediately so terminal can be activated right away
    setupClickHandlers();

    // BBS modem loading effect
    bbsModemLoad();

    // Initialize terminal input after loading completes
    setTimeout(() => {
        initTerminalInput();
    }, 3000); // Adjust timing based on loading duration

    // Typing effect (after a short delay)
    setTimeout(typeCommand, 500);

    // Occasional glitch effect
    setInterval(screenGlitch, 100);

    // Add subtle hover effects to project sections
    document.querySelectorAll('.project').forEach(project => {
        project.addEventListener('mouseenter', function() {
            this.style.borderLeftColor = '#00ff00';
            this.style.paddingLeft = '25px';
            this.style.transition = 'all 0.3s ease';
        });

        project.addEventListener('mouseleave', function() {
            this.style.borderLeftColor = '#00aa00';
            this.style.paddingLeft = '20px';
        });
    });
});

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
