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

        // For elements with HTML (like links), just reveal them
        if (el.querySelector('a')) {
            el.style.visibility = 'visible';
            setTimeout(processNextElement, 50);
            return;
        }

        // Character-by-character rendering for text elements
        const originalText = el.textContent;
        el.textContent = '';
        el.style.visibility = 'visible';

        let charIndex = 0;
        const charDelay = el.tagName === 'PRE' ? 1 : 3; // Modem speed for ASCII art, slightly slower for text

        function typeNextChar() {
            if (charIndex < originalText.length) {
                el.textContent += originalText[charIndex];
                charIndex++;

                // Use requestAnimationFrame with manual delay tracking for consistent timing
                const startTime = performance.now();
                function rafWait() {
                    if (performance.now() - startTime >= charDelay) {
                        typeNextChar();
                    } else {
                        requestAnimationFrame(rafWait);
                    }
                }
                requestAnimationFrame(rafWait);
            } else {
                // Move to next element after a brief pause
                setTimeout(processNextElement, 20);
            }
        }

        typeNextChar();
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
let mobileInput = null;

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

    // Clear mobile input
    if (mobileInput) {
        mobileInput.value = '';
    }
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
        // Focus hidden input for mobile keyboard
        if (mobileInput) {
            mobileInput.focus();
        }
    }
}

function deactivateTerminal() {
    if (isActive) {
        isActive = false;
        if (currentCursor) {
            currentCursor.classList.remove('active');
        }
        // Blur hidden input
        if (mobileInput) {
            mobileInput.blur();
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
    // Scroll to bottom after layout is updated - use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
    });
};

function setupClickHandlers() {
    // Set up initial terminal references immediately
    const terminalLine = document.querySelector('div.terminal-line:last-of-type');
    if (terminalLine) {
        const cursor = terminalLine.querySelector('.cursor');
        if (cursor) {
            currentTerminalLine = terminalLine;
            currentCursor = cursor;

            // Create input span for typed text
            const inputSpan = document.createElement('span');
            inputSpan.className = 'terminal-input';
            terminalLine.insertBefore(inputSpan, cursor);
            currentInputSpan = inputSpan;
        }
    }

    // Handle clicks to activate/deactivate terminal
    document.addEventListener('click', (e) => {
        const terminalContent = document.querySelector('.terminal-content');

        // Check if click is on a link or interactive element
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            // Don't activate terminal if clicking on a link
            return;
        }

        // Check if clicked directly on ASCII logo or it's a parent
        if (e.target.classList.contains('ascii-logo') || e.target.closest('.ascii-logo')) {
            deactivateTerminal(); // Deactivate if clicking on logo
            return;
        }

        // Check if clicked on text elements or content
        if (e.target.classList.contains('content-section') || e.target.closest('.content-section')) {
            // Get the element that was actually clicked
            const clickedElement = e.target;

            // If clicking on actual text elements (H2, P, A, etc), deactivate
            if (['H2', 'H3', 'P', 'A', 'SPAN'].includes(clickedElement.tagName) ||
                clickedElement.classList.contains('project')) {
                deactivateTerminal();
                return;
            }

            // If clicking on the content-section div itself (whitespace/padding), check position
            const contentSection = clickedElement.classList.contains('content-section')
                ? clickedElement
                : clickedElement.closest('.content-section');

            if (contentSection) {
                const contentSections = document.querySelectorAll('.content-section');
                const lastContentSection = contentSections[contentSections.length - 1];

                // Only activate if clicking on the last content section's whitespace
                if (contentSection === lastContentSection) {
                    activateTerminal();
                    return;
                } else {
                    deactivateTerminal();
                    return;
                }
            }
        }

        // If click is outside terminal content, deactivate
        if (terminalContent && !terminalContent.contains(e.target)) {
            deactivateTerminal();
        } else if (terminalContent && terminalContent.contains(e.target)) {
            // Check if clicking on terminal-line or below content sections
            // This allows activation in the space right under email and on the prompt line
            const terminalLine = document.querySelector('.terminal-line');

            if (terminalLine && (e.target === terminalLine || terminalLine.contains(e.target))) {
                // Clicking directly on the terminal line - activate
                activateTerminal();
            } else {
                // Check if click is in the empty space below content sections
                const contentSections = document.querySelectorAll('.content-section');
                const lastContentSection = contentSections[contentSections.length - 1];

                if (lastContentSection) {
                    const clickY = e.clientY;

                    // Get the top of the last content section
                    const lastSectionTop = lastContentSection.getBoundingClientRect().top;

                    // Activate if click is below the top of the last content section
                    // This allows clicking anywhere in or below the contact section
                    if (clickY >= lastSectionTop) {
                        activateTerminal();
                    } else {
                        // Click is above the last content section - deactivate
                        deactivateTerminal();
                    }
                } else {
                    // No content sections found, activate anywhere
                    activateTerminal();
                }
            }
        }
    });
}

