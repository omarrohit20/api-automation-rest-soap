#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { parseCurl } from './utils/curlParser.js';
import { generateRSpecTests } from './utils/testGenerator.js';
import { readSpecFile, writeSpecFile, analyzeFramework } from './utils/fileManager.js';
// Create MCP server instance
const server = new Server({
    name: 'rspec-test-generator',
    version: '1.0.0'
}, {
    capabilities: {
        tools: {}
    }
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'parse_curl',
                description: 'Parse a curl request and extract API details (URL, method, headers, body)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        curlCommand: {
                            type: 'string',
                            description: 'The curl command to parse'
                        }
                    },
                    required: ['curlCommand']
                }
            },
            {
                name: 'generate_tests',
                description: 'Generate RSpec functional and component test cases from API details',
                inputSchema: {
                    type: 'object',
                    properties: {
                        curlCommand: {
                            type: 'string',
                            description: 'The curl command to generate tests for'
                        },
                        testType: {
                            type: 'string',
                            enum: ['functional', 'component', 'both'],
                            description: 'Type of tests to generate (default: both)'
                        },
                        description: {
                            type: 'string',
                            description: 'Description for the test suite'
                        }
                    },
                    required: ['curlCommand']
                }
            },
            {
                name: 'manage_spec_file',
                description: 'Create new or edit existing RSpec spec file with generated tests',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filePath: {
                            type: 'string',
                            description: 'Path to the spec file (e.g., spec/api/users_spec.rb)'
                        },
                        content: {
                            type: 'string',
                            description: 'The RSpec test content to write'
                        },
                        mode: {
                            type: 'string',
                            enum: ['create', 'update', 'append'],
                            description: 'Operation mode: create new, update existing, or append to existing'
                        }
                    },
                    required: ['filePath', 'content', 'mode']
                }
            },
            {
                name: 'analyze_framework',
                description: 'Analyze the Ruby/RSpec framework structure to understand test patterns and helpers',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'generate_complete_tests',
                description: 'Complete workflow: parse curl, generate tests, and create/update spec file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        curlCommand: {
                            type: 'string',
                            description: 'The curl command to generate tests for'
                        },
                        specFilePath: {
                            type: 'string',
                            description: 'Path where to save the spec file'
                        },
                        testType: {
                            type: 'string',
                            enum: ['functional', 'component', 'both'],
                            description: 'Type of tests to generate'
                        },
                        description: {
                            type: 'string',
                            description: 'Description for the test suite'
                        },
                        mode: {
                            type: 'string',
                            enum: ['create', 'update', 'append'],
                            description: 'File operation mode (default: create)'
                        }
                    },
                    required: ['curlCommand', 'specFilePath']
                }
            }
        ]
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        return {
            content: [{
                    type: 'text',
                    text: 'No arguments provided'
                }],
            isError: true
        };
    }
    try {
        switch (name) {
            case 'parse_curl': {
                const apiDetails = parseCurl(args.curlCommand);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(apiDetails, null, 2)
                        }]
                };
            }
            case 'generate_tests': {
                const curlCommand = args.curlCommand;
                const testType = args.testType || 'both';
                const description = args.description;
                const apiDetails = parseCurl(curlCommand);
                const frameworkContext = await analyzeFramework();
                const tests = generateRSpecTests(apiDetails, {
                    testType,
                    description,
                    frameworkContext
                });
                return {
                    content: [{
                            type: 'text',
                            text: tests
                        }]
                };
            }
            case 'manage_spec_file': {
                const filePath = args.filePath;
                const content = args.content;
                const mode = args.mode;
                let result;
                if (mode === 'create') {
                    await writeSpecFile(filePath, content, false);
                    result = `Created new spec file: ${filePath}`;
                }
                else if (mode === 'update') {
                    await writeSpecFile(filePath, content, true);
                    result = `Updated spec file: ${filePath}`;
                }
                else { // append
                    const existing = await readSpecFile(filePath);
                    const combined = existing.content + '\n\n' + content;
                    await writeSpecFile(filePath, combined, true);
                    result = `Appended to spec file: ${filePath}`;
                }
                return {
                    content: [{
                            type: 'text',
                            text: result
                        }]
                };
            }
            case 'analyze_framework': {
                const analysis = await analyzeFramework();
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(analysis, null, 2)
                        }]
                };
            }
            case 'generate_complete_tests': {
                const curlCommand = args.curlCommand;
                const specFilePath = args.specFilePath;
                const testType = args.testType || 'both';
                const description = args.description;
                const mode = args.mode || 'create';
                // Parse curl
                const apiDetails = parseCurl(curlCommand);
                // Analyze framework
                const frameworkContext = await analyzeFramework();
                // Generate tests
                const tests = generateRSpecTests(apiDetails, {
                    testType,
                    description,
                    frameworkContext
                });
                // Write to file
                if (mode === 'append') {
                    const existing = await readSpecFile(specFilePath);
                    const combined = existing.content + '\n\n' + tests;
                    await writeSpecFile(specFilePath, combined, true);
                }
                else {
                    await writeSpecFile(specFilePath, tests, mode === 'update');
                }
                return {
                    content: [{
                            type: 'text',
                            text: `Successfully generated tests and ${mode === 'create' ? 'created' : mode === 'update' ? 'updated' : 'appended to'} spec file: ${specFilePath}\n\nAPI Details:\n${JSON.stringify(apiDetails, null, 2)}`
                        }]
                };
            }
            default:
                return {
                    content: [{
                            type: 'text',
                            text: `Unknown tool: ${name}`
                        }],
                    isError: true
                };
        }
    }
    catch (error) {
        return {
            content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`
                }],
            isError: true
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('RSpec Test Generator MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
