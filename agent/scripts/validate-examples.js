#!/usr/bin/env node
/**
 * agent/scripts/validate-examples.js
 * Throwaway validation script.
 * Verifies:
 *   1. All JSON files in agent/examples/ parse without error.
 *   2. All *.expected.json files validate against zerotrace-incident.schema.json.
 * Exits 0 on success, 1 on failure.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCHEMA_PATH = path.join(REPO_ROOT, 'agent', 'schemas', 'zerotrace-incident.schema.json');
const EXAMPLES_DIR = path.join(REPO_ROOT, 'agent', 'examples');

let passed = 0;
let failed = 0;

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  failed++;
}

function pass(msg) {
  console.log(`  PASS: ${msg}`);
  passed++;
}

// ---------------------------------------------------------------------------
// Step 1: Parse schema
// ---------------------------------------------------------------------------
console.log('\n[1] Loading schema...');
let schema;
try {
  const raw = fs.readFileSync(SCHEMA_PATH, 'utf8');
  schema = JSON.parse(raw);
  pass(`Schema parsed: ${SCHEMA_PATH}`);
} catch (e) {
  fail(`Schema parse error: ${e.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 2: Validate all JSON files in examples/ parse
// ---------------------------------------------------------------------------
console.log('\n[2] Parsing all example JSON files...');
const files = fs.readdirSync(EXAMPLES_DIR).filter(f => f.endsWith('.json'));

const parsedFiles = {};
for (const file of files) {
  const fullPath = path.join(EXAMPLES_DIR, file);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    parsedFiles[file] = JSON.parse(content);
    pass(`Parses OK: ${file}`);
  } catch (e) {
    fail(`Parse error in ${file}: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Step 3: Validate *.expected.json against schema (structural check)
// ---------------------------------------------------------------------------
console.log('\n[3] Validating *.expected.json against schema structure...');

function validateRequired(obj, schema, path) {
  const errors = [];
  if (schema.type === 'object') {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      errors.push(`${path}: expected object, got ${typeof obj}`);
      return errors;
    }
    const required = schema.required || [];
    for (const key of required) {
      if (!(key in obj)) {
        errors.push(`${path}: missing required field '${key}'`);
      } else if (schema.properties && schema.properties[key]) {
        errors.push(...validateRequired(obj[key], schema.properties[key], `${path}.${key}`));
      }
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(obj)) {
      errors.push(`${path}: expected array, got ${typeof obj}`);
    }
  } else if (schema.type === 'integer' || schema.type === 'number') {
    if (typeof obj !== 'number') {
      errors.push(`${path}: expected number, got ${typeof obj}`);
    }
    if (schema.minimum !== undefined && obj < schema.minimum) {
      errors.push(`${path}: value ${obj} < minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && obj > schema.maximum) {
      errors.push(`${path}: value ${obj} > maximum ${schema.maximum}`);
    }
  } else if (schema.type === 'string') {
    if (typeof obj !== 'string') {
      errors.push(`${path}: expected string, got ${typeof obj}`);
    }
    if (schema.enum && !schema.enum.includes(obj)) {
      errors.push(`${path}: value '${obj}' not in enum [${schema.enum.join(', ')}]`);
    }
  } else if (schema.type === 'boolean') {
    if (typeof obj !== 'boolean') {
      errors.push(`${path}: expected boolean, got ${typeof obj}`);
    }
  }
  return errors;
}

const expectedFiles = files.filter(f => f.endsWith('.expected.json'));
for (const file of expectedFiles) {
  const obj = parsedFiles[file];
  if (!obj) continue;
  const errors = validateRequired(obj, schema, 'root');
  if (errors.length === 0) {
    // Additional business-rule checks
    const { analysis, socContainment, developerPostmortem } = obj;
    const extraErrors = [];

    // Score band consistency
    const score = analysis.threatScore;
    const verdict = analysis.verdict;
    if (score >= 75 && verdict !== 'CRITICAL') extraErrors.push(`score ${score} ≥ 75 but verdict is ${verdict}`);
    if (score >= 40 && score < 75 && verdict !== 'SUSPICIOUS') extraErrors.push(`score ${score} should be SUSPICIOUS`);
    if (score < 40 && verdict !== 'SAFE') extraErrors.push(`score ${score} < 40 but verdict is ${verdict}`);

    // reasoningTrail length
    if (analysis.reasoningTrail.length < 3) extraErrors.push(`reasoningTrail has ${analysis.reasoningTrail.length} steps (need ≥ 3)`);

    // blockIp: non-empty only for external IPs
    if (analysis.blockIp && !analysis.blockIp.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      extraErrors.push(`blockIp '${analysis.blockIp}' is not a valid IPv4`);
    }

    // recommendedKillPid: check it's a positive integer
    if (!Number.isInteger(socContainment.recommendedKillPid) || socContainment.recommendedKillPid <= 0) {
      extraErrors.push(`recommendedKillPid must be a positive integer`);
    }

    // title length
    if (developerPostmortem.title.length > 80) {
      extraErrors.push(`title length ${developerPostmortem.title.length} exceeds 80 chars`);
    }

    if (extraErrors.length === 0) {
      pass(`${file} — schema + business rules OK (score: ${score}, verdict: ${verdict})`);
    } else {
      for (const e of extraErrors) fail(`${file}: ${e}`);
    }
  } else {
    for (const e of errors) fail(`${file}: ${e}`);
  }
}

// ---------------------------------------------------------------------------
// Step 4: Validate eval/cases.json parses
// ---------------------------------------------------------------------------
console.log('\n[4] Validating eval/cases.json...');
const casesPath = path.join(REPO_ROOT, 'agent', 'eval', 'cases.json');
try {
  const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  if (!Array.isArray(cases)) throw new Error('cases.json must be an array');
  if (cases.length < 8) fail(`cases.json has only ${cases.length} cases (need ≥ 8)`);
  else pass(`cases.json: ${cases.length} cases found`);

  // Check each case has required fields
  const requiredCaseFields = ['id', 'name', 'expectedIsAnomaly', 'expectedVerdict', 'scoreMin', 'scoreMax'];
  for (const c of cases) {
    for (const field of requiredCaseFields) {
      if (!(field in c)) fail(`Case ${c.id || '?'}: missing field '${field}'`);
    }
  }
} catch (e) {
  fail(`cases.json error: ${e.message}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n=== Validation Summary: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