function setupKeyboardHandlers() {
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
            if (currentInputSpan) {
                currentInputSpan.textContent = inputText;
            }
        } else if (e.key === 'Tab') {
            // Tab completion
            if (!inputText.trim() || !unixEmulator) return;

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

                if (currentInputSpan) {
                    currentInputSpan.textContent = inputText;
                }
            } else if (completions.matches.length > 1) {
                // Multiple matches - show them
                const matchList = completions.matches.join('  ');
                displayCommandOutput(matchList);
            }
        } else if (e.key === 'Enter') {
            // Execute the command
            if (!unixEmulator) return;

            const output = unixEmulator.execute(inputText);

            // Remove cursor from current line
            if (currentCursor) {
                currentCursor.classList.remove('active');
                currentCursor.style.display = 'none';
            }

            // Display command output
            displayCommandOutput(output);

            // Create new terminal line
            createNewTerminalLine();

            // Scroll to bottom
            window.scrollTo(0, document.body.scrollHeight);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            // Regular character
            inputText += e.key;
            if (currentInputSpan) {
                currentInputSpan.textContent = inputText;
            }
        }
    });
}

function initTerminalInput() {
    const terminalLine = document.querySelector('div.terminal-line:last-of-type');
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

    // References are already set up by setupClickHandlers, just verify they exist
    if (!currentInputSpan) {
        const cursor = terminalLine.querySelector('.cursor');
        const inputSpan = document.createElement('span');
        inputSpan.className = 'terminal-input';
        terminalLine.insertBefore(inputSpan, cursor);
        currentInputSpan = inputSpan;
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Unix emulator with custom filesystem, commands, and built-in persistence
    unixEmulator = new UnixShell({
        username: 'kmitnick',
        fileSystem: createRiplineFileSystem(),
        customCommands: customCommands,
        persistence: {
            enabled: true,
            prefix: 'ripline'  // Uses 'ripline_filesystem', 'ripline_current_user', 'ripline_current_path'
        }
    });

    // Always start in home directory on page load
    unixEmulator.currentPath = unixEmulator.environment.HOME;
    unixEmulator.environment.PWD = unixEmulator.environment.HOME;

    // Initialize mobile input
    mobileInput = document.getElementById('mobile-input');

    // Set up mobile input event listeners
    if (mobileInput) {
        mobileInput.addEventListener('input', (e) => {
            if (!isActive) return;

            // Sync mobile input with terminal
            inputText = e.target.value;
            if (currentInputSpan) {
                currentInputSpan.textContent = inputText;
            }
        });

        mobileInput.addEventListener('keydown', (e) => {
            if (!isActive) return;

            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();

                // Clear mobile input
                mobileInput.value = '';

                // Execute the command
                if (!unixEmulator) return;

                const output = unixEmulator.execute(inputText);

                // Remove cursor from current line
                if (currentCursor) {
                    currentCursor.classList.remove('active');
                    currentCursor.style.display = 'none';
                }

                // Display command output
                displayCommandOutput(output);

                // Create new terminal line
                createNewTerminalLine();

                // Scroll to bottom
                window.scrollTo(0, document.body.scrollHeight);
            }
        });
    }

    // Start matrix background
    new MatrixBackground();

    // Update clock
    updateClock();
    setInterval(updateClock, 1000);

    // Set up click and keyboard handlers immediately so terminal can be used right away
    setupClickHandlers();
    setupKeyboardHandlers();

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
