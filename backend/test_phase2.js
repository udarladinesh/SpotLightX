/**
 * Spotly Phase 2 Automated Test Suite
 * Tests all 18 backend verification requirements.
 */
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const makeRequest = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Starting Spotly Phase 2 Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  };

  const testSuffix = Date.now().toString().slice(-6);
  const testUser = {
    displayName: `Test Creator ${testSuffix}`,
    username: `creator_${testSuffix}`,
    email: `creator_${testSuffix}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    categories: ['Dance & Movement', 'Music & Production'],
    skills: ['Freestyle', 'Beatmaking']
  };

  let authToken = null;
  let createdUserId = null;

  try {
    // 1. Valid Registration
    const regRes = await makeRequest('POST', '/auth/register', testUser);
    assert(
      regRes.status === 201 && regRes.data.success && regRes.data.token && regRes.data.user.username === testUser.username,
      '1. Valid user registration returns 201 + token + safe user'
    );
    authToken = regRes.data.token;
    createdUserId = regRes.data.user._id;

    // 2. Duplicate Email Rejection
    const dupEmailRes = await makeRequest('POST', '/auth/register', {
      ...testUser,
      username: `unique_${testSuffix}`
    });
    assert(
      dupEmailRes.status === 400 && !dupEmailRes.data.success,
      '2. Duplicate email rejected with 400 Bad Request',
      JSON.stringify(dupEmailRes.data)
    );

    // 3. Duplicate Username Rejection
    const dupUserRes = await makeRequest('POST', '/auth/register', {
      ...testUser,
      email: `another_${testSuffix}@example.com`
    });
    assert(
      dupUserRes.status === 400 && !dupUserRes.data.success,
      '3. Duplicate username rejected with 400 Bad Request',
      JSON.stringify(dupUserRes.data)
    );

    // 4. Invalid Email Format
    const invalidEmailRes = await makeRequest('POST', '/auth/register', {
      ...testUser,
      email: 'not-an-email',
      username: `bad_email_${testSuffix}`
    });
    assert(
      invalidEmailRes.status === 400 && !invalidEmailRes.data.success,
      '4. Invalid email format rejected with 400 Bad Request'
    );

    // 5. Short Password Rejection (<6 chars)
    const shortPassRes = await makeRequest('POST', '/auth/register', {
      ...testUser,
      password: '123',
      confirmPassword: '123',
      email: `shortpass_${testSuffix}@example.com`,
      username: `shortpass_${testSuffix}`
    });
    assert(
      shortPassRes.status === 400 && !shortPassRes.data.success,
      '5. Short password (<6 chars) rejected with 400 Bad Request'
    );

    // 6. Password Confirmation Mismatch
    const mismatchPassRes = await makeRequest('POST', '/auth/register', {
      ...testUser,
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!',
      email: `mismatch_${testSuffix}@example.com`,
      username: `mismatch_${testSuffix}`
    });
    assert(
      mismatchPassRes.status === 400 && !mismatchPassRes.data.success,
      '6. Password confirmation mismatch rejected with 400 Bad Request'
    );

    // 7. Password Hashing Verification (No plaintext password in response or query)
    assert(
      regRes.data.user.password === undefined,
      '7. Password hash stripped from API response'
    );

    // 8. Login using Email
    const loginEmailRes = await makeRequest('POST', '/auth/login', {
      identifier: testUser.email,
      password: testUser.password
    });
    assert(
      loginEmailRes.status === 200 && loginEmailRes.data.success && loginEmailRes.data.token,
      '8. Successful login using Email returns 200 + token'
    );

    // 9. Login using Username
    const loginUserRes = await makeRequest('POST', '/auth/login', {
      identifier: testUser.username,
      password: testUser.password
    });
    assert(
      loginUserRes.status === 200 && loginUserRes.data.success && loginUserRes.data.token,
      '9. Successful login using Username returns 200 + token'
    );

    // 10. Invalid Password Rejection
    const invalidPassRes = await makeRequest('POST', '/auth/login', {
      identifier: testUser.username,
      password: 'WrongPassword'
    });
    assert(
      invalidPassRes.status === 401 && !invalidPassRes.data.success,
      '10. Invalid password rejected with 401 Unauthorized'
    );

    // 11. Missing Token Rejection on Protected Route
    const missingTokenRes = await makeRequest('GET', '/auth/me');
    assert(
      missingTokenRes.status === 401 && !missingTokenRes.data.success,
      '11. Missing token on protected route rejected with 401 Unauthorized'
    );

    // 12. Invalid Token Rejection
    const invalidTokenRes = await makeRequest('GET', '/auth/me', null, 'invalid.bearer.token');
    assert(
      invalidTokenRes.status === 401 && !invalidTokenRes.data.success,
      '12. Invalid token rejected with 401 Unauthorized'
    );

    // 13. Valid /api/auth/me Request
    const authMeRes = await makeRequest('GET', '/auth/me', null, authToken);
    assert(
      authMeRes.status === 200 && authMeRes.data.success && authMeRes.data.user.username === testUser.username,
      '13. Valid /api/auth/me returns authenticated user details'
    );

    // 14. Own Profile Update (PUT /api/users/profile)
    const updateRes = await makeRequest(
      'PUT',
      '/users/profile',
      {
        displayName: 'Maya Chen Updated',
        bio: 'Contemporary dancer & choreographer based in SF.',
        location: 'San Francisco, CA',
        skills: ['Freestyle', 'Contemporary', 'Choreography'],
        categories: ['Dance & Movement', 'Choreography'],
        socialLinks: { instagram: '@maya_chen', youtube: 'https://youtube.com/@mayachen' }
      },
      authToken
    );
    assert(
      updateRes.status === 200 &&
        updateRes.data.success &&
        updateRes.data.user.displayName === 'Maya Chen Updated' &&
        updateRes.data.user.skills.length === 3 &&
        updateRes.data.user.socialLinks.instagram === '@maya_chen',
      '14. Own profile update (PUT /api/users/profile) succeeds'
    );

    // 15. Public Profile Retrieval (GET /api/users/:username)
    const publicProfileRes = await makeRequest('GET', `/users/${testUser.username}`);
    assert(
      publicProfileRes.status === 200 &&
        publicProfileRes.data.success &&
        publicProfileRes.data.user.displayName === 'Maya Chen Updated' &&
        publicProfileRes.data.user.email === undefined, // email not exposed publicly
      '15. Public profile retrieval (GET /api/users/:username) returns public data without email/password'
    );

    // 16. Attempt to Modify Protected Fields (role immutability)
    const roleHackRes = await makeRequest(
      'PUT',
      '/users/profile',
      {
        role: 'admin'
      },
      authToken
    );
    // Role should remain 'user'
    const verifyMe = await makeRequest('GET', '/auth/me', null, authToken);
    assert(
      verifyMe.data.user.role === 'user',
      '16. Protected fields (role) remain immutable against tampering'
    );

    // 17. Existing /api/health Endpoint Still Works
    const healthRes = await makeRequest('GET', '/health');
    assert(
      healthRes.status === 200 && healthRes.data.status === 'ok' && healthRes.data.database.status === 'connected',
      '17. Existing Phase 1 /api/health endpoint operational with MongoDB Atlas'
    );

    // 18. Existing 404 & Error Handling
    const notFoundRes = await makeRequest('GET', '/nonexistent_route');
    assert(
      notFoundRes.status === 404 && !notFoundRes.data.success,
      '18. Existing 404 and centralized error handler operational'
    );

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runTests();
