#!/usr/bin/env node
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseCurl } from './build/utils/curlParser.js';
import { generateK6Script } from './build/utils/k6Generator.js';
import * as fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const curlCommand = `curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John","email":"john@example.com"}'`;

async function generateK6() {
  try {
    console.log('Parsing curl command...');
    const apiDetails = parseCurl(curlCommand);
    console.log('API Details:', JSON.stringify(apiDetails, null, 2));
    
    console.log('\nGenerating k6 script...');
    const script = generateK6Script(apiDetails, {
      vus: 10,
      duration: '30s',
      sleepDuration: 1
    });
    
    console.log('\nK6 Script generated:\n');
    console.log(script);
    
    // Save to perfk6 folder
    const perfk6Dir = path.join(__dirname, '../../../perfk6');
    await fs.mkdir(perfk6Dir, { recursive: true });
    
    const filePath = path.join(perfk6Dir, 'users_api.js');
    await fs.writeFile(filePath, script, 'utf-8');
    
    console.log(`\n✓ Script saved to: ${filePath}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

generateK6();
