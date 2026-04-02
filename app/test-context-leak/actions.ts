"use server";

/**
 * CONTEXT LEAKAGE TEST - Server Actions
 * 
 * These actions test if AsyncLocalStorage context leaks between requests
 * via waitUntil() background tasks or microtask queue timing.
 */

// Action that simulates slow background task
export async function slowBackgroundTask(delayMs: number, attackerId: string) {
  // Simulate slow operation that might escape request context
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  return {
    message: "Background task completed",
    attackerId,
    timestamp: Date.now(),
  };
}

// Action that checks current context state
export async function checkContextState() {
  // This reads from AsyncLocalStorage
  // If context leaked, this might show data from another request
  return {
    contextCheck: "completed",
    timestamp: Date.now(),
  };
}

// Action with waitUntil that might leak context
export async function actionWithWaitUntil(data: any) {
  // In Cloudflare Workers, ctx.waitUntil() runs after response
  // If this accesses ALS after next request starts = LEAK!
  
  const requestData = {
    receivedData: data,
    timestamp: Date.now(),
  };
  
  // Simulate background logging that might escape context
  setTimeout(() => {
    // This runs in microtask queue - might access wrong context!
    console.log("Background log:", requestData);
  }, 100);
  
  return requestData;
}

// Sensitive action (simulates user profile/login)
export async function sensitiveAction(authToken: string) {
  return {
    message: "Sensitive operation completed",
    authToken: authToken ? "[REDACTED]" : "none",
    timestamp: Date.now(),
  };
}
