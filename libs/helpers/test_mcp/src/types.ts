/**
 * Type definitions for the RSpec test generator MCP server
 */

export interface CurlRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  queryParams?: Record<string, string>;
}

export interface ApiDetails {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  requestBody?: any;
  queryParams?: Record<string, string>;
  fullUrl?: string;
}

export interface TestCase {
  description: string;
  testType: 'functional' | 'component';
  expectedStatus?: number;
  expectedResponse?: any;
  setup?: string;
  assertions: string[];
}

export interface RSpecFile {
  filePath: string;
  content: string;
  exists: boolean;
}
