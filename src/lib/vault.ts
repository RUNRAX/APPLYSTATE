import NodeVault from 'node-vault';
import prisma from './prisma';

const vault = NodeVault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
});

// Utility to authenticate with AppRole
export const authenticateVault = async () => {
  if (vault.token) return;
  const roleId = process.env.VAULT_ROLE_ID;
  const secretId = process.env.VAULT_SECRET_ID;
  if (!roleId || !secretId) {
    console.warn("Vault credentials missing, skipping auth for dev");
    return;
  }
  
  const result = await vault.approleLogin({ role_id: roleId, secret_id: secretId });
  vault.token = result.auth.client_token;
};

export const getCredential = async (userId: string, path: string) => {
  await authenticateVault();
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
