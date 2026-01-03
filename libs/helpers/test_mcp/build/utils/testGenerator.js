/**
 * Generate RSpec test cases from API details
 */
export function generateRSpecTests(apiDetails, options) {
    const { testType, description, frameworkContext } = options;
    const lines = [];
    // Add RSpec header
    lines.push("require 'rails_helper'");
    lines.push('');
    // Determine the resource name from endpoint
    const resourceName = extractResourceName(apiDetails.endpoint);
    const descriptionText = description || `${apiDetails.method} ${apiDetails.endpoint}`;
    lines.push(`RSpec.describe '${descriptionText}', type: :request do`);
    // Generate tests based on type
    if (testType === 'functional' || testType === 'both') {
        lines.push(...generateFunctionalTests(apiDetails, resourceName, frameworkContext));
    }
    if (testType === 'component' || testType === 'both') {
        if (testType === 'both') {
            lines.push('');
        }
        lines.push(...generateComponentTests(apiDetails, resourceName, frameworkContext));
    }
    lines.push('end');
    return lines.join('\n');
}
function extractResourceName(endpoint) {
    // Extract resource name from endpoint like /api/users or /users/123
    const parts = endpoint.split('/').filter(p => p && !/^\d+$/.test(p));
    return parts[parts.length - 1] || 'resource';
}
function generateFunctionalTests(apiDetails, resourceName, context) {
    const lines = [];
    lines.push('  context \'Functional Tests\' do');
    // Add setup if needed
    lines.push('    let(:headers) do');
    lines.push('      {');
    Object.entries(apiDetails.headers).forEach(([key, value], index, arr) => {
        const comma = index < arr.length - 1 ? ',' : '';
        lines.push(`        '${key}' => '${value}'${comma}`);
    });
    lines.push('      }');
    lines.push('    end');
    lines.push('');
    // Generate test for successful request
    lines.push(`    it 'returns successful response for ${apiDetails.method} request' do`);
    // Build the request
    const requestParams = [];
    if (apiDetails.requestBody) {
        requestParams.push(`params: ${formatRubyHash(apiDetails.requestBody)}`);
    }
    requestParams.push('headers: headers');
    if (apiDetails.requestBody && typeof apiDetails.requestBody === 'object') {
        requestParams.push('as: :json');
    }
    lines.push(`      ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', ${requestParams.join(', ')}`);
    lines.push('');
    lines.push('      expect(response).to have_http_status(:success)');
    lines.push('      expect(response.content_type).to match(a_string_including("application/json"))');
    // Add response body validation if applicable
    if (['POST', 'GET', 'PUT', 'PATCH'].includes(apiDetails.method)) {
        lines.push('      json_response = JSON.parse(response.body)');
        lines.push('      expect(json_response).to be_present');
    }
    lines.push('    end');
    lines.push('');
    // Generate test for invalid/error scenarios
    if (['POST', 'PUT', 'PATCH'].includes(apiDetails.method)) {
        lines.push(`    it 'returns error for invalid ${resourceName} data' do`);
        lines.push(`      ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', params: {}, headers: headers, as: :json`);
        lines.push('');
        lines.push('      expect(response).to have_http_status(:unprocessable_entity)');
        lines.push('    end');
    }
    lines.push('  end');
    return lines;
}
function generateComponentTests(apiDetails, resourceName, context) {
    const lines = [];
    lines.push('  context \'Component Tests\' do');
    // Test request structure
    lines.push(`    it 'sends correct ${apiDetails.method} request structure' do`);
    lines.push(`      # Verify request headers`);
    Object.entries(apiDetails.headers).forEach(([key, value]) => {
        lines.push(`      # Expect header: ${key} => ${value}`);
    });
    lines.push('    end');
    lines.push('');
    // Test response structure
    lines.push('    it \'validates response structure\' do');
    lines.push(`      ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: headers`);
    lines.push('');
    lines.push('      expect(response).to have_http_status(:success)');
    lines.push('      json_response = JSON.parse(response.body)');
    lines.push('      # Add specific field validations based on your API response');
    lines.push('      expect(json_response).to have_key(\'data\') # Adjust as needed');
    lines.push('    end');
    lines.push('');
    // Test authentication/authorization if auth headers present
    if (apiDetails.headers['Authorization'] || apiDetails.headers['authorization']) {
        lines.push('    it \'requires authentication\' do');
        lines.push(`      ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}'`);
        lines.push('');
        lines.push('      expect(response).to have_http_status(:unauthorized)');
        lines.push('    end');
    }
    lines.push('  end');
    return lines;
}
function formatRubyHash(obj, indent = 0) {
    if (typeof obj !== 'object' || obj === null) {
        return JSON.stringify(obj);
    }
    const spaces = ' '.repeat(indent);
    const entries = Object.entries(obj);
    if (entries.length === 0) {
        return '{}';
    }
    const lines = ['{'];
    entries.forEach(([key, value], index) => {
        const isLast = index === entries.length - 1;
        const formattedValue = typeof value === 'object' && value !== null
            ? formatRubyHash(value, indent + 2)
            : JSON.stringify(value);
        lines.push(`${spaces}  ${key}: ${formattedValue}${isLast ? '' : ','}`);
    });
    lines.push(`${spaces}}`);
    return lines.join('\n');
}
