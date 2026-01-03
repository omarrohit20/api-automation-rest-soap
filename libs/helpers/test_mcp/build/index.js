#!/usr/bin/env node
import * as path from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { parseCurl } from './utils/curlParser.js';
import { generateRSpecTests, generateNonFunctionalTestsFile, generateFunctionalTestsFile } from './utils/testGenerator.js';
import { readSpecFile, writeSpecFile, analyzeFramework, getNonFunctionalSpecPath } from './utils/fileManager.js';
import { generateK6Script } from './utils/k6Generator.js';
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
                            enum: ['functional', 'component', 'non-functional', 'both', 'all'],
                            description: 'Type of tests to generate (default: both). Use "all" for functional + component + non-functional'
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
                name: 'generate_k6_script',
                description: 'Generate a k6 performance test script from a curl command',
                inputSchema: {
                    type: 'object',
                    properties: {
                        curlCommand: {
                            type: 'string',
                            description: 'The curl command to convert'
                        },
                        vus: {
                            type: 'number',
                            description: 'Number of virtual users (default: 10)'
                        },
                        duration: {
                            type: 'string',
                            description: 'Test duration (default: 30s)'
                        },
                        iterations: {
                            type: 'number',
                            description: 'Fixed number of iterations (optional)'
                        },
                        thresholds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Thresholds for http_req_duration (optional)'
                        },
                        sleepDuration: {
                            type: 'number',
                            description: 'Sleep between iterations in seconds (default: 1)'
                        },
                        scriptFileName: {
                            type: 'string',
                            description: 'Name of the k6 script file to create in perfk6 folder (default: k6_script.js)'
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
                            enum: ['functional', 'component', 'non-functional', 'both', 'all'],
                            description: 'Type of tests to generate. Use "all" for functional + component + non-functional'
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
            },
            {
                name: 'generate_non_functional_tests_file',
                description: 'Generate only non-functional tests and save to a separate file (e.g., users_non_functional_spec.rb)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        curlCommand: {
                            type: 'string',
                            description: 'The curl command to generate non-functional tests for'
                        },
                        specFilePath: {
                            type: 'string',
                            description: 'Base spec file path (will create non_functional variant)'
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
            },
            {
                name: 'generate_functional_and_non_functional_split',
                description: 'Generate functional+component tests and non-functional tests in separate files',
                inputSchema: {
                    type: 'object',
                    properties: {
                        curlCommand: {
                            type: 'string',
                            description: 'The curl command to generate tests for'
                        },
                        specFilePath: {
                            type: 'string',
                            description: 'Path for main spec file (functional+component tests)'
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
            case 'generate_k6_script': {
                const curlCommand = args.curlCommand;
                const scriptFileName = args.scriptFileName || 'k6_script.js';
                const apiDetails = parseCurl(curlCommand);
                const script = generateK6Script(apiDetails, {
                    vus: args.vus,
                    duration: args.duration,
                    iterations: args.iterations,
                    thresholds: args.thresholds,
                    sleepDuration: args.sleepDuration
                });
                // Save to perfk6 folder
                const perfk6Dir = path.resolve('../../../perfk6');
                const filePath = path.join(perfk6Dir, scriptFileName);
                try {
                    await writeSpecFile(filePath, script, true);
                    return {
                        content: [{
                                type: 'text',
                                text: `Created k6 script: ${filePath}\n\n${script}`
                            }]
                    };
                }
                catch (error) {
                    return {
                        content: [{
                                type: 'text',
                                text: `Error creating k6 script: ${error.message}`
                            }]
                    };
                }
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
            case 'generate_non_functional_tests_file': {
                const curlCommand = args.curlCommand;
                const specFilePath = args.specFilePath;
                const description = args.description;
                const mode = args.mode || 'create';
                // Parse curl
                const apiDetails = parseCurl(curlCommand);
                // Analyze framework
                const frameworkContext = await analyzeFramework();
                // Generate non-functional tests
                const nonFunctionalTests = generateNonFunctionalTestsFile(apiDetails, description, frameworkContext);
                // Determine file path for non-functional tests
                const nonFunctionalPath = getNonFunctionalSpecPath(specFilePath);
                // Write to file
                if (mode === 'append') {
                    const existing = await readSpecFile(nonFunctionalPath);
                    const combined = existing.content + '\n\n' + nonFunctionalTests;
                    await writeSpecFile(nonFunctionalPath, combined, true);
                }
                else {
                    await writeSpecFile(nonFunctionalPath, nonFunctionalTests, mode === 'update');
                }
                return {
                    content: [{
                            type: 'text',
                            text: `Successfully generated non-functional tests and ${mode === 'create' ? 'created' : mode === 'update' ? 'updated' : 'appended to'} file: ${nonFunctionalPath}\n\nAPI Details:\n${JSON.stringify(apiDetails, null, 2)}`
                        }]
                };
            }
            case 'generate_functional_and_non_functional_split': {
                const curlCommand = args.curlCommand;
                const specFilePath = args.specFilePath;
                const description = args.description;
                const mode = args.mode || 'create';
                // Parse curl
                const apiDetails = parseCurl(curlCommand);
                // Analyze framework
                const frameworkContext = await analyzeFramework();
                // Generate functional+component tests
                const functionalTests = generateFunctionalTestsFile(apiDetails, description, frameworkContext);
                // Generate non-functional tests
                const nonFunctionalTests = generateNonFunctionalTestsFile(apiDetails, description, frameworkContext);
                // Determine file paths
                const nonFunctionalPath = getNonFunctionalSpecPath(specFilePath);
                // Write functional tests
                if (mode === 'append') {
                    const existing = await readSpecFile(specFilePath);
                    const combined = existing.content + '\n\n' + functionalTests;
                    await writeSpecFile(specFilePath, combined, true);
                }
                else {
                    await writeSpecFile(specFilePath, functionalTests, mode === 'update');
                }
                // Write non-functional tests
                if (mode === 'append') {
                    const existing = await readSpecFile(nonFunctionalPath);
                    const combined = existing.content + '\n\n' + nonFunctionalTests;
                    await writeSpecFile(nonFunctionalPath, combined, true);
                }
                else {
                    await writeSpecFile(nonFunctionalPath, nonFunctionalTests, mode === 'update');
                }
                return {
                    content: [{
                            type: 'text',
                            text: `Successfully generated split tests:\n- Functional & Component: ${specFilePath}\n- Non-Functional: ${nonFunctionalPath}\n\nAPI Details:\n${JSON.stringify(apiDetails, null, 2)}`
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
