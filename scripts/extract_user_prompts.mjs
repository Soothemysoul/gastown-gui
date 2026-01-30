#!/usr/bin/env node
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const DEFAULT_OUTPUT_RELATIVE_DIR = path.join('refactoring-analysis', 'trace');

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function readFirstLine(filePath) {
  const handle = await fs.open(filePath, 'r');
  try {
    const { size } = await handle.stat();
    const bytesToRead = Math.min(size, 1024 * 256);
    const buffer = Buffer.alloc(bytesToRead);
    const { bytesRead } = await handle.read(buffer, 0, bytesToRead, 0);
    const text = buffer.subarray(0, bytesRead).toString('utf8');
    const newlineIndex = text.indexOf('\n');
    return (newlineIndex === -1 ? text : text.slice(0, newlineIndex)).trim();
  } finally {
    await handle.close();
  }
}

async function* walkFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }
    if (entry.isFile()) yield fullPath;
  }
}

async function parseJsonl(filePath, onObject) {
  const stream = fsSync.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const obj = JSON.parse(trimmed);
      onObject(obj);
    } catch {
      // Skip malformed lines (rare, but don't fail the whole export)
    }
  }
}

function createRedactor() {
  const homeDir = os.homedir();
  const redactions = new Map();

  const rules = [
    { name: 'HOME_DIR', regex: new RegExp(escapeRegExp(homeDir), 'g') },
    { name: 'OPENAI_SK', regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
    { name: 'GITHUB_GHP', regex: /\bghp_[A-Za-z0-9]{20,}\b/g },
    { name: 'GITHUB_PAT', regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
    { name: 'JWT', regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
    { name: 'BEARER', regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{10,}\b/g },
    { name: 'AWS_ACCESS_KEY', regex: /\bAKIA[0-9A-Z]{16}\b/g },
    { name: 'PRIVATE_KEY_BLOCK', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
    { name: 'BASIC_AUTH_URL', regex: /\bhttps?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+\b/g },
    { name: 'EMAIL', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  ];

  function bump(ruleName, count = 1) {
    redactions.set(ruleName, (redactions.get(ruleName) || 0) + count);
  }

  function redact(text) {
    let output = String(text ?? '');

    for (const rule of rules) {
      output = output.replace(rule.regex, (match) => {
        bump(rule.name, 1);
        if (rule.name === 'HOME_DIR') return '<HOME>';
        if (rule.name === 'PRIVATE_KEY_BLOCK') return '[REDACTED:PRIVATE_KEY_BLOCK]';
        if (rule.name === 'BEARER') return 'Bearer [REDACTED:BEARER]';
        return `[REDACTED:${rule.name}]`;
      });
    }

    return output;
  }

  function summary() {
    return Object.fromEntries([...redactions.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }

  return { redact, summary };
}

function extractTextFromCodexMessageContent(content) {
  if (!Array.isArray(content)) return null;
  const parts = content
    .filter((item) => item && item.type === 'input_text' && typeof item.text === 'string')
    .map((item) => item.text);
  const text = parts.join('');
  return text.trim().length > 0 ? text : null;
}

function extractTextFromClaudeMessageContent(content) {
  if (typeof content === 'string') {
    const text = content.trim();
    if (!text) return null;
    if (text.startsWith('<local-command-')) return null;
    return text;
  }

  if (!Array.isArray(content)) return null;

  // Ignore tool results (not user-typed prompts)
  if (content.some((item) => item && item.type === 'tool_result')) return null;

  const parts = [];
  for (const item of content) {
    if (!item) continue;
    if (item.type === 'text' && typeof item.text === 'string') parts.push(item.text);
    if (item.type === 'input_text' && typeof item.text === 'string') parts.push(item.text);
  }

  const text = parts.join('').trim();
  return text.length > 0 ? text : null;
}

async function selectCodexSessionFiles({ sessionsRoot, targetCwd }) {
  const selected = [];

  try {
    for await (const filePath of walkFiles(sessionsRoot)) {
      if (!filePath.endsWith('.jsonl')) continue;

      let firstLine;
      try {
        firstLine = await readFirstLine(filePath);
      } catch {
        continue;
      }

      if (!firstLine) continue;

      try {
        const meta = JSON.parse(firstLine);
        const cwd = meta?.payload?.cwd ?? null;
        if (meta?.type === 'session_meta' && cwd === targetCwd) {
          selected.push(filePath);
        }
      } catch {
        continue;
      }
    }
  } catch {
    // ignore
  }

  selected.sort();
  return selected;
}

async function main() {
  const targetCwd = process.env.TARGET_CWD || process.cwd();
  const outputDir = path.resolve(process.env.OUTPUT_DIR || DEFAULT_OUTPUT_RELATIVE_DIR);

  await fs.mkdir(outputDir, { recursive: true });

  const redactor = createRedactor();
  const entries = [];

  // --- Codex ---
  const codexSessionsRoot = path.join(os.homedir(), '.codex', 'sessions');
  const codexFiles = await selectCodexSessionFiles({ sessionsRoot: codexSessionsRoot, targetCwd });

  for (const filePath of codexFiles) {
    let sessionId = null;

    try {
      const firstLine = await readFirstLine(filePath);
      const meta = JSON.parse(firstLine);
      sessionId = meta?.payload?.id ?? null;
    } catch {
      sessionId = null;
    }

    await parseJsonl(filePath, (obj) => {
      if (obj?.type !== 'response_item') return;
      const payload = obj.payload;
      if (payload?.type !== 'message') return;
      if (payload?.role !== 'user') return;

      const text = extractTextFromCodexMessageContent(payload.content);
      if (!text) return;

      entries.push({
        source: 'codex',
        timestamp: obj.timestamp ?? null,
        sessionId,
        file: path.basename(filePath),
        text: redactor.redact(text),
      });
    });
  }

  // --- Claude Code ---
  const claudeProjectsRoot = path.join(os.homedir(), '.claude', 'projects');
  const claudeProjectDirName = targetCwd.replaceAll('/', '-');
  const claudeProjectDir = path.join(claudeProjectsRoot, claudeProjectDirName);

  try {
    await fs.access(claudeProjectDir);
    for await (const filePath of walkFiles(claudeProjectDir)) {
      if (!filePath.endsWith('.jsonl')) continue;

      await parseJsonl(filePath, (obj) => {
        if (obj?.type !== 'user') return;
        if (obj?.isMeta) return;

        const message = obj.message;
        if (message?.role !== 'user') return;

        const text = extractTextFromClaudeMessageContent(message.content);
        if (!text) return;

        entries.push({
          source: 'claude',
          timestamp: obj.timestamp ?? null,
          sessionId: obj.sessionId ?? null,
          file: path.basename(filePath),
          text: redactor.redact(text),
        });
      });
    }
  } catch {
    // Claude project dir missing; skip
  }

  // Sort by timestamp (unknown timestamps go last)
  entries.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  const outputJsonl = path.join(outputDir, 'user-prompts.sanitized.jsonl');
  const outputSummary = path.join(outputDir, 'user-prompts.summary.json');

  const jsonlLines = entries.map((entry) => JSON.stringify(entry));
  await fs.writeFile(outputJsonl, `${jsonlLines.join('\n')}\n`, 'utf8');

  const summary = {
    targetCwd,
    generatedAt: new Date().toISOString(),
    entries: entries.length,
    sources: entries.reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + 1;
      return acc;
    }, {}),
    redactions: redactor.summary(),
    codexFiles: codexFiles.map((f) => path.basename(f)),
    claudeProjectDir: fsSync.existsSync(claudeProjectDir) ? claudeProjectDir : null,
  };

  await fs.writeFile(outputSummary, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  // Small README to explain provenance and safety.
  const readmePath = path.join(outputDir, 'README.md');
  const readme = `# Trace Export (Sanitized)\n\nThis folder contains a **sanitized** export of *user-provided prompts only* (no model outputs), collected from local Codex/Claude Code trace logs.\n\n- Output: \`user-prompts.sanitized.jsonl\`\n- Summary: \`user-prompts.summary.json\`\n\n## Raw trace locations (DO NOT COMMIT RAW)\n\n- Codex: \`~/.codex/sessions/**/rollout-*.jsonl\`\n- Claude Code: \`~/.claude/projects/${claudeProjectDirName}/**/*.jsonl\`\n\nRaw traces may include sensitive data (tokens, file contents, command output). This export applies basic redaction (\`<HOME>\`, common token patterns, private key blocks, emails).\n\n## Safety checks before pushing\n\nRun a quick grep on the sanitized export (and review manually):\n\n\`\`\`bash\nrg -n \"sk-|ghp_|github_pat_|BEGIN [A-Z ]*PRIVATE KEY|AKIA|Bearer \" ${path.relative(process.cwd(), outputJsonl)} || true\n\`\`\`\n\nIf anything triggers, do **not** push; widen redaction rules and re-run the export.\n`;
  await fs.writeFile(readmePath, readme, 'utf8');

  // Also write a short markdown report for reviewers.
  const reportPath = path.join(outputDir, 'REPORT.md');
  const report = `# Prompt Log (Sanitized)\n\n- Target CWD: \`${summary.targetCwd}\`\n- Generated: \`${summary.generatedAt}\`\n- Entries: \`${summary.entries}\` (Codex: \`${summary.sources.codex || 0}\`, Claude: \`${summary.sources.claude || 0}\`)\n\n## Redactions Applied\n\n\`\`\`json\n${JSON.stringify(summary.redactions, null, 2)}\n\`\`\`\n\n## Files Used\n\n- Codex sessions:\n${summary.codexFiles.map((f) => `  - \`${f}\``).join('\n') || '  - (none found)'}\n- Claude project dir: ${summary.claudeProjectDir ? `\`${summary.claudeProjectDir}\`` : '(not found)'}\n\n## How to Read\n\nThe log file \`user-prompts.sanitized.jsonl\` is a JSONL stream; each line contains:\n\n- \`source\`: \`codex\` | \`claude\`\n- \`timestamp\`: ISO timestamp (if available)\n- \`sessionId\`: tool session identifier (if available)\n- \`file\`: source trace file basename\n- \`text\`: the user prompt (sanitized)\n`;
  await fs.writeFile(reportPath, report, 'utf8');

  process.stdout.write(`Wrote ${entries.length} prompts to ${outputJsonl}\n`);
}

await main();

