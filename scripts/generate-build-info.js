#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get git information
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commitDate = execSync('git log -1 --format=%ci', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim().split('\n')[0];
    
    return {
      commitHash,
      branch,
      commitDate,
      commitMessage
    };
  } catch (error) {
    console.warn('Failed to get git info:', error.message);
    return {
      commitHash: 'unknown',
      branch: 'unknown',
      commitDate: new Date().toISOString(),
      commitMessage: 'unknown'
    };
  }
}

// Get package version
function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return packageJson.version || '0.0.0';
  } catch (error) {
    console.warn('Failed to get package version:', error.message);
    return '0.0.0';
  }
}

// Generate build info
function generateBuildInfo() {
  const gitInfo = getGitInfo();
  const version = getPackageVersion();
  const buildDate = new Date().toISOString();
  const buildNumber = process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || 'local';
  
  const buildInfo = {
    version,
    buildDate,
    buildNumber,
    git: gitInfo,
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Write to both frontend and backend
  const frontendPath = path.join(__dirname, '..', 'src', 'buildInfo.json');
  const backendPath = path.join(__dirname, '..', 'backend', 'src', 'buildInfo.json');
  
  fs.writeFileSync(frontendPath, JSON.stringify(buildInfo, null, 2));
  fs.writeFileSync(backendPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('Build info generated:');
  console.log(JSON.stringify(buildInfo, null, 2));
  console.log(`\nWritten to:\n- ${frontendPath}\n- ${backendPath}`);
}

// Run
generateBuildInfo();