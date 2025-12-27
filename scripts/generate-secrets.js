#!/usr/bin/env node

/**
 * Generate secure secrets for deployment
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

console.log('\n🔐 Generating Secrets for Deployment\n');
console.log('=' .repeat(50));

const betterAuthSecret = generateSecret(32);
const cronSecret = generateSecret(32);

console.log('\n📋 Copy these secrets to your environment variables:\n');
console.log('BETTER_AUTH_SECRET=');
console.log(betterAuthSecret);
console.log('\nCRON_SECRET=');
console.log(cronSecret);

console.log('\n' + '='.repeat(50));
console.log('\n⚠️  IMPORTANT: Save these secrets securely!');
console.log('   They will not be shown again.\n');

// Optionally write to a .secrets file (gitignored)
const fs = require('fs');
const path = require('path');

const secretsFile = path.join(__dirname, '..', '.secrets');
const secretsContent = `# Generated secrets - DO NOT COMMIT TO GIT
# Generated at: ${new Date().toISOString()}

BETTER_AUTH_SECRET=${betterAuthSecret}
CRON_SECRET=${cronSecret}
`;

try {
  fs.writeFileSync(secretsFile, secretsContent);
  console.log(`✅ Secrets also saved to: ${secretsFile}`);
  console.log('   (This file is gitignored)\n');
} catch (error) {
  console.log('⚠️  Could not write .secrets file (this is okay)\n');
}











