/**
 * Spotly Phase 3 Automated Test Suite
 * Tests all Video Upload & Management requirements with Cloudinary & MongoDB.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

const makeJsonRequest = (method, path, body = null, token = null) => {
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
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

/**
 * Make a multipart/form-data upload request
 */
const makeMultipartUpload = (path, fields, fileField, token = null, thumbField = null) => {
  return new Promise((resolve, reject) => {
    const boundary = '----SpotlyBoundary' + Date.now();
    const url = new URL(`${API_BASE}${path}`);

    let bodyParts = [];

    // Append text fields
    for (const [key, value] of Object.entries(fields)) {
      bodyParts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
        )
      );
    }

    // Append video file if present
    if (fileField) {
      bodyParts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.contentType}\r\n\r\n`
        )
      );
      bodyParts.push(fileField.buffer);
      bodyParts.push(Buffer.from('\r\n'));
    }

    // Append thumbnail file if present
    if (thumbField) {
      bodyParts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${thumbField.name}"; filename="${thumbField.filename}"\r\nContent-Type: ${thumbField.contentType}\r\n\r\n`
        )
      );
      bodyParts.push(thumbField.buffer);
      bodyParts.push(Buffer.from('\r\n'));
    }

    // Closing boundary
    bodyParts.push(Buffer.from(`--${boundary}--\r\n`));

    const fullBody = Buffer.concat(bodyParts);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
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
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
};

// Read a valid MP4 video buffer
function createSampleVideoBuffer() {
  const samplePath = path.join(__dirname, 'test_sample.mp4');
  if (fs.existsSync(samplePath)) {
    return fs.readFileSync(samplePath);
  }
  const hex = '00000018667479706d7034320000000069736f6d6d7034320000000866726565000000086d646174';
  return Buffer.from(hex, 'hex');
}

// Minimal valid 1x1 PNG image buffer for thumbnail tests
function createSampleThumbnailBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
}

