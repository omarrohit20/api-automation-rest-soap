/**
 * Generate k6 performance script from API details
 */

import type { ApiDetails } from '../types.js';

interface K6Options {
  vus?: number;
  duration?: string;
  iterations?: number;
  thresholds?: string[];
  sleepDuration?: number;
}

export function generateK6Script(apiDetails: ApiDetails, options: K6Options = {}): string {
  const {
    vus = 10,
    duration = '30s',
    iterations,
    thresholds = ['p(95)<800'],
    sleepDuration = 1
  } = options;

  const url = buildUrl(apiDetails);
  const headers = buildHeaders(apiDetails.headers, apiDetails.requestBody);
  const payload = buildPayload(apiDetails.requestBody);

  const lines: string[] = [];
  lines.push("import http from 'k6/http';");
  lines.push("import { check, sleep } from 'k6';");
  lines.push('');

  const optionsLines = [
    'export const options = {',
    `  vus: ${vus},`,
    `  duration: '${duration}',`
  ];

  if (iterations !== undefined) {
    optionsLines.push(`  iterations: ${iterations},`);
  }

  if (thresholds.length > 0) {
    const formattedThresholds = thresholds.map(t => `    '${t}'`).join(',\n');
    optionsLines.push('  thresholds: {');
    optionsLines.push('    http_req_duration: [');
    optionsLines.push(formattedThresholds);
    optionsLines.push('    ]');
    optionsLines.push('  }');
  }

  optionsLines.push('};');
  lines.push(...optionsLines);
  lines.push('');

  lines.push('export default function () {');
  lines.push(`  const url = '${url}';`);
  lines.push(`  const headers = ${JSON.stringify(headers, null, 2)};`);

  if (payload !== undefined) {
    lines.push(`  const payload = ${payload};`);
  }

  lines.push('  const params = { headers };');

  if (payload !== undefined) {
    lines.push(`  const res = http.request('${apiDetails.method}', url, payload, params);`);
  } else {
    lines.push(`  const res = http.request('${apiDetails.method}', url, params);`);
  }

  lines.push('');
  lines.push('  check(res, {');
  lines.push("    'status is 2xx': (r) => r.status >= 200 && r.status < 300,");
  lines.push("    'response time < 800ms': (r) => r.timings.duration < 800");
  lines.push('  });');
  lines.push(`  sleep(${sleepDuration});`);
  lines.push('}');

  return lines.join('\n');
}

function buildUrl(apiDetails: ApiDetails): string {
  const base = apiDetails.fullUrl || apiDetails.endpoint;
  const url = base.startsWith('http') ? new URL(base) : new URL(base, 'http://localhost');

  if (apiDetails.queryParams) {
    Object.entries(apiDetails.queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

function buildHeaders(headers: Record<string, string>, body?: any): Record<string, string> {
  const computed = { ...headers };

  if (body && typeof body === 'object') {
    if (!computed['Content-Type'] && !computed['content-type']) {
      computed['Content-Type'] = 'application/json';
    }
  }

  return computed;
}

function buildPayload(body: any): string | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === 'object') {
    return `JSON.stringify(${JSON.stringify(body, null, 2)})`;
  }

  return JSON.stringify(body);
}
