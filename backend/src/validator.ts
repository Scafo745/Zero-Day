import type { ZeroTraceModelResponse } from '../../packages/shared/types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateModelResponse(raw: unknown): ZeroTraceModelResponse {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationError('Response must be a non-null object');
  }

  const obj = raw as Record<string, any>;

  if (!obj.analysis || typeof obj.analysis !== 'object') {
    throw new ValidationError('Missing or invalid "analysis" property');
  }
  if (!obj.socContainment || typeof obj.socContainment !== 'object') {
    throw new ValidationError('Missing or invalid "socContainment" property');
  }
  if (!obj.developerPostmortem || typeof obj.developerPostmortem !== 'object') {
    throw new ValidationError('Missing or invalid "developerPostmortem" property');
  }

  const { analysis, socContainment, developerPostmortem } = obj;

  // 3. analysis.threatScore is an integer in [0, 100]
  if (
    typeof analysis.threatScore !== 'number' ||
    !Number.isInteger(analysis.threatScore) ||
    analysis.threatScore < 0 ||
    analysis.threatScore > 100
  ) {
    throw new ValidationError(`analysis.threatScore must be an integer between 0 and 100, got: ${analysis.threatScore}`);
  }

  // 4. analysis.verdict is one of "SAFE" | "SUSPICIOUS" | "CRITICAL"
  if (!['SAFE', 'SUSPICIOUS', 'CRITICAL'].includes(analysis.verdict)) {
    throw new ValidationError(`analysis.verdict must be SAFE, SUSPICIOUS, or CRITICAL, got: ${analysis.verdict}`);
  }

  // 5. analysis.isAnomaly is boolean
  if (typeof analysis.isAnomaly !== 'boolean') {
    throw new ValidationError('analysis.isAnomaly must be a boolean');
  }

  // 6. analysis.reasoningTrail is a non-empty array of strings with >= 3 items
  if (
    !Array.isArray(analysis.reasoningTrail) ||
    analysis.reasoningTrail.length < 3 ||
    !analysis.reasoningTrail.every((item: unknown) => typeof item === 'string' && item.trim().length > 0)
  ) {
    throw new ValidationError('analysis.reasoningTrail must be an array of at least 3 non-empty strings');
  }

  // 7. analysis.mitreTechniques is an array of strings
  if (
    !Array.isArray(analysis.mitreTechniques) ||
    !analysis.mitreTechniques.every((item: unknown) => typeof item === 'string')
  ) {
    throw new ValidationError('analysis.mitreTechniques must be an array of strings');
  }

  // 8. analysis.blockIp is a string (IPv4 pattern or empty string)
  if (typeof analysis.blockIp !== 'string') {
    throw new ValidationError('analysis.blockIp must be a string');
  }
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (analysis.blockIp !== '' && !ipv4Regex.test(analysis.blockIp)) {
    throw new ValidationError(`analysis.blockIp must be an IPv4 address or empty string, got: ${analysis.blockIp}`);
  }

  // 9. socContainment.recommendedKillPid is a positive integer
  if (
    typeof socContainment.recommendedKillPid !== 'number' ||
    !Number.isInteger(socContainment.recommendedKillPid) ||
    socContainment.recommendedKillPid <= 0
  ) {
    throw new ValidationError('socContainment.recommendedKillPid must be a positive integer');
  }

  // 10. socContainment.escalationPriority is "P1" | "P2" | "P3"
  if (!['P1', 'P2', 'P3'].includes(socContainment.escalationPriority)) {
    throw new ValidationError(`socContainment.escalationPriority must be P1, P2, or P3, got: ${socContainment.escalationPriority}`);
  }

  // 11. developerPostmortem.title is a string <= 80 chars
  if (
    typeof developerPostmortem.title !== 'string' ||
    developerPostmortem.title.length === 0 ||
    developerPostmortem.title.length > 80
  ) {
    throw new ValidationError('developerPostmortem.title must be a non-empty string <= 80 characters');
  }

  // 12. developerPostmortem.severity is "critical" | "high" | "low"
  if (!['critical', 'high', 'low'].includes(developerPostmortem.severity)) {
    throw new ValidationError(`developerPostmortem.severity must be critical, high, or low, got: ${developerPostmortem.severity}`);
  }

  // 13. developerPostmortem.actionItems is an array of strings
  if (
    !Array.isArray(developerPostmortem.actionItems) ||
    !developerPostmortem.actionItems.every((item: unknown) => typeof item === 'string')
  ) {
    throw new ValidationError('developerPostmortem.actionItems must be an array of strings');
  }

  return raw as ZeroTraceModelResponse;
}
