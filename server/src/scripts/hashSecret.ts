#!/usr/bin/env node
/**
 * CLI helper to hash a plain-text admin secret with bcrypt (cost factor 12).
 *
 * Usage:
 *   npm run hash-secret -- "your-plain-secret"
 *   # or
 *   node dist/scripts/hashSecret.js "your-plain-secret"
 *
 * Copy the printed hash into ADMIN_SECRET_HASH in your .env file.
 * Never put the plain-text secret into the env file when using this approach.
 */

import { hash } from "bcryptjs";

const secret = process.argv[2];

if (!secret || secret.trim().length < 8) {
  console.error('Usage: npm run hash-secret -- "<secret>" (min 8 chars)');
  process.exit(1);
}

hash(secret.trim(), 12)
  .then((h) => {
    console.log("\nBcrypt hash (cost factor 12):");
    console.log(h);
    console.log("\nAdd this to your .env as:");
    console.log(`ADMIN_SECRET_HASH=${h}`);
  })
  .catch((err) => {
    console.error("Failed to hash secret:", err);
    process.exit(1);
  });
