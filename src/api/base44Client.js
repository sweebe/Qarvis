import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6892830893d0965f5376de75", 
  requiresAuth: true // Ensure authentication is required for all operations
});
