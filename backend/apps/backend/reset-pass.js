const { Pool } = require('pg');
const crypto = require('crypto');
const util = require('util');

const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${derivedKey.toString('hex')}.${salt}`;
}

async function run() {
  // In Medusa v1/v2, the password hash format using scrypt is different.
  // Medusa uses standard bcrypt or scrypt. Actually, let's just create a quick test user using the standard CLI since Medusa handles the hashing logic.
  // We already created demo@tirupati.com with demo123.
}
run();
