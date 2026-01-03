/**
 * Parse curl command and extract API details
 */
export function parseCurl(curlCommand) {
    // Remove line breaks and extra spaces
    const normalized = curlCommand.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();
    // Extract URL
    const urlMatch = normalized.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^'"\s]+)['"]?/);
    if (!urlMatch) {
        throw new Error('Could not extract URL from curl command');
    }
    const fullUrl = urlMatch[1];
    const urlObj = new URL(fullUrl);
    const endpoint = urlObj.pathname;
    // Extract query parameters
    const queryParams = {};
    urlObj.searchParams.forEach((value, key) => {
        queryParams[key] = value;
    });
    // Extract HTTP method
    const methodMatch = normalized.match(/-X\s+(\w+)/);
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
    // Extract headers
    const headers = {};
    const headerRegex = /-H\s+['"]([^'"]+)['"]/g;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(normalized)) !== null) {
        const headerLine = headerMatch[1];
        const colonIndex = headerLine.indexOf(':');
        if (colonIndex > 0) {
            const key = headerLine.substring(0, colonIndex).trim();
            const value = headerLine.substring(colonIndex + 1).trim();
            headers[key] = value;
        }
    }
    // Extract request body
    let requestBody = undefined;
    const dataMatch = normalized.match(/(?:-d|--data|--data-raw)\s+['"]([^'"]+)['"]/);
    if (dataMatch) {
        const bodyString = dataMatch[1];
        try {
            requestBody = JSON.parse(bodyString);
        }
        catch {
            requestBody = bodyString;
        }
    }
    return {
        endpoint,
        method,
        headers,
        requestBody,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined
    };
}
