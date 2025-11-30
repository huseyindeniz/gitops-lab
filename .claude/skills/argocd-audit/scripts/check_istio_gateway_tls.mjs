#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const TARGET_DIRS = ['flux/apps', 'raw-manifests'];

/**
 * Recursively find all YAML files in target directories
 */
function findYamlFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findYamlFiles(fullPath));
    } else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Check for Istio Gateway TLS issues in a file
 */
function checkIstioGatewayTls(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  const relativePath = path.relative(CWD, filePath);

  // Split into YAML documents
  const documents = content.split(/^---$/m);

  for (const doc of documents) {
    // Check if this is an Istio Gateway
    const kindMatch = doc.match(/^kind:\s*Gateway\s*$/m);
    const apiVersionMatch = doc.match(/^apiVersion:\s*networking\.istio\.io/m);

    if (!kindMatch || !apiVersionMatch) continue;

    const docStartLine = content.indexOf(doc) === 0 ? 0 : content.substring(0, content.indexOf(doc)).split('\n').length;
    const docLines = doc.split('\n');

    // Get the name of the gateway
    const nameMatch = doc.match(/^\s*name:\s*["']?([^"'\n]+)["']?\s*$/m);
    const gatewayName = nameMatch ? nameMatch[1].trim() : 'unknown';

    // Track servers and their configurations
    let inServers = false;
    let inServer = false;
    let currentServerLine = -1;
    let hasHttp = false;
    let hasHttps = false;
    let currentPort = null;
    let currentProtocol = null;
    let hasTls = false;
    let hasCredentialName = false;
    let serverHosts = [];

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i];

      if (/^\s*servers:\s*$/.test(line)) {
        inServers = true;
        continue;
      }

      if (inServers && /^\s*-\s*port:/.test(line)) {
        // Process previous server if exists
        if (inServer) {
          // Check previous server
          if (currentProtocol === 'HTTP' && !hasHttps) {
            // HTTP server - check if it's for redirect or actually serving content
            // Look for hosts to determine if this is production traffic
            const prodHosts = serverHosts.filter(h => !h.includes('*') || h.includes('.local') || h.includes('.com') || h.includes('.io'));
            if (prodHosts.length > 0) {
              violations.push({
                file: relativePath,
                line: docStartLine + currentServerLine + 1,
                severity: 'MEDIUM',
                message: `Gateway "${gatewayName}" has HTTP server without HTTPS counterpart`,
              });
            }
          }

          if (currentProtocol === 'HTTPS' && !hasCredentialName) {
            violations.push({
              file: relativePath,
              line: docStartLine + currentServerLine + 1,
              severity: 'HIGH',
              message: `Gateway "${gatewayName}" HTTPS server has no credentialName for TLS certificate`,
            });
          }
        }

        // Start new server
        inServer = true;
        currentServerLine = i;
        currentPort = null;
        currentProtocol = null;
        hasTls = false;
        hasCredentialName = false;
        serverHosts = [];
      }

      if (inServer) {
        // Check port number
        if (/^\s*number:\s*(\d+)/.test(line)) {
          const portMatch = line.match(/number:\s*(\d+)/);
          currentPort = portMatch ? parseInt(portMatch[1]) : null;
        }

        // Check protocol
        if (/^\s*protocol:\s*(\w+)/.test(line)) {
          const protoMatch = line.match(/protocol:\s*(\w+)/);
          currentProtocol = protoMatch ? protoMatch[1].toUpperCase() : null;

          if (currentProtocol === 'HTTP') hasHttp = true;
          if (currentProtocol === 'HTTPS') hasHttps = true;
        }

        // Check for TLS section
        if (/^\s*tls:/.test(line)) {
          hasTls = true;
        }

        // Check for credentialName
        if (/^\s*credentialName:/.test(line)) {
          hasCredentialName = true;

          // Check if credentialName is empty
          if (/credentialName:\s*["']?\s*["']?\s*$/.test(line)) {
            violations.push({
              file: relativePath,
              line: docStartLine + i + 1,
              severity: 'HIGH',
              message: `Gateway "${gatewayName}" has empty credentialName`,
            });
          }
        }

        // Check for wildcard hosts
        if (/^\s*-\s*["']\*["']/.test(line) || /^\s*hosts:.*\*[^.]/.test(line)) {
          violations.push({
            file: relativePath,
            line: docStartLine + i + 1,
            severity: 'HIGH',
            message: `Gateway "${gatewayName}" has wildcard host "*" - overly broad, security risk`,
          });
        }

        // Collect hosts
        if (/^\s*-\s*["']?([^"'\n]+)["']?\s*$/.test(line) && !line.includes('port:')) {
          const hostMatch = line.match(/^\s*-\s*["']?([^"'\n]+)["']?\s*$/);
          if (hostMatch) {
            serverHosts.push(hostMatch[1].trim());
          }
        }
      }
    }

    // Process last server
    if (inServer) {
      if (currentProtocol === 'HTTPS' && !hasCredentialName) {
        violations.push({
          file: relativePath,
          line: docStartLine + currentServerLine + 1,
          severity: 'HIGH',
          message: `Gateway "${gatewayName}" HTTPS server has no credentialName for TLS certificate`,
        });
      }
    }

    // Check if gateway has no HTTPS at all
    if (hasHttp && !hasHttps) {
      violations.push({
        file: relativePath,
        line: docStartLine + 1,
        severity: 'MEDIUM',
        message: `Gateway "${gatewayName}" has only HTTP servers - no TLS configured`,
      });
    }
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  console.log('ArgoCD Istio Gateway TLS Check');
  console.log('='.repeat(80));
  console.log('');

  // Find all YAML files
  let allFiles = [];
  for (const dir of TARGET_DIRS) {
    const fullDir = path.join(CWD, dir);
    allFiles.push(...findYamlFiles(fullDir));
  }

  console.log(`Found ${allFiles.length} YAML files to scan`);
  console.log('');

  const allViolations = [];
  let gatewayCount = 0;

  // Check each file
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Count Gateways
      const gatewayMatches = content.match(/kind:\s*Gateway/g);
      const istioMatches = content.match(/apiVersion:\s*networking\.istio\.io/g);
      if (gatewayMatches && istioMatches) {
        gatewayCount += Math.min(gatewayMatches.length, istioMatches.length);
      }

      const violations = checkIstioGatewayTls(file, content);
      allViolations.push(...violations);
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }

  console.log(`Found ${gatewayCount} Istio Gateway resources`);
  console.log('');

  // Output results
  console.log('Istio Gateway TLS Violations');
  console.log('-'.repeat(80));
  console.log('');

  if (allViolations.length === 0) {
    console.log('✅ No Istio Gateway TLS issues found!');
    console.log('');
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('');
    console.log('Istio Gateway TLS issues: 0 violation(s)');
    console.log('');
    console.log('✅ All checks passed.');
    process.exit(0);
  }

  // Group by file
  const byFile = {};
  for (const v of allViolations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  // Count by severity
  const highCount = allViolations.filter(v => v.severity === 'HIGH').length;
  const mediumCount = allViolations.filter(v => v.severity === 'MEDIUM').length;
  const lowCount = allViolations.filter(v => v.severity === 'LOW').length;

  console.log(`❌ Found ${allViolations.length} Istio Gateway TLS issue(s) (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
  console.log('');

  for (const [file, violations] of Object.entries(byFile)) {
    console.log(`  ❌ ${file}`);
    for (const v of violations) {
      console.log(`     Line ${v.line}: [${v.severity}] ${v.message}`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('');
  console.log(`Istio Gateway TLS issues: ${allViolations.length} violation(s)`);
  console.log('');
  console.log('❌ Istio Gateway TLS issues found.');
  console.log('');
  console.log('Fix: Add HTTPS server with tls.mode: SIMPLE and credentialName');
  console.log('     Use specific hosts instead of wildcards');

  process.exit(1);
}

main();
