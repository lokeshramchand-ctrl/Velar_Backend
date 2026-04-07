const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../src/.env'), quiet: true });

const connectDB = require('../src/config/db');
const app = require('../src/app');

const results = [];

function makeUrl(baseUrl, route, query) {
  const url = new URL(route, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function request(baseUrl, method, route, options = {}) {
  const response = await fetch(makeUrl(baseUrl, route, options.query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  return {
    status: response.status,
    ok: response.ok,
    body: await parseResponse(response),
  };
}

function summarizeBody(body) {
  if (body === null || body === undefined) return 'no body';
  if (typeof body === 'string') return body;

  const json = JSON.stringify(body);
  return json.length > 200 ? `${json.slice(0, 197)}...` : json;
}

async function runTest(name, executor) {
  try {
    const details = await executor();
    results.push({ name, status: 'PASS', details });
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      details: error.message,
    });
  }
}

function assertStatus(response, expectedStatuses, context) {
  const statuses = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  if (!statuses.includes(response.status)) {
    throw new Error(
      `${context} expected status ${statuses.join(' or ')}, got ${response.status}. Response: ${summarizeBody(response.body)}`
    );
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function startServer() {
  await connectDB();

  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });

    server.on('error', reject);
  });
}

function printReport(baseUrl, emailUnderTest) {
  const passed = results.filter((result) => result.status === 'PASS').length;
  const failed = results.length - passed;

  console.log('\nAPI smoke test report');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Test user: ${emailUnderTest}`);
  console.log('');

  for (const result of results) {
    console.log(`[${result.status}] ${result.name}`);
    console.log(`  ${result.details}`);
  }

  console.log('');
  console.log(`Summary: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log('');
  console.log('Notes:');
  console.log('- Queue-based transaction endpoints only confirm the API accepted the job. They do not prove a worker consumed and saved the transaction.');
  console.log('- /auth/google/token is skipped here because it needs a real Google ID token.');
  console.log('- src/routes/syncRoutes.js exists, but it is not mounted in src/app.js, so it is not reachable as an API endpoint right now.');
}

