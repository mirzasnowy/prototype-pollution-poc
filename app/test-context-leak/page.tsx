import { checkContextState, actionWithWaitUntil, sensitiveAction } from './actions';

export default function TestContextLeakPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Cross-Request Context Leakage Test</h1>
      <p style={{ background: '#ffcccc', padding: '1rem', borderRadius: '8px', border: '1px solid #ff0000' }}>
        <strong>⚠️ ADVANCED ZERO-DAY TEST:</strong> Tests if AsyncLocalStorage context leaks between requests
        via waitUntil() background tasks or microtask queue timing in warm V8 Isolates.
      </p>
      
      <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h2>Test Methodology</h2>
        <h3>The "Context Stealer" Attack</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>
            <strong>Step 1: Attacker sends slow request with background task</strong>
            <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
{`curl -X POST 'https://YOUR-WORKER.workers.dev/' \\
  -H 'x-rsc-action: actionWithWaitUntil' \\
  -H 'Content-Type: application/json' \\
  -d '{\"attackerId\":\"ATTACKER_001\"}'`}
            </pre>
          </li>
          <li>
            <strong>Step 2: Victim sends sensitive request immediately after</strong>
            <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
{`curl -X POST 'https://YOUR-WORKER.workers.dev/' \\
  -H 'x-rsc-action: sensitiveAction' \\
  -H 'Content-Type: application/json' \\
  -d '{\"authToken\":\"SECRET_VICTIM_TOKEN\"}'`}
            </pre>
          </li>
          <li>
            <strong>Step 3: Check if attacker's background task saw victim's data</strong>
            <br/>
            If context leaked, attacker's setTimeout callback might have accessed
            victim's auth token from the shared AsyncLocalStorage!
          </li>
        </ol>
        
        <h3>Concurrent Timing Attack</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
{`// Send 20 concurrent requests with unique IDs
for (let i = 0; i < 20; i++) {
  fetch('https://YOUR-WORKER.workers.dev/', {
    method: 'POST',
    headers: {
      'x-rsc-action': 'checkContextState',
      'Content-Type': 'application/json',
      'X-Request-ID': 'REQ_' + i,
      'Authorization': 'Bearer TOKEN_' + i,
    },
    body: JSON.stringify({ requestNum: i }),
  });
}

// Check server logs: Does any request show another request's token?
// If yes = CONTEXT LEAKAGE (CRITICAL!)`}
        </pre>
      </div>
      
      <div style={{ background: '#d1ecf1', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem', border: '1px solid #00acc1' }}>
        <h2>Expected Results</h2>
        <h3>If VULNERABLE (CRITICAL - CVSS 9.0+):</h3>
        <ul>
          <li>Attacker's background task accesses victim's auth token</li>
          <li>Concurrent requests show mixed context data</li>
          <li>AsyncLocalStorage not properly scoped per-request</li>
          <li><strong>Total Privacy Failure</strong> - users see each other's data</li>
        </ul>
        <h3>If SECURE:</h3>
        <ul>
          <li>Each request maintains isolated context</li>
          <li>Background tasks don't escape request scope</li>
          <li>AsyncLocalStorage properly boundaries per-request</li>
        </ul>
      </div>
      
      <div style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem', border: '1px solid #ffc107' }}>
        <h2>Why This Matters</h2>
        <p>
          vinext uses <strong>unified-request-context.ts</strong> with AsyncLocalStorage stored on <strong>globalThis</strong>.
          The code uses <strong>shallow clone</strong> for nested scopes, and array/map fields <strong>share references</strong>.
        </p>
        <p>
          In Cloudflare Workers, V8 Isolates are <strong>reused</strong> between requests (warm isolates).
          If a background task (via setTimeout, waitUntil, or microtask queue) runs AFTER the main request completes
          but BEFORE the ALS scope exits, it might access the NEXT request's context!
        </p>
        <ul>
          <li><strong>Root Cause:</strong> Shallow clone + reference sharing in runWithUnifiedStateMutation</li>
          <li><strong>Trigger:</strong> Background task timing that escapes request scope</li>
          <li><strong>Impact:</strong> Cross-request data leakage (headers, cookies, auth tokens)</li>
          <li><strong>Scope:</strong> ALL users in same data center / isolate pool</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
        <h2>Quick Test Actions</h2>
        <form action={checkContextState} style={{ marginBottom: '1rem' }}>
          <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}>
            Check Context State
          </button>
        </form>
        <form action={(formData) => actionWithWaitUntil({ test: "form-test" })} style={{ marginBottom: '1rem' }}>
          <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', background: '#fff3cd' }}>
            Test with waitUntil
          </button>
        </form>
        <form action={(formData) => sensitiveAction("test-token-" + Date.now())} style={{ marginBottom: '1rem' }}>
          <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', background: '#ffcccc' }}>
            Test Sensitive Action
          </button>
        </form>
      </div>
    </div>
  );
}
