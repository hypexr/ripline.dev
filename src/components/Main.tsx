import { useEffect, useRef, useState } from 'react';
import { UnixShell } from 'unix-shell-js';
import { createRiplineFileSystem } from '../lib/riplineFilesystem';
import { customCommands } from '../lib/customCommands';

export default function Main() {
  const [shellInstance, setShellInstance] = useState<any>(null);
  const [currentPrompt, setCurrentPrompt] = useState('kmitnick@ripline:~$');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize shell
    const shell = new UnixShell({
      username: 'kmitnick',
      fileSystem: createRiplineFileSystem(),
      customCommands: customCommands,
      persistence: {
        enabled: true,
        prefix: 'ripline',
      },
    });

    setShellInstance(shell);
    updatePrompt(shell);

    // Focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const updatePrompt = (shell: any) => {
    const user = shell.getCurrentUser();
    let path = shell.getCurrentPath();
    const home = shell.environment.HOME;

    // Replace home with ~
    if (path === home) {
      path = '~';
    } else if (path.startsWith(home + '/')) {
      path = '~' + path.substring(home.length);
    }

    setCurrentPrompt(`${user}@ripline:${path}$`);
  };

  const addOutput = (text: string, className: string = 'terminal-output') => {
    if (!terminalRef.current) return;

    const output = document.createElement('div');
    output.className = className;

    // Use <pre> for multi-line output to preserve newlines
    if (text.includes('\n')) {
      const pre = document.createElement('pre');
      pre.textContent = text;
      pre.style.margin = '0';
      pre.style.whiteSpace = 'pre-wrap';
      output.appendChild(pre);
    } else {
      output.textContent = text;
    }

    const inputLine = terminalRef.current.querySelector('.terminal-line:last-child');
    if (inputLine) {
      terminalRef.current.insertBefore(output, inputLine);
    }
  };

  const handleCommand = (command: string) => {
    if (!shellInstance) return;

    // Show command with prompt (even if empty, like a real terminal)
    const commandLine = document.createElement('div');
    commandLine.className = 'terminal-line terminal-history';
    commandLine.innerHTML = `<span class="prompt">${currentPrompt}</span> ${command}`;

    const inputLine = terminalRef.current?.querySelector('.terminal-line:last-child');
    if (inputLine && terminalRef.current) {
      terminalRef.current.insertBefore(commandLine, inputLine);
    }

    // Only execute if command is not empty
    if (command.trim()) {
      // Execute command
      const output = shellInstance.execute(command);

      // Handle special outputs
      if (output === '__CLEAR__') {
        // Clear terminal
        const outputs = terminalRef.current?.querySelectorAll(
          '.terminal-output, .terminal-line:not(:last-child)'
        );
        outputs?.forEach((el) => el.remove());
      } else if (output === '__VI_OPENED__') {
        // Vi editor opened
      } else if (output && output.startsWith('__USER_SWITCHED__:')) {
        // User switched
        updatePrompt(shellInstance);
      } else if (output) {
        // Show output
        addOutput(output);
      }

      // Update prompt in case path changed
      updatePrompt(shellInstance);
    }

    // Scroll to bottom of page
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Ctrl+C - cancel current command
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();

      const currentInput = e.currentTarget.value;

      // Show the cancelled command with ^C
      const commandLine = document.createElement('div');
      commandLine.className = 'terminal-line terminal-history';
      commandLine.innerHTML = `<span class="prompt">${currentPrompt}</span> ${currentInput}^C`;

      const inputLine = terminalRef.current?.querySelector('.terminal-line:last-child');
      if (inputLine && terminalRef.current) {
        terminalRef.current.insertBefore(commandLine, inputLine);
      }

      // Clear the input
      e.currentTarget.value = '';

      // Scroll to bottom
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });

      return;
    }

    if (e.key === 'Enter') {
      const command = e.currentTarget.value;
      handleCommand(command);
      e.currentTarget.value = '';
    } else if (e.key === 'Tab') {
      e.preventDefault();

      const partial = e.currentTarget.value.trim();
      if (!partial) return;

      const completions = shellInstance.getCompletions(partial);

      if (completions.matches.length === 1) {
        // Single match - auto complete
        const match = completions.matches[0];

        if (completions.type === 'command') {
          e.currentTarget.value = match;
        } else if (completions.type === 'path') {
          // Replace the path part
          const parts = partial.split(/\s+/);
          const pathPrefix = completions.prefix;

          if (pathPrefix.includes('/')) {
            const lastSlash = pathPrefix.lastIndexOf('/');
            const dirPart = pathPrefix.substring(0, lastSlash + 1);
            parts[parts.length - 1] = dirPart + match;
          } else {
            parts[parts.length - 1] = match;
          }

          e.currentTarget.value = parts.join(' ');
        }
      } else if (completions.matches.length > 1) {
        // Find common prefix among all matches
        const findCommonPrefix = (matches: string[]): string => {
          if (matches.length === 0) return '';
          const first = matches[0];
          let commonPrefix = first;

          for (let i = 1; i < matches.length; i++) {
            let j = 0;
            while (j < commonPrefix.length && j < matches[i].length && commonPrefix[j] === matches[i][j]) {
              j++;
            }
            commonPrefix = commonPrefix.substring(0, j);
            if (commonPrefix === '') break;
          }
          return commonPrefix;
        };

        const commonPrefix = findCommonPrefix(completions.matches);

        // Auto-complete to common prefix if it extends beyond what's already typed
        if (completions.type === 'command') {
          const currentCmd = partial;
          if (commonPrefix.length > currentCmd.length) {
            e.currentTarget.value = commonPrefix;
          }
        } else if (completions.type === 'path') {
          const parts = partial.split(/\s+/);
          const pathPrefix = completions.prefix;

          // Extract just the filename part being completed
          let filePrefix = pathPrefix;
          if (pathPrefix.includes('/')) {
            const lastSlash = pathPrefix.lastIndexOf('/');
            filePrefix = pathPrefix.substring(lastSlash + 1);
          }

          if (commonPrefix.length > filePrefix.length) {
            // Update with common prefix
            if (pathPrefix.includes('/')) {
              const lastSlash = pathPrefix.lastIndexOf('/');
              const dirPart = pathPrefix.substring(0, lastSlash + 1);
              parts[parts.length - 1] = dirPart + commonPrefix;
            } else {
              parts[parts.length - 1] = commonPrefix;
            }
            e.currentTarget.value = parts.join(' ');
          }
        }

        // Show all matches
        const matchList = completions.matches.join('  ');

        // Only replace if the previous element before input is tab-completions
        const inputLine = terminalRef.current?.querySelector('.terminal-line:last-child');
        const prevElement = inputLine?.previousElementSibling;

        if (prevElement && prevElement.classList.contains('tab-completions')) {
          // Replace existing completions
          prevElement.textContent = matchList;
        } else {
          // Add blank line before completions for spacing
          const blankLine = document.createElement('div');
          blankLine.className = 'terminal-output';
          blankLine.innerHTML = '&nbsp;';
          if (inputLine && terminalRef.current) {
            terminalRef.current.insertBefore(blankLine, inputLine);
          }

          // Add new completions
          addOutput(matchList, 'tab-completions');
        }
      }
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };


  return (
    <div className="container" onClick={handleClick}>
      <header className="terminal-header">
        <div className="status-bar">
          <span className="blink">●</span>&nbsp;CONNECTED TO RIPLINE.DEV
          <span className="float-right" id="clock">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </header>

      <main className="terminal-content" ref={terminalRef}>
        <pre className="ascii-logo">
          {`██████╗ ██╗██████╗ ██╗     ██╗███╗   ██╗███████╗
██╔══██╗██║██╔══██╗██║     ██║████╗  ██║██╔════╝
██████╔╝██║██████╔╝██║     ██║██╔██╗ ██║█████╗
██╔══██╗██║██╔═══╝ ██║     ██║██║╚██╗██║██╔══╝
██║  ██║██║██║     ███████╗██║██║ ╚████║███████║
╚═╝  ╚═╝╚═╝╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝`}
        </pre>

        <section className="content-section">
          <h2>&gt;&gt; APPS</h2>
          <div className="project">
            <h3>I CAN HAS GOAL</h3>
            <p>A powerful tool to build better habits and track your progress.</p>
            <p>Transform your daily routines into measurable growth.</p>
          </div>
        </section>

        <section className="content-section">
          <h2>&gt;&gt; CONTACT</h2>
          <p>Interested in our projects? Reach out.</p>
          <p>
            Email: <a href="mailto:hello@ripline.dev">hello@ripline.dev</a>
          </p>
        </section>

        <div className="terminal-line">
          <span className="prompt">{currentPrompt}</span>{' '}
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onKeyDown={handleKeyDown}
          />
        </div>
      </main>

      {/* Hidden input for mobile keyboard support */}
      <input
        ref={mobileInputRef}
        type="text"
        id="mobile-input"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onKeyDown={handleKeyDown}
      />

      <footer className="terminal-footer">
        <div className="status-bar">[ RIPLINE © 2025 ]</div>
      </footer>
    </div>
  );
}
