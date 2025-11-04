import { useEffect, useRef, useState } from 'react';
import Terminal from './Terminal';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const loadingTextRef = useRef<HTMLSpanElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);

  // BBS loading effect - character by character using setTimeout
  useEffect(() => {
    if (!loadingTextRef.current) {
      console.log('loadingTextRef not available');
      return;
    }

    console.log('Starting BBS animation');

    const fullText = `██████╗ ██╗██████╗ ██╗     ██╗███╗   ██╗███████╗
██╔══██╗██║██╔══██╗██║     ██║████╗  ██║██╔════╝
██████╔╝██║██████╔╝██║     ██║██╔██╗ ██║█████╗
██╔══██╗██║██╔═══╝ ██║     ██║██║╚██╗██║██╔══╝
██║  ██║██║██║     ███████╗██║██║ ╚████║███████║
╚═╝  ╚═╝╚═╝╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝

>> APPS

I CAN HAS GOAL
A powerful tool to build better habits and track your progress.
Transform your daily routines into measurable growth.

>> CONTACT
Interested in our projects? Reach out.
Email: hello@ripline.dev`;

    let currentIndex = 0;
    const charDelay = 10; // milliseconds per character
    const chunkSize = 3; // characters per update for smoother appearance

    const typeNextChunk = () => {
      if (currentIndex < fullText.length && loadingTextRef.current) {
        const endIndex = Math.min(currentIndex + chunkSize, fullText.length);
        const displayText = fullText.substring(0, endIndex);
        loadingTextRef.current.textContent = displayText;
        currentIndex = endIndex;

        setTimeout(typeNextChunk, charDelay);
      } else {
        // Animation complete
        console.log('Animation complete');
        setIsLoading(false);
      }
    };

    // Start animation
    typeNextChunk();

    // Cleanup function - not much to clean up with setTimeout chain
    return () => {
      console.log('Component unmounting');
    };
  }, []);

  // Focus terminal when loading completes
  useEffect(() => {
    if (!isLoading) {
      // Wait a bit for Terminal to mount, then focus and scroll to top
      setTimeout(() => {
        if (terminalContentRef.current) {
          const input = terminalContentRef.current.querySelector('input');
          if (input) {
            (input as HTMLInputElement).focus({ preventScroll: true });
          }
        }
        window.scrollTo(0, 0);
      }, 150);
    }
  }, [isLoading]);

  const handleClick = () => {
    if (!isLoading && terminalContentRef.current) {
      const input = terminalContentRef.current.querySelector('input');
      if (input) {
        (input as HTMLInputElement).focus();
      }
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

      <main className="terminal-content" ref={terminalContentRef}>
        {/* Animated loading display */}
        {isLoading ? (
          <pre className="ascii-logo bbs-loading">
            <span ref={loadingTextRef}></span>
            <span className="cursor">█</span>
          </pre>
        ) : (
          <>
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

            <Terminal />
          </>
        )}
      </main>

      <footer className="terminal-footer">
        <div className="status-bar">[ RIPLINE © 2025 ]</div>
      </footer>
    </div>
  );
}
