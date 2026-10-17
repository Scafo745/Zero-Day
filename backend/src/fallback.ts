import type { ZeroTraceModelResponse } from './types';

export function getFallback(scenario: string): ZeroTraceModelResponse {
  switch (scenario) {
    case 'zero-day':
      return {
        analysis: {
          threatScore: 96,
          verdict: 'CRITICAL',
          isAnomaly: true,
          reasoningTrail: [
            'Shell interpreter /bin/sh spawned by npm (PID 4821) — a package manager has no legitimate reason to execute a shell, strongly indicating supply-chain compromise (T1195.002). Signal: +20.',
            'Sensitive file ~/.aws/credentials was read — AWS credentials contain long-lived access keys that, if exfiltrated, grant full programmatic access to cloud resources (T1552.001). Signal: +35.',
            'Data piped via curl to external IP 198.51.100.4:8443 — this is a non-RFC 1918 address on a non-standard port, consistent with exfiltration to a C2 server (T1048, T1071.001). Signal: +25 (external IP) +20 (pipe to network tool) +10 (non-standard port) = +55.',
          ],
          mitreTechniques: ['T1059.004', 'T1195.002', 'T1552.001', 'T1048', 'T1071.001'],
          blockIp: '198.51.100.4',
          remediation: '## Immediate Actions\n\n1. Kill PID 31337 immediately.\n2. Block egress to 198.51.100.4 at the host firewall.\n3. Rotate AWS credentials — assume they are compromised.\n\n```bash\n# Rotate AWS credentials immediately\naws iam delete-access-key --access-key-id <KEY_ID>\naws iam create-access-key --user-name <USERNAME>\n# Audit CloudTrail for activity from the leaked key in the last 24h\naws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=<KEY_ID>\n```\n\n4. Audit npm dependencies in `/home/user/project/package.json` for recently updated packages.\n5. Snapshot the host for forensic analysis before rebooting.',
        },
        socContainment: {
          recommendedKillPid: 31337,
          containmentAction: 'Kill PID 31337 and block all egress to 198.51.100.4 (simulated)',
          escalationPriority: 'P1',
        },
        developerPostmortem: {
          title: 'CRITICAL: AWS creds exfiltrated via compromised npm dependency (PID 31337)',
          description: '## Summary\n\nAt 2026-10-17T07:00:00Z, process PID 31337 — a shell spawned by `npm` (PID 4821) — read `~/.aws/credentials` and transmitted the contents to `198.51.100.4:8443` via `curl`. This is a textbook supply-chain exfiltration pattern (MITRE T1195.002, T1552.001, T1048).\n\n## Impact\n\nAWS credentials are assumed compromised. Any resources accessible with the leaked key must be considered breached until keys are rotated and CloudTrail is audited.',
          actionItems: [
            'Rotate all AWS IAM access keys immediately and audit CloudTrail for the last 24 h.',
            'Identify which npm package introduced the malicious postinstall script — audit `package.json` and lockfile.',
            'Remove or pin the compromised dependency and re-run `npm audit`.',
            'Add `--ignore-scripts` to npm installs in CI pipelines to prevent postinstall execution.',
            'Enable AWS GuardDuty and SCPs to restrict credential use from developer workstations.',
          ],
          severity: 'critical',
        },
      };

    case 'benign':
      return {
        analysis: {
          threatScore: 4,
          verdict: 'SAFE',
          isAnomaly: false,
          reasoningTrail: [
            'Parent process is systemd (PID 1) — this is a standard service-unit launch pattern. There is no lateral movement indicator. Signal: -20.',
            'Command line \'node /srv/app/dist/server.js --port 3000\' matches a known-good Node.js server startup pattern: canonical binary path, structured argument, standard HTTP port. Signal: -15.',
            'Working directory /srv/app is a conventional service root; no sensitive files were touched and there are no outbound network destinations. Signals: -10 (workdir) -10 (no network) = -20.',
          ],
          mitreTechniques: [],
          blockIp: '',
          remediation: 'No action required. Process is operating within expected parameters for a Node.js web service managed by systemd.',
        },
        socContainment: {
          recommendedKillPid: 1234,
          containmentAction: 'No containment required — process is safe',
          escalationPriority: 'P3',
        },
        developerPostmortem: {
          title: 'INFO: Benign Node.js service launch detected (PID 1234)',
          description: '## Summary\n\nProcess PID 1234 is a standard Node.js application server launched by systemd. No anomalous behavior was detected. Score: 4/100 (SAFE).\n\nThis is an expected pattern for a production web service.',
          actionItems: [],
          severity: 'low',
        },
      };

    case 'borderline-deploy':
      return {
        analysis: {
          threatScore: 45,
          verdict: 'SUSPICIOUS',
          isAnomaly: true,
          reasoningTrail: [
            'Deploy script reads /opt/deploy/.env.production — environment files may contain secrets (API keys, database passwords). Not classified as a sensitive file at the same level as ~/.aws/credentials, but warrants attention. Signal: +10 (partial credit).',
            'Network destination 10.0.1.50:8080 is an RFC 1918 (internal) IP address — not an external exfiltration target. Internal traffic is expected in deploy pipelines. Signal: 0 (internal IPs do not trigger external-destination penalty).',
            'Command matches a structured deploy script pattern (/opt/deploy/scripts/release.sh --env production) run by a dedicated deploy-bot user — this is consistent with CI/CD automation. Signal: -10 (service-like working directory) -5 (partial known-good pattern credit).',
          ],
          mitreTechniques: ['T1552.001'],
          blockIp: '',
          remediation: '## Recommendation\n\nEscalate to a senior analyst for review. Verify that:\n1. `deploy-bot` is an authorized CI/CD service account.\n2. `/opt/deploy/.env.production` does not contain secrets that should be in a secrets manager.\n3. 10.0.1.50:8080 is the expected internal deployment target.\n\n```bash\n# Check deploy-bot\'s recent activity\nlast deploy-bot\nauditctl -l | grep deploy-bot\n```',
        },
        socContainment: {
          recommendedKillPid: 7823,
          containmentAction: 'Monitor and escalate — do not kill without analyst confirmation',
          escalationPriority: 'P2',
        },
        developerPostmortem: {
          title: 'SUSPICIOUS: Deploy script reading .env.production (PID 7823) — review required',
          description: '## Summary\n\nA deploy script run by `deploy-bot` accessed `.env.production` during a production release. The network traffic was internal only. Score: 45/100 (SUSPICIOUS).\n\n## Why This Was Flagged\n\nProduction environment files may contain secrets. If this access is expected, add it to the allowlist.',
          actionItems: [
            'Verify deploy-bot account credentials are rotated and scoped to minimum required permissions.',
            'Move secrets from .env.production to a secrets manager (AWS Secrets Manager, HashiCorp Vault).',
            'Add this deploy pattern to the ZeroTrace allowlist once verified.',
          ],
          severity: 'high',
        },
      };

    case 'borderline-bash':
      return {
        analysis: {
          threatScore: 35,
          verdict: 'SAFE',
          isAnomaly: false,
          reasoningTrail: [
            'Parent process is sshd — this is a standard pattern for an SSH login session spawning an interactive shell. SSH_TTY and SSH_CLIENT env vars confirm this is a legitimate interactive session. Signal: -15 (SSH/terminal indicators).',
            'Command is /bin/bash with no arguments — interactive shell, not a scripted attack. Files touched are .bashrc and .bash_history, both expected during shell initialization. Signal: -10 (no sensitive file access).',
            'No network destinations observed — the process has not initiated any outbound connections beyond the SSH session itself. Signal: -10 (no network).',
          ],
          mitreTechniques: [],
          blockIp: '',
          remediation: 'No action required. This appears to be a legitimate SSH session for user alice. If alice\'s SSH access is unexpected, verify her account status and SSH key authorization.',
        },
        socContainment: {
          recommendedKillPid: 5512,
          containmentAction: 'No containment required — interactive shell is within expected parameters',
          escalationPriority: 'P3',
        },
        developerPostmortem: {
          title: 'INFO: Interactive bash session via SSH detected for alice (PID 5512)',
          description: '## Summary\n\nUser alice initiated an interactive SSH session resulting in a bash shell (PID 5512). No anomalous file access or network activity was detected. Score: 35/100 (SAFE).\n\nThis is expected behavior for a developer with SSH access.',
          actionItems: [],
          severity: 'low',
        },
      };

    default:
      // Default fallback is zero-day
      return getFallback('zero-day');
  }
}
