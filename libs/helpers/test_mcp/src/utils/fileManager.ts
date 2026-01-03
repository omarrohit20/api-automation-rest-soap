/**
 * Manage spec files and analyze framework structure
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { RSpecFile } from '../types.js';

/**
 * Read an existing spec file
 */
export async function readSpecFile(filePath: string): Promise<RSpecFile> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      filePath,
      content,
      exists: true
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        filePath,
        content: '',
        exists: false
      };
    }
    throw error;
  }
}

/**
 * Write content to a spec file
 */
export async function writeSpecFile(
  filePath: string,
  content: string,
  overwrite: boolean = false
): Promise<void> {
  // Check if file exists
  const exists = await fileExists(filePath);
  
  if (exists && !overwrite) {
    throw new Error(`File ${filePath} already exists. Use overwrite mode or append mode.`);
  }
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  
  // Write the file
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Analyze the Ruby/RSpec framework structure
 */
export async function analyzeFramework(): Promise<any> {
  const analysis = {
    specHelperExists: false,
    railsHelperExists: false,
    helperMethods: [] as string[],
    specDirs: [] as string[],
    commonPatterns: [] as string[]
  };
  
  try {
    // Look for spec_helper.rb
    const specHelperPath = 'spec/spec_helper.rb';
    if (await fileExists(specHelperPath)) {
      analysis.specHelperExists = true;
      const content = await fs.readFile(specHelperPath, 'utf-8');
      
      // Extract common helper methods by looking at common.rb in the attached file
      if (content.includes('common') || content.includes('helper')) {
        analysis.helperMethods.push('write_file', 'read_file', 'read_json_file');
      }
    }
    
    // Look for rails_helper.rb
    const railsHelperPath = 'spec/rails_helper.rb';
    if (await fileExists(railsHelperPath)) {
      analysis.railsHelperExists = true;
    }
    
    // Find spec directories
    try {
      const specDir = 'spec';
      const entries = await fs.readdir(specDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          analysis.specDirs.push(entry.name);
        }
      }
    } catch {
      // spec directory doesn't exist
    }
    
    // Common patterns from the Ruby framework
    analysis.commonPatterns = [
      'Use JSON.parse for response parsing',
      'Use expect() matchers from RSpec',
      'Headers typically use symbol or string keys',
      'Request specs use :request type',
      'Use let() for test data setup'
    ];
    
  } catch (error) {
    console.error('Error analyzing framework:', error);
  }
  
  return analysis;
}

/**
 * Find spec files matching a pattern
 */
export async function findSpecFiles(pattern: string): Promise<string[]> {
  const results: string[] = [];
  
  async function searchDir(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await searchDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('_spec.rb')) {
          if (!pattern || fullPath.includes(pattern)) {
            results.push(fullPath);
          }
        }
      }
    } catch {
      // Ignore errors (directory not accessible, etc.)
    }
  }
  
  await searchDir('spec');
  return results;
}