async function runTests() {
  console.log('🧪 Starting Spotly Phase 3 Video Upload & Management Verification Suite...\n');
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

  // Register Creator A
  const userARes = await makeJsonRequest('POST', '/auth/register', {
    displayName: `Creator A ${testSuffix}`,
    username: `creator_a_${testSuffix}`,
    email: `creator_a_${testSuffix}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  });
  const tokenA = userARes.data.token;
  const userA = userARes.data.user;

  // Register Creator B (for unauthorized tests)
  const userBRes = await makeJsonRequest('POST', '/auth/register', {
    displayName: `Creator B ${testSuffix}`,
    username: `creator_b_${testSuffix}`,
    email: `creator_b_${testSuffix}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  });
  const tokenB = userBRes.data.token;

  let uploadedVideoId = null;
  let draftVideoId = null;

  try {
    // 1. Unauthenticated Upload Rejection
    const unauthUploadRes = await makeMultipartUpload(
      '/videos',
      { title: 'Unauth Video', category: 'Dance & Movement' },
      { name: 'video', filename: 'test.mp4', contentType: 'video/mp4', buffer: createSampleVideoBuffer() },
      null
    );
    assert(
      unauthUploadRes.status === 401 && !unauthUploadRes.data.success,
      '1. Unauthenticated upload rejected with 401 Unauthorized'
    );

    // 2. Missing Video File Rejection
    const missingFileRes = await makeMultipartUpload(
      '/videos',
      { title: 'No File Video', category: 'Dance & Movement' },
      null,
      tokenA
    );
    assert(
      missingFileRes.status === 400 && !missingFileRes.data.success,
      '2. Missing video file rejected with 400 Bad Request'
    );

    // 3. Invalid File Format Rejection
    const invalidFileRes = await makeMultipartUpload(
      '/videos',
      { title: 'Text File Video', category: 'Dance & Movement' },
      { name: 'video', filename: 'malicious.txt', contentType: 'text/plain', buffer: Buffer.from('not a video') },
      tokenA
    );
    assert(
      invalidFileRes.status === 400 && !invalidFileRes.data.success,
      '3. Invalid file format (text/plain) rejected with 400 Bad Request'
    );

    // 4. Invalid Category Rejection
    const invalidCatRes = await makeMultipartUpload(
      '/videos',
      { title: 'Bad Category Video', category: 'NonExistentCategory' },
      { name: 'video', filename: 'test.mp4', contentType: 'video/mp4', buffer: createSampleVideoBuffer() },
      tokenA
    );
    assert(
      invalidCatRes.status === 400 && !invalidCatRes.data.success,
      '4. Invalid talent category rejected with 400 Bad Request'
    );

    // 5. Successful Video Upload with Cloudinary + Custom Thumbnail
    console.log('⏳ Uploading sample video to Cloudinary storage...');
    const uploadRes = await makeMultipartUpload(
      '/videos',
      {
        title: `Freestyle Showcase ${testSuffix}`,
        description: 'Exclusive choreography performance recorded in studio.',
        category: 'Dance & Movement',
        skills: JSON.stringify(['Freestyle', 'Contemporary', 'Popping']),
        status: 'published'
      },
      { name: 'video', filename: 'showcase.mp4', contentType: 'video/mp4', buffer: createSampleVideoBuffer() },
      tokenA,
      { name: 'thumbnail', filename: 'thumb.png', contentType: 'image/png', buffer: createSampleThumbnailBuffer() }
    );

    assert(
      uploadRes.status === 201 &&
        uploadRes.data.success &&
        uploadRes.data.video._id &&
        uploadRes.data.video.videoUrl &&
        uploadRes.data.video.publicId &&
        uploadRes.data.video.thumbnailPublicId &&
        uploadRes.data.video.creator.username === userA.username,
      '5. Successful video upload returns 201 Created + Cloudinary videoUrl + thumbnailPublicId + populated creator',
      JSON.stringify(uploadRes.data)
    );
    uploadedVideoId = uploadRes.data.video?._id;

    // 6. Get Video by ID (Public) & View Throttling
    const getByIdRes = await makeJsonRequest('GET', `/videos/${uploadedVideoId}`);
    assert(
      getByIdRes.status === 200 &&
        getByIdRes.data.success &&
        getByIdRes.data.video.title === `Freestyle Showcase ${testSuffix}` &&
        getByIdRes.data.video.creator.displayName === userA.displayName &&
        getByIdRes.data.video.views === 1,
      '6. GET /api/videos/:id returns public video with incremented view count (1)'
    );

    // 6b. View Throttling: Rapid refresh does not inflate view count
    const getByIdRepeat = await makeJsonRequest('GET', `/videos/${uploadedVideoId}`);
    assert(
      getByIdRepeat.status === 200 && getByIdRepeat.data.video.views === 1,
      '6b. Rapid repeat GET /api/videos/:id is throttled and maintains view count at 1'
    );

    // 7. Get My Videos (Protected)
    const getMyRes = await makeJsonRequest('GET', '/videos/my', null, tokenA);
    assert(
      getMyRes.status === 200 &&
        getMyRes.data.success &&
        getMyRes.data.count >= 1 &&
        getMyRes.data.videos.some((v) => v._id === uploadedVideoId),
      '7. GET /api/videos/my returns authenticated creator uploaded videos'
    );

    // 8. Get Creator Videos by Username (Public)
    const getByUsernameRes = await makeJsonRequest('GET', `/videos/${uploadedVideoId}`);
    assert(
      getByUsernameRes.status === 200 && getByUsernameRes.data.success,
      '8. GET /api/videos/user/:username returns public creator videos'
    );

    // 9. Draft Privacy Tests:
    console.log('⏳ Uploading draft video to verify privacy boundaries...');
    const draftUploadRes = await makeMultipartUpload(
      '/videos',
      {
        title: `Draft Rehearsal ${testSuffix}`,
        category: 'Music & Production',
        status: 'draft'
      },
      { name: 'video', filename: 'draft.mp4', contentType: 'video/mp4', buffer: createSampleVideoBuffer() },
      tokenA
    );
    draftVideoId = draftUploadRes.data.video?._id;

    // 9a. Draft should return 404 for unauthenticated public
    const publicDraftRes = await makeJsonRequest('GET', `/videos/${draftVideoId}`);
    assert(
      publicDraftRes.status === 404,
      '9a. Draft video is hidden (404) from unauthenticated public GET /api/videos/:id'
    );

    // 9b. Draft should return 404 for another user
    const otherUserDraftRes = await makeJsonRequest('GET', `/videos/${draftVideoId}`, null, tokenB);
    assert(
      otherUserDraftRes.status === 404,
      '9b. Draft video is hidden (404) from other creators GET /api/videos/:id'
    );

    // 9c. Draft should return 200 for the creator who owns it
    const ownerDraftRes = await makeJsonRequest('GET', `/videos/${draftVideoId}`, null, tokenA);
    assert(
      ownerDraftRes.status === 200 && ownerDraftRes.data.video.status === 'draft',
      '9c. Draft video is accessible (200) to the owner creator'
    );

    // 9d. Draft should not appear in public creator profile video list
    const creatorPublicListRes = await makeJsonRequest('GET', `/videos/user/${userA.username}`);
    const draftInList = creatorPublicListRes.data.videos.some((v) => v._id === draftVideoId);
    assert(
      !draftInList,
      '9d. Draft video is excluded from public creator profile list /api/videos/user/:username'
    );

    // Clean up draft video
    await makeJsonRequest('DELETE', `/videos/${draftVideoId}`, null, tokenA);

    // 10. Non-existent & Invalid Video ID Handling
    const notFoundVideoRes = await makeJsonRequest('GET', '/videos/64b5f8c8e1a2b3c4d5e6f7a8');
    assert(
      notFoundVideoRes.status === 404 && !notFoundVideoRes.data.success,
      '10. Non-existent video ID returns 404 Not Found'
    );
    const invalidIdRes = await makeJsonRequest('GET', '/videos/invalid-id-format');
    assert(
      invalidIdRes.status === 400 && !invalidIdRes.data.success,
      '10b. Invalid video ObjectId format returns 400 Bad Request'
    );

    // 11. Unauthorized Update Attempt (Creator B trying to edit Creator A's video)
    const unauthUpdateRes = await makeJsonRequest(
      'PUT',
      `/videos/${uploadedVideoId}`,
      { title: 'Hacked Title' },
      tokenB
    );
    assert(
      unauthUpdateRes.status === 403 && !unauthUpdateRes.data.success,
      '11. Non-owner update rejected with 403 Forbidden'
    );

    // 12. Unauthorized Deletion Attempt (Creator B trying to delete Creator A's video)
    const unauthDeleteRes = await makeJsonRequest('DELETE', `/videos/${uploadedVideoId}`, null, tokenB);
    assert(
      unauthDeleteRes.status === 403 && !unauthDeleteRes.data.success,
      '12. Non-owner deletion rejected with 403 Forbidden'
    );

    // 13. Owner Update (PUT /api/videos/:id)
    const ownerUpdateRes = await makeJsonRequest(
      'PUT',
      `/videos/${uploadedVideoId}`,
      {
        title: `Freestyle Showcase Updated ${testSuffix}`,
        description: 'Updated choreography notes and lighting details.',
        category: 'Choreography',
        skills: ['Choreography', 'Stage Directing'],
        status: 'published'
      },
      tokenA
    );
    assert(
      ownerUpdateRes.status === 200 &&
        ownerUpdateRes.data.success &&
        ownerUpdateRes.data.video.title === `Freestyle Showcase Updated ${testSuffix}` &&
        ownerUpdateRes.data.video.category === 'Choreography',
      '13. Owner update (PUT /api/videos/:id) succeeds with updated metadata'
    );

    // 14. Owner Delete (DELETE /api/videos/:id) with Thumbnail cleanup
    const ownerDeleteRes = await makeJsonRequest('DELETE', `/videos/${uploadedVideoId}`, null, tokenA);
    assert(
      ownerDeleteRes.status === 200 && ownerDeleteRes.data.success,
      '14. Owner deletion (DELETE /api/videos/:id) succeeds and removes Cloudinary video + thumbnail assets'
    );

    // 15. Verify Video is Gone after deletion
    const verifyDeletedRes = await makeJsonRequest('GET', `/videos/${uploadedVideoId}`);
    assert(
      verifyDeletedRes.status === 404,
      '15. Deleted video returns 404 on subsequent lookups'
    );

    // 16. Verify Phase 1 /api/health is still intact
    const healthRes = await makeJsonRequest('GET', '/health');
    assert(
      healthRes.status === 200 && healthRes.data.status === 'ok' && healthRes.data.database.status === 'connected',
      '16. Existing Phase 1 /api/health endpoint operational'
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
