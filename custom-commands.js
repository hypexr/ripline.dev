// Custom commands for RIPLINE terminal
// These extend the basic Unix shell with project-specific commands

const customCommands = {
    ps: function(args) {
        // Parse flags
        let showAll = false;
        let fullFormat = false;
        let userFormat = false;

        for (const arg of args) {
            if (arg === 'aux' || arg === '-aux') {
                showAll = true;
                userFormat = true;
                fullFormat = true;
            } else if (arg === '-a' || arg === 'a') {
                showAll = true;
            } else if (arg === '-u' || arg === 'u') {
                userFormat = true;
            } else if (arg === '-x' || arg === 'x') {
                fullFormat = true;
            } else if (arg === '-ef' || arg === 'ef') {
                showAll = true;
                fullFormat = true;
            }
        }

        // Base processes - always visible
        const processes = [
            { pid: 1, user: 'root', cpu: 0.0, mem: 0.1, vsz: 169420, rss: 13452, tty: '?', stat: 'Ss', start: '10:15', time: '0:01', command: '/sbin/init' },
            { pid: 234, user: 'root', cpu: 0.0, mem: 0.2, vsz: 71256, rss: 6234, tty: '?', stat: 'S<s', start: '10:15', time: '0:00', command: '[kthreadd]' },
            { pid: 512, user: 'root', cpu: 0.1, mem: 0.3, vsz: 284712, rss: 15236, tty: '?', stat: 'Ssl', start: '10:15', time: '0:02', command: '/usr/sbin/sshd -D' },
            { pid: 1024, user: 'root', cpu: 0.0, mem: 0.5, vsz: 445672, rss: 28491, tty: '?', stat: 'Ss', start: '10:15', time: '0:01', command: '/usr/sbin/nginx -g daemon off;' },
        ];

        // Suspicious processes - only visible with -a or aux
        if (showAll) {
            processes.push(
                { pid: 666, user: 'root', cpu: 12.3, mem: 8.7, vsz: 2456789, rss: 445123, tty: '?', stat: 'R', start: '10:16', time: '15:42', command: '/usr/bin/.hidden/cryptominer --pool=darkpool.onion' },
                { pid: 1337, user: 'kmitnick', cpu: 0.3, mem: 2.1, vsz: 892341, rss: 108234, tty: '?', stat: 'S', start: '10:17', time: '0:23', command: './backdoor.sh --listen 31337' },
                { pid: 2600, user: 'root', cpu: 0.8, mem: 3.4, vsz: 1234567, rss: 176234, tty: '?', stat: 'Ss', start: '10:18', time: '1:12', command: '/opt/trojan/keylogger -o /tmp/.logs' },
                { pid: 3133, user: 'nobody', cpu: 1.2, mem: 1.8, vsz: 734521, rss: 92341, tty: '?', stat: 'R', start: '10:19', time: '2:34', command: 'python3 /tmp/botnet_client.py' },
                { pid: 4096, user: 'www-data', cpu: 0.2, mem: 0.9, vsz: 456789, rss: 45123, tty: '?', stat: 'S', start: '10:20', time: '0:08', command: '/bin/bash /var/www/.shell/reverse.sh' },
                { pid: 5555, user: 'root', cpu: 15.6, mem: 12.3, vsz: 3456789, rss: 623451, tty: '?', stat: 'R', start: '09:23', time: '45:17', command: '/usr/sbin/mimikatz --dump-creds' },
                { pid: 6969, user: 'kmitnick', cpu: 0.1, mem: 0.4, vsz: 234567, rss: 23456, tty: 'pts/0', stat: 'S', start: '11:42', time: '0:00', command: 'nc -lvp 4444 -e /bin/bash' }
            );
        }

        // User's current shell
        processes.push(
            { pid: 7891, user: this.currentUser, cpu: 0.0, mem: 0.3, vsz: 123456, rss: 12345, tty: 'pts/1', stat: 'Ss', start: '10:22', time: '0:00', command: '-bash' },
            { pid: 7892, user: this.currentUser, cpu: 0.0, mem: 0.1, vsz: 45678, rss: 2345, tty: 'pts/1', stat: 'R+', start: '10:23', time: '0:00', command: 'ps ' + args.join(' ') }
        );

        // Sort by PID
        processes.sort((a, b) => a.pid - b.pid);

        // Format output
        if (userFormat) {
            // BSD-style output (ps aux)
            let output = 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n';
            processes.forEach(p => {
                output += `${p.user.padEnd(10)} ${String(p.pid).padStart(4)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${String(p.vsz).padStart(6)} ${String(p.rss).padStart(5)} ${p.tty.padEnd(8)} ${p.stat.padEnd(4)} ${p.start.padEnd(5)} ${p.time.padStart(6)} ${p.command}\n`;
            });
            return output;
        } else if (fullFormat) {
            // Simple format with more processes
            let output = '  PID TTY      STAT   TIME COMMAND\n';
            processes.forEach(p => {
                output += `${String(p.pid).padStart(5)} ${p.tty.padEnd(8)} ${p.stat.padEnd(4)} ${p.time.padStart(6)} ${p.command}\n`;
            });
            return output;
        } else {
            // Minimal format - only current user processes
            const userProcesses = processes.filter(p => p.user === this.currentUser || p.tty.startsWith('pts'));
            let output = '  PID TTY          TIME CMD\n';
            userProcesses.forEach(p => {
                const cmd = p.command.split(' ')[0].split('/').pop();
                output += `${String(p.pid).padStart(5)} ${p.tty.padEnd(12)} ${p.time.padStart(8)} ${cmd}\n`;
            });
            return output;
        }
    },

    rm: function(args) {
        // Get reference to the original built-in rm command
        // We need to access it before it gets overridden
        const builtInCommands = Object.getPrototypeOf(this).constructor.prototype.initializeCommands.toString();

        // Call the built-in rm by accessing the cmd_rm method directly
        const result = this.cmd_rm(args);

        // Check if the result contains a permission denied error
        if (result && result.includes('Permission denied')) {
            return result + '\nSECURITY ALERT: This incident has been reported.';
        }

        return result;
    },

    reset: function(args) {
        if (args[0] === '--filesystem' || args[0] === '-f') {
            // Clear filesystem from localStorage
            localStorage.removeItem('ripline_filesystem');
            localStorage.removeItem('ripline_current_path');
            localStorage.removeItem('ripline_current_user');
            return 'Filesystem reset. Please reload the page.';
        }
        return 'Usage: reset --filesystem (or -f) to reset the filesystem';
    }
};

// Make available in browser
if (typeof window !== 'undefined') {
    window.customCommands = customCommands;
}