async function main() {
  let server = null;
  let baseUrl = process.env.API_TEST_BASE_URL;

  if (baseUrl) {
    baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  } else {
    const started = await startServer();
    server = started.server;
    baseUrl = started.baseUrl;
  }

  const email = `api-smoke-${Date.now()}@example.com`;
  const password = 'SmokeTest123!';
  const displayName = 'API Smoke User';

  let token;
  let userId;

  try {
    await runTest('POST /auth/register rejects missing email/password', async () => {
      const response = await request(baseUrl, 'POST', '/auth/register', {
        body: { displayName: 'Missing Fields' },
      });

      assertStatus(response, 400, 'register missing fields');
      return summarizeBody(response.body);
    });

    await runTest('POST /auth/login rejects missing email/password', async () => {
      const response = await request(baseUrl, 'POST', '/auth/login', {
        body: { email },
      });

      assertStatus(response, 400, 'login missing fields');
      return summarizeBody(response.body);
    });

    await runTest('GET /auth/me rejects missing bearer token', async () => {
      const response = await request(baseUrl, 'GET', '/auth/me');

      assertStatus(response, 401, 'auth me without token');
      return summarizeBody(response.body);
    });

    await runTest('POST /auth/register creates a fresh user in an empty DB', async () => {
      const response = await request(baseUrl, 'POST', '/auth/register', {
        body: { displayName, email, password },
      });

      assertStatus(response, 201, 'register fresh user');
      assert(response.body && response.body.success === true, 'register did not return success=true');
      assert(response.body.token, 'register did not return a token');
      assert(response.body.user && response.body.user.id, 'register did not return a user id');

      token = response.body.token;
      userId = response.body.user.id;

      return `created userId=${userId}`;
    });

    await runTest('POST /auth/register rejects duplicate email', async () => {
      const response = await request(baseUrl, 'POST', '/auth/register', {
        body: { displayName, email, password },
      });

      assertStatus(response, 409, 'duplicate register');
      return summarizeBody(response.body);
    });

    await runTest('POST /auth/login rejects wrong password', async () => {
      const response = await request(baseUrl, 'POST', '/auth/login', {
        body: { email, password: 'WrongPass123!' },
      });

      assertStatus(response, 401, 'login wrong password');
      return summarizeBody(response.body);
    });

    await runTest('POST /auth/login succeeds for the new user', async () => {
      const response = await request(baseUrl, 'POST', '/auth/login', {
        body: { email, password },
      });

      assertStatus(response, 200, 'login valid user');
      assert(response.body && response.body.success === true, 'login did not return success=true');
      assert(response.body.token, 'login did not return a token');

      token = response.body.token;
      return `token returned for userId=${response.body.user && response.body.user.id}`;
    });

    await runTest('GET /auth/me returns the logged-in user', async () => {
      const response = await request(baseUrl, 'GET', '/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      assertStatus(response, 200, 'auth me with token');
      assert(response.body && response.body.success === true, 'auth me did not return success=true');
      assert(response.body.user && response.body.user.id === userId, 'auth me returned the wrong user');

      return summarizeBody(response.body.user);
    });

    await runTest('POST /auth/logout returns success', async () => {
      const response = await request(baseUrl, 'POST', '/auth/logout');

      assertStatus(response, 200, 'logout');
      assert(response.body && response.body.success === true, 'logout did not return success=true');
      return summarizeBody(response.body);
    });

    await runTest('GET /api/transactions rejects missing userId', async () => {
      const response = await request(baseUrl, 'GET', '/api/transactions');

      assertStatus(response, 400, 'transactions list without userId');
      return summarizeBody(response.body);
    });

    await runTest('GET /api/transactions returns an empty list for a fresh user', async () => {
      const response = await request(baseUrl, 'GET', '/api/transactions', {
        query: { userId },
      });

      assertStatus(response, 200, 'transactions list');
      assert(Array.isArray(response.body && response.body.data), 'transactions list did not return data array');
      assert(response.body.data.length === 0, 'fresh user transaction list was not empty');

      return '0 transactions returned';
    });

    await runTest('GET /api/transactions/recent rejects missing userId', async () => {
      const response = await request(baseUrl, 'GET', '/api/transactions/recent');

      assertStatus(response, 400, 'recent transactions without userId');
      return summarizeBody(response.body);
    });

    await runTest('GET /api/transactions/recent returns empty for a fresh user', async () => {
      const response = await request(baseUrl, 'GET', '/api/transactions/recent', {
        query: { userId },
      });

      assertStatus(response, 200, 'recent transactions');
      assert(Array.isArray(response.body && response.body.data), 'recent transactions did not return data array');
      assert(response.body.data.length === 0, 'fresh user recent transactions were not empty');

      return '0 recent transactions returned';
    });

    await runTest('POST /api/transactions/add rejects missing userId', async () => {
      const response = await request(baseUrl, 'POST', '/api/transactions/add', {
        body: { description: 'Coffee', amount: 5.25 },
      });

      assertStatus(response, 400, 'add transaction without userId');
      return summarizeBody(response.body);
    });

    await runTest('POST /api/transactions/add accepts a manual transaction job', async () => {
      const response = await request(baseUrl, 'POST', '/api/transactions/add', {
        body: { description: 'Coffee', amount: 5.25, userId },
      });

      assertStatus(response, 200, 'add transaction');
      return summarizeBody(response.body);
    });

    await runTest('POST /api/transactions/voice rejects missing voiceInput', async () => {
      const response = await request(baseUrl, 'POST', '/api/transactions/voice', {
        body: { userId },
      });

      assertStatus(response, 400, 'voice transaction without voiceInput');
      return summarizeBody(response.body);
    });

    await runTest('POST /api/transactions/voice rejects missing userId', async () => {
      const response = await request(baseUrl, 'POST', '/api/transactions/voice', {
        body: { voiceInput: 'Spent 12 dollars on lunch' },
      });

      assertStatus(response, 400, 'voice transaction without userId');
      return summarizeBody(response.body);
    });

    await runTest('POST /api/transactions/voice accepts a voice transaction job', async () => {
      const response = await request(baseUrl, 'POST', '/api/transactions/voice', {
        body: { voiceInput: 'Spent 12 dollars on lunch', userId },
      });

      assertStatus(response, 200, 'voice transaction');
      return summarizeBody(response.body);
    });

    await runTest('POST /api/transactions/email rejects missing accessToken', async () => {
      const response = await request(baseUrl, 'POST', '/api/transactions/email', {
        body: { userId },
      });

      assertStatus(response, 400, 'email sync without access token');
      return summarizeBody(response.body);
    });

    await runTest('POST /api/transactions/email rejects missing userId', async () => {
      const response = await request(baseUrl, 'POST', '/api/transactions/email', {
        body: { accessToken: 'fake-token' },
      });

      assertStatus(response, 400, 'email sync without userId');
      return summarizeBody(response.body);
    });

    await runTest('POST /api/transactions/email surfaces Gmail/auth errors for an invalid token', async () => {
      const response = await request(baseUrl, 'POST', '/api/transactions/email', {
        body: { accessToken: 'fake-token', userId },
      });

      assertStatus(response, 500, 'email sync with invalid token');
      return summarizeBody(response.body);
    });

    await runTest('GET /api/transactions still returns an array after queue-based requests', async () => {
      const response = await request(baseUrl, 'GET', '/api/transactions', {
        query: { userId },
      });

      assertStatus(response, 200, 'transactions list after queue calls');
      assert(Array.isArray(response.body && response.body.data), 'transactions list after queue calls did not return data array');

      return `${response.body.data.length} transactions currently stored`;
    });
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    printReport(baseUrl, email);
  }

  const failed = results.some((result) => result.status === 'FAIL');
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error('Smoke test runner failed to start:', error.message);
  console.error('Make sure MSSQL is reachable, or point the runner at an existing API with API_TEST_BASE_URL=http://localhost:3000');
  process.exit(1);
});
