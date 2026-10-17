import fs from 'fs';
import path from 'path';
import type { ProcessInfo, ZeroTraceModelResponse } from '../../packages/shared/types';
import { config } from './config';
import { getFallback } from './fallback';
import { validateModelResponse } from './validator';

function scenarioNameFor(process: ProcessInfo): string {
  switch (process.pid) {
    case 31337:
      return 'zero-day';
    case 1234:
      return 'benign';
    case 7823:
      return 'borderline-deploy';
    case 5512:
      return 'borderline-bash';
    default:
      return 'zero-day';
  }
}

function buildUserMessage(process: ProcessInfo): string {
  return `Analyze the following process execution for security threats. Return JSON only.

<PROCESS_METADATA>
${JSON.stringify(process, null, 2)}
</PROCESS_METADATA>`;
}

function resolveAgentFile(relPath: string): string {
  const candidates = [
    path.resolve(__dirname, '../../agent', relPath),
    path.resolve(process.cwd(), 'agent', relPath),
    path.resolve(process.cwd(), '../agent', relPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

export async function analyzeProcess(
  process: ProcessInfo
): Promise<{ result: ZeroTraceModelResponse; isFallback: boolean }> {
  const scenario = scenarioNameFor(process);

  // 1. If config.llmMode === 'demo', return fallback directly
  if (config.llmMode === 'demo') {
    return { result: getFallback(scenario), isFallback: true };
  }

  // 2. Read system prompt and schema
  let systemPrompt = '';
  let schemaObj: any = {};
  try {
    const promptPath = resolveAgentFile('prompts/system.md');
    systemPrompt = fs.readFileSync(promptPath, 'utf-8');
    const schemaPath = resolveAgentFile('schemas/zerotrace-incident.schema.json');
    schemaObj = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  } catch (err) {
    console.warn(`[analyst] Failed to read prompt or schema: ${(err as Error).message}`);
    if (config.llmMode === 'ollama') {
      throw new Error('Ollama required but prompt/schema files could not be read');
    }
    return { result: getFallback(scenario), isFallback: true };
  }

  // 4. Build Ollama request body
  const requestBody = {
    model: config.ollamaModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildUserMessage(process) },
    ],
    stream: false,
    format: schemaObj,
    options: {
      temperature: 0.1,
      num_ctx: 8192,
    },
    keep_alive: config.ollamaKeepAlive,
  };

  // 5. Call Ollama
  let responseData: any;
  try {
    const res = await fetch(`${config.ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config.ollamaTimeoutMs),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    responseData = await res.json();
  } catch (err) {
    console.warn(`[analyst] Ollama unreachable: ${(err as Error).message}`);
    if (config.llmMode === 'ollama') {
      throw new Error('Ollama required but unreachable');
    }
    return { result: getFallback(scenario), isFallback: true };
  }

  // 7-10. Parse and validate content
  let result: ZeroTraceModelResponse;
  try {
    const contentText = responseData?.message?.content;
    if (!contentText) {
      throw new Error('Missing message content in Ollama response');
    }
    const parsed = JSON.parse(contentText);
    result = validateModelResponse(parsed);
  } catch (err) {
    console.warn(`[analyst] Invalid model output: ${(err as Error).message}`);
    if (config.llmMode === 'ollama') {
      throw err;
    }
    return { result: getFallback(scenario), isFallback: true };
  }

  // 11. Override trust boundary: process.pid must be recommendedKillPid
  result.socContainment.recommendedKillPid = process.pid;

  return { result, isFallback: false };
}
