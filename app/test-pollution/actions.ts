"use server";

/**
 * PROTOTYPE POLLUTION TEST - Server Actions
 * 
 * These actions test if Server Action argument deserialization
 * is vulnerable to prototype pollution via __proto__ injection.
 * 
 * CRITICAL: If decodeReply() doesn't sanitize __proto__, this will
 * pollute Object.prototype in the V8 Isolate, affecting ALL users.
 */

// Test action that accepts an object - VULNERABLE TO PROTOTYPE POLLUTION
export async function testPrototypePollution(data: any) {
  // This function receives data from decodeReply()
  // If data.__proto__ is not sanitized, Object.prototype will be polluted
  
  // Check if pollution succeeded
  const pollutionDetected = {
    hasIsAdmin: Object.prototype.hasOwnProperty('isAdmin'),
    isAdminValue: (Object.prototype as any).isAdmin,
    hasPolluted: Object.prototype.hasOwnProperty('polluted'),
    pollutedValue: (Object.prototype as any).polluted,
    hasAdmin: Object.prototype.hasOwnProperty('admin'),
    adminValue: (Object.prototype as any).admin,
    hasIsOriginAllowed: Object.prototype.hasOwnProperty('isOriginAllowed'),
    isOriginAllowedValue: (Object.prototype as any).isOriginAllowed,
  };
  
  return {
    received: data,
    pollutionDetected,
    timestamp: Date.now(),
  };
}

// Action to check if prototype is polluted (for verification)
export async function checkPrototypePollution() {
  return {
    hasIsAdmin: Object.prototype.hasOwnProperty('isAdmin'),
    isAdminValue: (Object.prototype as any).isAdmin,
    hasPolluted: Object.prototype.hasOwnProperty('polluted'),
    pollutedValue: (Object.prototype as any).polluted,
    hasAdmin: Object.prototype.hasOwnProperty('admin'),
    adminValue: (Object.prototype as any).admin,
    hasIsOriginAllowed: Object.prototype.hasOwnProperty('isOriginAllowed'),
    isOriginAllowedValue: (Object.prototype as any).isOriginAllowed,
    timestamp: Date.now(),
  };
}

// Simple action for basic testing
export async function simpleAction(message: string) {
  return {
    message,
    timestamp: Date.now(),
  };
}
