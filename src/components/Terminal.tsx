import { useEffect, useRef, useState } from 'react';
import { UnixShell } from 'unix-shell-js';
import { createRiplineFileSystem } from '../lib/riplineFilesystem';
import { customCommands } from '../lib/customCommands';

export default function Terminal() {
  const [shellInstance, setShellInstance] = useState<any>(null);
  const [currentPrompt, setCurrentPrompt] = useState('kmitnick@ripline:~$');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize shell
    console.log('UnixShell:', UnixShell);
    console.log('typeof UnixShell:', typeof UnixShell);

    if (!UnixShell) {
      console.error('UnixShell not available!');
      return;
    }

    try {
      const shell = new UnixShell({
        username: 'kmitnick',
        fileSystem: createRiplineFileSystem(),
        customCommands: customCommands,
        persistence: {
          enabled: true,
          prefix: 'ripline',
        },
      });

      console.log('Shell initialized:', shell);
      setShellInstance(shell);
      updatePrompt(shell);

      // Focus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error initializing shell:', error);
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

  const addOutput = (text: string) => {
    if (!terminalRef.current) return;

    const output = document.createElement('div');
    output.className = 'terminal-output';
    output.textContent = text;

    const inputLine = terminalRef.current.querySelector('.terminal-line:last-child');
    if (inputLine) {
      terminalRef.current.insertBefore(output, inputLine);
    }
  };

  const handleCommand = (command: string) => {
    if (!shellInstance || !command.trim()) return;

    // Show command with prompt
    const commandLine = document.createElement('div');
    commandLine.className = 'terminal-line terminal-history';
    commandLine.innerHTML = `<span class="prompt">${currentPrompt}</span> ${command}`;

    const inputLine = terminalRef.current?.querySelector('.terminal-line:last-child');
    if (inputLine && terminalRef.current) {
      terminalRef.current.insertBefore(commandLine, inputLine);
    }

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

    // Scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = e.currentTarget.value.trim();
      if (command) {
        handleCommand(command);
      }
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
        // Multiple matches - show them
        const matchList = completions.matches.join('  ');
        addOutput(matchList);
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
