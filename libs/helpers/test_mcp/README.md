# RSpec Test Generator MCP Server

An MCP (Model Context Protocol) server that automatically generates Ruby RSpec test cases from API curl requests. This tool analyzes your Ruby/RSpec framework structure and creates functional and component test cases.

## Features

- **Parse Curl Requests**: Extract API details (URL, method, headers, body) from curl commands
- **Generate RSpec Tests**: Create functional and component test cases automatically
- **Manage Spec Files**: Create new or edit existing RSpec spec files
- **Framework Analysis**: Analyze your Ruby/RSpec test framework structure
- **Complete Workflow**: Single command to parse, generate, and save tests

## Installation

```bash
npm install
npm run build
```

## Configuration

### VS Code MCP Integration

The MCP server is pre-configured for VS Code. The configuration is in `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "rspec-test-generator": {
      "command": "node",
      "args": ["d:\\git\\learning\\api-automation-rest-soap\\libs\\helpers\\test_mcp\\build\\index.js"]
    }
  }
}
```

## Tools

### 1. parse_curl

Parses a curl command and extracts API details.

**Parameters:**
- `curlCommand` (string, required): The curl command to parse

**Returns:** Extracted API details including URL, method, headers, body, and query parameters.

**Example:**
```
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"name":"John","email":"john@example.com"}'
```

### 2. generate_tests

Generates RSpec functional and component test cases from a curl command.

**Parameters:**
- `curlCommand` (string, required): The curl command to generate tests for
- `testType` (string, optional): Type of tests - "functional", "component", or "both" (default: "both")
- `description` (string, optional): Description for the test suite

**Returns:** Generated RSpec test code with describe blocks, contexts, and test cases.

**Example Output:**
```ruby
require 'spec_helper'

RSpec.describe 'POST /users API' do
  context 'Functional Tests' do
    context 'Success Scenarios' do
      it 'returns 200 status code when request is successful' do
        # Test implementation
      end
      
      it 'returns expected response structure' do
        # Test implementation
      end
    end
    
    context 'Error Scenarios' do
      it 'returns 400 when required fields are missing' do
        # Test implementation
      end
    end
  end
  
  context 'Component Tests' do
    it 'validates request payload structure' do
      # Test implementation
    end
  end
end
```

### 3. manage_spec_file

Creates a new spec file or edits an existing one with generated test content.

**Parameters:**
- `filePath` (string, required): Path to the spec file (e.g., "spec/api/users_spec.rb")
- `content` (string, required): The RSpec test content to write
- `mode` (string, required): Operation mode - "create", "update", or "append"

**Modes:**
- **create**: Creates a new spec file (fails if file exists)
- **update**: Replaces entire content of existing file
- **append**: Adds content to the end of existing file

### 4. analyze_framework

Analyzes your Ruby/RSpec test framework structure to understand patterns and helpers.

**Returns:** Framework analysis including:
- Spec helper files found (spec_helper.rb, rails_helper.rb)
- Available helper methods
- Test patterns and structure
- Framework conventions

### 5. generate_complete_tests

Complete workflow: parses curl command, generates tests, and creates/updates spec file in one operation.

**Parameters:**
- `curlCommand` (string, required): The curl command to generate tests for
- `specFilePath` (string, required): Path where to save the spec file
- `testType` (string, optional): Type of tests - "functional", "component", or "both" (default: "both")
- `description` (string, optional): Description for the test suite
- `mode` (string, optional): File operation mode - "create", "update", or "append" (default: "create")

**Example Usage:**

```
Generate tests for this curl:
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'

Save to: spec/api/users_spec.rb
```

## Workflow Example

### Option 1: Step-by-Step

1. **Parse the curl request:**
   ```
   Use parse_curl with your curl command
   ```

2. **Generate test cases:**
   ```
   Use generate_tests with the same curl command
   Specify testType: "both" to get functional and component tests
   ```

3. **Save to file:**
   ```
   Use manage_spec_file with mode: "create"
   Provide the generated content and file path
   ```

### Option 2: All-in-One

Use `generate_complete_tests` to execute all steps automatically:
```
Provide curl command and spec file path
The tool will parse, generate, and save in one operation
```

## Generated Test Structure

The tool generates two types of tests:

### Functional Tests
- Success scenarios (2xx status codes)
- Error scenarios (4xx/5xx status codes)
- Response structure validation
- Status code verification

### Component Tests
- Request payload validation
- Header verification
- Query parameter validation
- Response schema validation

## Framework Detection

The tool automatically detects:
- **spec_helper.rb** or **rails_helper.rb**: Base configuration files
- **Custom helpers**: Common test utilities (write_file, read_file, JSON parsing, etc.)
- **Test patterns**: Existing test structure and conventions
- **RSpec configuration**: Settings and hooks

## Development

### Project Structure
```
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── types.ts              # TypeScript type definitions
│   └── utils/
│       ├── curlParser.ts     # Curl command parser
│       ├── testGenerator.ts  # RSpec test generator
│       └── fileManager.ts    # File operations & framework analysis
├── build/                     # Compiled JavaScript output
├── package.json
└── tsconfig.json
```

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run watch
```

### Testing
```bash
node build/index.js
```

## Technical Details

- **MCP SDK Version**: @modelcontextprotocol/sdk v1.0.4
- **TypeScript**: v5.7.2
- **Transport**: STDIO (Standard Input/Output)
- **Node.js**: ES Modules with Node16 module resolution

## Supported API Methods

- GET, POST, PUT, PATCH, DELETE
- All standard HTTP headers
- JSON request/response bodies
- Query parameters
- Authentication (Bearer tokens, API keys, etc.)

## Output Format

All tests follow RSpec best practices:
- Descriptive `describe` and `context` blocks
- Clear `it` statements explaining test intent
- Proper setup and teardown
- Readable assertions
- Ruby-idiomatic code style

## License

MIT

## Contributing

Issues and pull requests welcome!
