# Separate Script Files for Non-Functional Tests

## Overview

The MCP server now supports generating non-functional tests in separate files, keeping your test organization clean and modular.

## New Tools for Separate Files

### 1. `generate_non_functional_tests_file`

Generates **only** non-functional tests in a separate file.

**Usage:**
```
curlCommand: curl -X POST https://api.example.com/users ...
specFilePath: spec/api/users_spec.rb
description: (optional) User Management API
mode: create
```

**Output:**
- `spec/api/users_non_functional_spec.rb` (automatically created with _non_functional suffix)

**When to use:**
- You already have functional tests in a separate file
- You want to add comprehensive non-functional tests later
- You need to organize tests by concern (functional vs non-functional)

---

### 2. `generate_functional_and_non_functional_split`

Generates **both** functional+component and non-functional tests in **separate files**.

**Usage:**
```
curlCommand: curl -X POST https://api.example.com/users ...
specFilePath: spec/api/users_spec.rb
description: (optional) User Management API
mode: create
```

**Output:**
- `spec/api/users_spec.rb` - Contains:
  - Functional Tests (success/error scenarios)
  - Component Tests (request/response structure)

- `spec/api/users_non_functional_spec.rb` - Contains:
  - Security Tests
  - Performance Tests
  - Reliability Tests
  - Compatibility Tests
  - Availability Tests

**When to use:**
- Creating a new API test suite from scratch
- You want complete test coverage split logically
- You prefer to run functional and non-functional tests separately
- Best practice for organizing test maintenance

---

## File Naming Examples

### Input Spec Path → Generated Files

| You Provide | Functional File | Non-Functional File |
|-------------|----------------|-------------------|
| `spec/api/users_spec.rb` | `spec/api/users_spec.rb` | `spec/api/users_non_functional_spec.rb` |
| `spec/requests/products_spec.rb` | `spec/requests/products_spec.rb` | `spec/requests/products_non_functional_spec.rb` |
| `test/api/payments_spec.rb` | `test/api/payments_spec.rb` | `test/api/payments_non_functional_spec.rb` |

---

## Usage Scenarios

### Scenario A: Start with Functional Tests Only

1. Generate functional+component tests:
```
Use: generate_complete_tests
testType: "both"
Output: spec/api/users_spec.rb
```

2. Later, add non-functional tests:
```
Use: generate_non_functional_tests_file
Input: spec/api/users_spec.rb
Output: spec/api/users_non_functional_spec.rb (auto-created)
```

### Scenario B: Complete Test Suite from Scratch

1. Generate everything split into files:
```
Use: generate_functional_and_non_functional_split
Output 1: spec/api/users_spec.rb (functional + component)
Output 2: spec/api/users_non_functional_spec.rb (non-functional)
```

2. Run tests separately:
```bash
# Run only functional tests
rspec spec/api/users_spec.rb

# Run only non-functional tests
rspec spec/api/users_non_functional_spec.rb

# Run all tests
rspec spec/api/users_spec.rb spec/api/users_non_functional_spec.rb
```

### Scenario C: Combine All Tests Later

If you have separate files and want to merge them:

1. Generate tests with `testType: "all"` to a new file
2. Or manually import tests from non_functional file into main file

---

## Test File Content

### Main Spec File (`users_spec.rb`)
```ruby
require 'rails_helper'

RSpec.describe 'POST /users', type: :request do
  # Functional Tests
  context 'Functional Tests' do
    it 'returns successful response' do
      # ...
    end
  end
  
  # Component Tests
  context 'Component Tests' do
    it 'validates request structure' do
      # ...
    end
  end
end
```

### Non-Functional Spec File (`users_non_functional_spec.rb`)
```ruby
require 'rails_helper'

RSpec.describe 'POST /users Non-Functional Tests', type: :request do
  # Security Tests
  context 'Security Tests' do
    it 'rejects requests without required headers' do
      # ...
    end
  end
  
  # Performance Tests
  context 'Performance Tests' do
    it 'responds within acceptable time' do
      # ...
    end
  end
  
  # ... more non-functional tests
end
```

---

## Benefits of Separate Files

✅ **Organization**: Functional and non-functional tests are logically separated
✅ **Maintenance**: Easy to update or extend specific test categories
✅ **Parallel Execution**: Run test types independently
✅ **Clarity**: Clear intent of each test file
✅ **Scalability**: Add more test files as your API grows
✅ **CI/CD Integration**: Run different test suites at different stages

---

## Running Separated Tests

### With RSpec

```bash
# Run only functional tests
bundle exec rspec spec/api/users_spec.rb

# Run only non-functional tests
bundle exec rspec spec/api/users_non_functional_spec.rb

# Run all tests for a resource
bundle exec rspec spec/api/users_*.rb

# Run by tag
bundle exec rspec --tag functional spec/
bundle exec rspec --tag non_functional spec/
```

### With Test Suite (CI/CD)

```bash
# Run fast tests first (functional)
rspec spec/**/*_spec.rb

# Run slower tests later (non-functional)
rspec spec/**/*_non_functional_spec.rb
```

---

## Modes: create, update, append

| Mode | Behavior |
|------|----------|
| `create` | Creates new files. Fails if files already exist. |
| `update` | Overwrites entire content of existing files. |
| `append` | Adds new tests to the end of existing files. |

---

## Quick Reference

| Need | Tool | Options |
|------|------|---------|
| Split functional & non-functional from scratch | `generate_functional_and_non_functional_split` | `mode: "create"` |
| Add non-functional tests to existing project | `generate_non_functional_tests_file` | `mode: "create"` |
| Replace all tests | Any tool | `mode: "update"` |
| Add more tests to existing files | Any tool | `mode: "append"` |
| All tests in one file | `generate_complete_tests` | `testType: "all"` |
