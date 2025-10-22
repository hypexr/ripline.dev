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

        // Store original content and clear
        const originalHTML = el.innerHTML;
        const originalText = el.textContent;
        el.textContent = '';
        el.style.visibility = 'visible';

        // For ASCII logo (pre tag), reveal line by line
        if (el.tagName === 'PRE') {
            const lines = originalHTML.split('\n');
            let lineIndex = 0;

            function revealNextLine() {
                if (lineIndex < lines.length) {
                    el.textContent += (lineIndex > 0 ? '\n' : '') + lines[lineIndex];
                    lineIndex++;
                    setTimeout(revealNextLine, 400);
                } else {
                    setTimeout(processNextElement, 50);
                }
            }
            revealNextLine();
        } else {
            // Character by character for other elements
            let charIndex = 0;

            function revealNextChar() {
                if (charIndex < originalText.length) {
                    el.textContent += originalText[charIndex];
                    charIndex++;
                    setTimeout(revealNextChar, 8);
                } else {
                    setTimeout(processNextElement, 30);
                }
            }
            revealNextChar();
        }
    }

    processNextElement();
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Start matrix background
    new MatrixBackground();

    // Update clock
    updateClock();
    setInterval(updateClock, 1000);

    // BBS modem loading effect
    bbsModemLoad();

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

    // Console message for visitors
    console.log('%c╔═══════════════════════════════════════╗', 'color: #00ff00; font-family: monospace');
    console.log('%c║   WELCOME TO RIPLINE.DEV TERMINAL    ║', 'color: #00ff00; font-family: monospace');
    console.log('%c║   Curious developer? We like that.   ║', 'color: #00ff00; font-family: monospace');
    console.log('%c╚═══════════════════════════════════════╝', 'color: #00ff00; font-family: monospace');
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
