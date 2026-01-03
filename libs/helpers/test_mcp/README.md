# RSpec Test Generator MCP Server

An MCP (Model Context Protocol) server that automatically generates Ruby RSpec test cases from API curl requests. This tool analyzes your Ruby/RSpec framework structure and creates functional and component test cases.

## Features

- **Parse Curl Requests**: Extract API details (URL, method, headers, body) from curl commands
- **Generate RSpec Tests**: Create functional, component, and non-functional test cases automatically
- **Generate k6 Scripts**: Create k6 performance test scripts from curl commands
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
- `testType` (string, optional): Type of tests - "functional", "component", "non-functional", "both" (default), or "all"
  - **functional**: Tests success/error scenarios
  - **component**: Tests request/response structure
  - **non-functional**: Tests security, performance, reliability, compatibility, and availability
  - **both**: Combines functional + component
  - **all**: Combines functional + component + non-functional
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

### 3. generate_k6_script

Generates a k6 performance testing script from a curl command.

**Parameters:**
- `curlCommand` (string, required): The curl command to convert
- `vus` (number, optional): Virtual users (default: 10)
- `duration` (string, optional): Test duration (default: "30s")
- `iterations` (number, optional): Fixed number of iterations instead of duration
- `thresholds` (array[string], optional): Thresholds for `http_req_duration` (e.g., `"p(95)<800"`)
- `sleepDuration` (number, optional): Seconds to sleep between iterations (default: 1)

**Example Output:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: [
      'p(95)<800'
    ]
  }
};

export default function () {
  const url = 'https://api.example.com/users';
  const headers = {
    "Content-Type": "application/json"
  };
  const payload = JSON.stringify({
    "name": "John",
    "email": "john@example.com"
  });
  const params = { headers };
  const res = http.request('POST', url, payload, params);
  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 800ms': (r) => r.timings.duration < 800
  });
  sleep(1);
}
```

### 4. manage_spec_file

Creates a new spec file or edits an existing one with generated test content.

**Parameters:**
- `filePath` (string, required): Path to the spec file (e.g., "spec/api/users_spec.rb")
- `content` (string, required): The RSpec test content to write
- `mode` (string, required): Operation mode - "create", "update", or "append"

**Modes:**
- **create**: Creates a new spec file (fails if file exists)
- **update**: Replaces entire content of existing file
- **append**: Adds content to the end of existing file

### 5. analyze_framework

Analyzes your Ruby/RSpec test framework structure to understand patterns and helpers.

**Returns:** Framework analysis including:
- Spec helper files found (spec_helper.rb, rails_helper.rb)
- Available helper methods
- Test patterns and structure
- Framework conventions

### 6. generate_complete_tests

Complete workflow: parses curl command, generates tests, and creates/updates spec file in one operation.

**Parameters:**
- `curlCommand` (string, required): The curl command to generate tests for
- `specFilePath` (string, required): Path where to save the spec file
- `testType` (string, optional): Type of tests - "functional", "component", "non-functional", "both" (default), or "all"
- `description` (string, optional): Description for the test suite
- `mode` (string, optional): File operation mode - "create", "update", or "append" (default: "create")

### 7. generate_non_functional_tests_file

**NEW**: Generates only non-functional tests in a **separate file**.

Automatically creates a file with `_non_functional` suffix (e.g., `users_non_functional_spec.rb`)

**Parameters:**
- `curlCommand` (string, required): The curl command to generate non-functional tests for
- `specFilePath` (string, required): Base spec file path (will create non_functional variant)
- `description` (string, optional): Description for the test suite
- `mode` (string, optional): File operation mode - "create", "update", or "append" (default: "create")

**Example:** Provide `spec/api/users_spec.rb` → Creates `spec/api/users_non_functional_spec.rb`

### 8. generate_functional_and_non_functional_split

**NEW**: Generates functional+component tests and non-functional tests in **separate files**.

**Parameters:**
- `curlCommand` (string, required): The curl command to generate tests for
- `specFilePath` (string, required): Path for main spec file (functional+component tests)
- `description` (string, optional): Description for the test suite
- `mode` (string, optional): File operation mode - "create", "update", or "append" (default: "create")

**Output Files:**
- `specFilePath`: Contains functional + component tests
- `specFilePath_non_functional`: Contains non-functional tests

**Example:**
- Input: `spec/api/users_spec.rb`
- Output 1: `spec/api/users_spec.rb` (functional + component)
- Output 2: `spec/api/users_non_functional_spec.rb` (non-functional)

## Workflow Examples

### Scenario 1: Generate All Tests in One File

Use `generate_complete_tests` with `testType: "all"`:
```
Provides: all functional + component + non-functional tests in a single spec file
Example: spec/api/users_spec.rb
```

### Scenario 2: Generate Functional and Non-Functional in Separate Files

Use `generate_functional_and_non_functional_split`:
```
Input spec path: spec/api/users_spec.rb

Output 1: spec/api/users_spec.rb
- Functional tests (success/error scenarios)
- Component tests (request/response structure)

Output 2: spec/api/users_non_functional_spec.rb
- Security tests
- Performance tests
- Reliability tests
- Compatibility tests
- Availability tests
```

### Scenario 3: Generate Only Non-Functional Tests

Use `generate_non_functional_tests_file`:
```
Input spec path: spec/api/users_spec.rb

Output: spec/api/users_non_functional_spec.rb
- Contains only non-functional tests
- Can be run separately from functional tests
```

### Scenario 4: Step-by-Step Manual Workflow

1. Use `parse_curl` - Extract API details
2. Use `generate_tests` - Generate specific test types
3. Use `manage_spec_file` - Save to file with desired mode

## File Naming Convention

The MCP server automatically generates non-functional test file names:

| Main File | Non-Functional File |
|-----------|-------------------|
| `spec/api/users_spec.rb` | `spec/api/users_non_functional_spec.rb` |
| `spec/requests/products_spec.rb` | `spec/requests/products_non_functional_spec.rb` |
| `test/api/auth_spec.rb` | `test/api/auth_non_functional_spec.rb` |

## Generated Test Structure

The tool generates multiple types of tests:

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

### Non-Functional Tests
- **Security**: Missing headers, malformed JSON, SQL injection protection
- **Performance**: Response time thresholds, response size consistency
- **Reliability**: Concurrent request handling, transient error recovery
- **Compatibility**: Content-type handling, optional headers
- **Availability**: Accessibility, error message format validation



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
