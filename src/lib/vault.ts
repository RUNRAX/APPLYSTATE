import NodeVault from 'node-vault';
import prisma from './prisma';
import crypto from 'crypto';

const vault = NodeVault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
});

// Utility to authenticate with AppRole
export const authenticateVault = async () => {
  if (vault.token) return true;
  const roleId = process.env.VAULT_ROLE_ID;
  const secretId = process.env.VAULT_SECRET_ID;
  if (!roleId || !secretId) {
    return false;
  }
  
  try {
    const result = await vault.approleLogin({ role_id: roleId, secret_id: secretId });
    vault.token = result.auth.client_token;
    return true;
  } catch (err) {
    return false;
  }
};

// AES-256-GCM encryption for when actual HashiCorp Vault is not available
const ALGORITHM = 'aes-256-gcm';
const getEncryptionKey = () => {
  // Use a fallback key for development if none is provided
  const rawKey = process.env.ENCRYPTION_SECRET || 'fallback-dev-secret-key-32-chars-long-min!';
  // Hash it to exactly 32 bytes
  return crypto.createHash('sha256').update(rawKey).digest();
};

export const encryptCredential = (data: any): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV is standard for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decryptCredential = (encryptedText: string): any => {
  if (!encryptedText || !encryptedText.includes(':')) return null;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) throw new Error("Invalid encrypted text format");
  
  const [ivHex, authTagHex, encryptedData] = parts;
  
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

export const getCredential = async (userId: string, path: string) => {
  const isVaultAuth = await authenticateVault();
  
  if (!isVaultAuth) {
    // If it's a fallback Vault string format (AES encrypted)
    if (path.includes(':')) {
      try {
        return decryptCredential(path);
      } catch (e) {
        console.error("Failed to decrypt local credential", e);
        return null;
      }
    }
    
    // Legacy fallback to standard env vars
    const fallbackKey = path.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_CREDENTIAL';
    console.warn(`Vault not configured. Falling back to env var: ${fallbackKey}`);
    return process.env[fallbackKey];
  }

  try {
    const secret = await vault.read(path);
    
    // Audit log the retrieval
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'READ_CREDENTIAL',
        resource: path,
        ipHash: 'internal', // Would be derived from request context in prod
      }
    });

    return secret.data.data;
  } catch (error) {
    console.error("Vault read error:", error);
    throw new Error("Failed to retrieve credential");
  }
};

