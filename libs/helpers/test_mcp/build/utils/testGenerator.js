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
    if (testType === 'functional' || testType === 'both' || testType === 'all') {
        lines.push(...generateFunctionalTests(apiDetails, resourceName, frameworkContext));
    }
    if (testType === 'component' || testType === 'both' || testType === 'all') {
        if (testType !== 'component') {
            lines.push('');
        }
        lines.push(...generateComponentTests(apiDetails, resourceName, frameworkContext));
    }
    if (testType === 'non-functional' || testType === 'all') {
        if (testType !== 'non-functional') {
            lines.push('');
        }
        lines.push(...generateNonFunctionalTests(apiDetails, resourceName, frameworkContext));
    }
    lines.push('end');
    return lines.join('\n');
}
/**
 * Generate only non-functional tests in a complete RSpec file
 */
export function generateNonFunctionalTestsFile(apiDetails, description, frameworkContext) {
    const lines = [];
    // Add RSpec header
    lines.push("require 'rails_helper'");
    lines.push('');
    // Determine the resource name from endpoint
    const resourceName = extractResourceName(apiDetails.endpoint);
    const descriptionText = description || `${apiDetails.method} ${apiDetails.endpoint} Non-Functional Tests`;
    lines.push(`RSpec.describe '${descriptionText}', type: :request do`);
    lines.push(...generateNonFunctionalTests(apiDetails, resourceName, frameworkContext));
    lines.push('end');
    return lines.join('\n');
}
/**
 * Generate functional and component tests without non-functional
 */
export function generateFunctionalTestsFile(apiDetails, description, frameworkContext) {
    const lines = [];
    // Add RSpec header
    lines.push("require 'rails_helper'");
    lines.push('');
    // Determine the resource name from endpoint
    const resourceName = extractResourceName(apiDetails.endpoint);
    const descriptionText = description || `${apiDetails.method} ${apiDetails.endpoint}`;
    lines.push(`RSpec.describe '${descriptionText}', type: :request do`);
    lines.push(...generateFunctionalTests(apiDetails, resourceName, frameworkContext));
    lines.push('');
    lines.push(...generateComponentTests(apiDetails, resourceName, frameworkContext));
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
function generateNonFunctionalTests(apiDetails, resourceName, context) {
    const lines = [];
    lines.push('  context \'Non-Functional Tests\' do');
    // Security Tests
    lines.push('    context \'Security Tests\' do');
    lines.push('      it \'rejects requests without required headers\' do');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}'`);
    lines.push('');
    lines.push('        expect(response).to have_http_status(:bad_request).or have_http_status(:unauthorized)');
    lines.push('      end');
    lines.push('');
    lines.push('      it \'rejects malformed JSON in request body\' do');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', params: '{invalid json}', headers: { 'Content-Type' => 'application/json' }`);
    lines.push('');
    lines.push('        expect(response).to have_http_status(:bad_request)');
    lines.push('      end');
    lines.push('');
    lines.push('      it \'prevents SQL injection in parameters\' do');
    lines.push(`        malicious_params = { query: \'\'; DROP TABLE users; --\' }`);
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', params: malicious_params, headers: headers`);
    lines.push('');
    lines.push('        expect(response).to_not have_http_status(:internal_server_error)');
    lines.push('        expect(response.status).to be_in([200, 400, 403, 404, 422])');
    lines.push('      end');
    lines.push('    end');
    lines.push('');
    // Performance Tests
    lines.push('    context \'Performance Tests\' do');
    lines.push('      it \'responds within acceptable time\' do');
    lines.push('        start_time = Time.now');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: headers`);
    lines.push('        duration = Time.now - start_time');
    lines.push('');
    lines.push('        expect(duration).to be < 2.0');
    lines.push('      end');
    lines.push('');
    lines.push('      it \'returns consistent response size\' do');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: headers`);
    lines.push('        first_response_size = response.body.size');
    lines.push('');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: headers`);
    lines.push('        second_response_size = response.body.size');
    lines.push('');
    lines.push('        expect(first_response_size).to eq(second_response_size)');
    lines.push('      end');
    lines.push('    end');
    lines.push('');
    // Reliability Tests
    lines.push('    context \'Reliability Tests\' do');
    lines.push('      it \'handles concurrent requests\' do');
    lines.push('        threads = []');
    lines.push('        responses = []');
    lines.push('');
    lines.push('        5.times do');
    lines.push('          threads << Thread.new do');
    lines.push(`            resp = ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: headers`);
    lines.push('            responses << resp.status');
    lines.push('          end');
    lines.push('        end');
    lines.push('');
    lines.push('        threads.each(&:join)');
    lines.push('        expect(responses).to all(be_in([200, 201, 204, 400, 401, 403, 404, 422]))');
    lines.push('      end');
    lines.push('');
    lines.push('      it \'recovers from transient errors\' do');
    lines.push('        retries = 0');
    lines.push('        begin');
    lines.push(`          ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: headers`);
    lines.push('        rescue StandardError => e');
    lines.push('          retries += 1');
    lines.push('          retry if retries < 3');
    lines.push('        end');
    lines.push('');
    lines.push('        expect(response.status).to be_present');
    lines.push('      end');
    lines.push('    end');
    lines.push('');
    // Compatibility Tests
    lines.push('    context \'Compatibility Tests\' do');
    lines.push('      it \'accepts application/json content type\' do');
    lines.push('        custom_headers = headers.merge({ \'Content-Type\' => \'application/json\' })');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: custom_headers, as: :json`);
    lines.push('');
    lines.push('        expect(response).to_not have_http_status(:unsupported_media_type)');
    lines.push('      end');
    lines.push('');
    lines.push('      it \'handles missing optional headers\' do');
    lines.push('        minimal_headers = { \'Content-Type\' => \'application/json\' }');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: minimal_headers`);
    lines.push('');
    lines.push('        expect([200, 201, 204, 400, 401, 403, 422]).to include(response.status)');
    lines.push('      end');
    lines.push('    end');
    lines.push('');
    // Availability Tests
    lines.push('    context \'Availability Tests\' do');
    lines.push('      it \'is accessible and responsive\' do');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', headers: headers`);
    lines.push('');
    lines.push('        expect(response).to_not be_nil');
    lines.push('        expect(response.status).to be_present');
    lines.push('      end');
    lines.push('');
    lines.push('      it \'returns proper error messages\' do');
    lines.push(`        ${apiDetails.method.toLowerCase()} '${apiDetails.endpoint}', params: { invalid: \'data\' }, headers: headers, as: :json`);
    lines.push('');
    lines.push('        if response.status.in?([400, 422])');
    lines.push('          json_response = JSON.parse(response.body)');
    lines.push('          expect(json_response).to have_key(\'error\').or have_key(\'errors\').or have_key(\'message\')');
    lines.push('        end');
    lines.push('      end');
    lines.push('    end');
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
