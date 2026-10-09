/**
 * Spotly Phase 6 Automated Test Suite
 * Tests all Search & Talent Discovery requirements:
 * 1. Video search returns matching published videos
 * 2. Video search is case-insensitive
 * 3. Video search strictly excludes draft videos
 * 4. Video search supports category filtering
 * 5. Video search supports skill filtering
 * 6. Video search supports combined filters (q + category + skill)
 * 7. Creator search returns matching public profiles
 * 8. Creator search strictly excludes private fields (password, email, etc.)
 * 9. Creator search supports category filtering
 * 10. Creator search supports skill filtering
 * 11. Pagination returns accurate metadata (page, limit, total, totalPages, hasNextPage)
 * 12. Page 2 returns distinct results
 * 13. Invalid page and limit values are handled safely
 * 14. Invalid category values are rejected safely with 400 Bad Request
 * 15. Empty search input handled safely
 * 16. Search input cannot inject an uncontrolled regex (ReDoS safe)
 * 17. Video search enriches social stats (likeCount, commentCount, isLiked, isSaved)
 * 18. Creator search enriches creator metrics (followerCount, followingCount, videoCount, isFollowing)
 * 19. Existing Phase 1-5 functionality (/api/health, /api/discover, /api/videos) remains intact
 */
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./server');
const User = require('./src/models/User');
const Video = require('./src/models/Video');
const Like = require('./src/models/Like');
const Comment = require('./src/models/Comment');
const Save = require('./src/models/Save');
const Follow = require('./src/models/Follow');

let API_BASE = '';
let serverInstance = null;

const makeRequest = (method, endpoint, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
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

function startTestServer() {
  return new Promise((resolve, reject) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port;
      API_BASE = `http://127.0.0.1:${port}/api`;
      console.log(`📡 In-process test server listening on port ${port} (API: ${API_BASE})`);
      resolve();
    });
    serverInstance.on('error', reject);
  });
}

async function waitForDB() {
  for (let i = 0; i < 40; i++) {
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Timeout waiting for MongoDB connection.');
}

async function runTests() {
  console.log('🧪 Starting Spotly Phase 6 Search & Talent Discovery Test Suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (details) console.error(`   Details: ${details}`);
      failed++;
    }
  };

  const testSuffix = Date.now().toString().slice(-6);
  const user1Email = `search_creator1_${testSuffix}@spotlytest.com`;
  const user2Email = `search_creator2_${testSuffix}@spotlytest.com`;
  const user3Email = `search_viewer_${testSuffix}@spotlytest.com`;

  let token1, token2, token3;
  let user1Id, user2Id, user3Id;
  let video1Id, video2Id, video3Id, draftVideoId;

  try {
    await startTestServer();
    await waitForDB();

    console.log('📦 Setting up test users and test showcases for search verification...');

    // 1. Create Creator 1 (Dance specialist)
    const reg1 = await makeRequest('POST', '/auth/register', {
      displayName: `Elena Rostova ${testSuffix}`,
      username: `elena_dance_${testSuffix}`,
      email: user1Email,
      password: 'password123',
      categories: ['Dance & Movement', 'Choreography'],
      skills: ['contemporary-dance', 'popping', 'choreography']
    });
    token1 = reg1.data?.token;
    user1Id = reg1.data?.user?._id;

    // Set bio & location on Creator 1
    await makeRequest('PUT', '/users/profile', {
      bio: 'Professional contemporary dancer and popping choreographer based in Berlin.',
      location: 'Berlin, Germany'
    }, token1);

    // 2. Create Creator 2 (Tech & Music specialist)
    const reg2 = await makeRequest('POST', '/auth/register', {
      displayName: `Marcus Vance ${testSuffix}`,
      username: `marcus_beats_${testSuffix}`,
      email: user2Email,
      password: 'password123',
      categories: ['Music & Production', 'Tech & Programming'],
      skills: ['synthesizer', 'audio-mastering', 'creative-coding']
    });
    token2 = reg2.data?.token;
    user2Id = reg2.data?.user?._id;

    // Set bio & location on Creator 2
    await makeRequest('PUT', '/users/profile', {
      bio: 'Electronic music producer and Web3 creative coder from London.',
      location: 'London, UK'
    }, token2);

    // 3. Create Viewer / Fan User
    const reg3 = await makeRequest('POST', '/auth/register', {
      displayName: `Viewer Sam ${testSuffix}`,
      username: `sam_scout_${testSuffix}`,
      email: user3Email,
      password: 'password123',
      categories: ['Dance & Movement'],
      skills: ['talent-scouting']
    });
    token3 = reg3.data?.token;
    user3Id = reg3.data?.user?._id;

    // Create Published Video 1 by Creator 1 (Contemporary Hip Hop Showcase)
    const v1 = await Video.create({
      title: `Electrifying Contemporary Hip Hop Routine ${testSuffix}`,
      description: 'An original street-style contemporary choreography recorded in Berlin Studio.',
      videoUrl: 'https://res.cloudinary.com/spotly/video/upload/sample1.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/spotly/image/upload/sample1.jpg',
      publicId: `spotly_test/video_search_1_${testSuffix}`,
      creator: user1Id,
      category: 'Dance & Movement',
      skills: ['contemporary-dance', 'hip-hop', 'freestyle'],
      duration: 145,
      views: 120,
      status: 'published'
    });
    video1Id = v1._id;

    // Create Published Video 2 by Creator 2 (Cyberpunk Synthwave Beat)
    const v2 = await Video.create({
      title: `Cyberpunk Synthwave Modular Live Session ${testSuffix}`,
      description: 'Hardware synthesizer jam exploring analog warmth and retro wave beats.',
      videoUrl: 'https://res.cloudinary.com/spotly/video/upload/sample2.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/spotly/image/upload/sample2.jpg',
      publicId: `spotly_test/video_search_2_${testSuffix}`,
      creator: user2Id,
      category: 'Music & Production',
      skills: ['synthesizer', 'beatmaking', 'analog-gear'],
      duration: 210,
      views: 340,
      status: 'published'
    });
    video2Id = v2._id;

    // Create Published Video 3 by Creator 1 (Solo Popping Routine)
    const v3 = await Video.create({
      title: `Robotic Popping & Animation Technique ${testSuffix}`,
      description: 'Advanced illusion popping drills and wave mechanics.',
      videoUrl: 'https://res.cloudinary.com/spotly/video/upload/sample3.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/spotly/image/upload/sample3.jpg',
      publicId: `spotly_test/video_search_3_${testSuffix}`,
      creator: user1Id,
      category: 'Dance & Movement',
      skills: ['popping', 'robot-dance', 'animation'],
      duration: 90,
      views: 85,
      status: 'published'
    });
    video3Id = v3._id;

    // Create DRAFT Video by Creator 1 (Must NEVER appear in search results)
    const vDraft = await Video.create({
      title: `Secret Unreleased Dance Rehearsal ${testSuffix}`,
      description: 'Private draft practice session for dance competition.',
      videoUrl: 'https://res.cloudinary.com/spotly/video/upload/sample_draft.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/spotly/image/upload/sample_draft.jpg',
      publicId: `spotly_test/video_search_draft_${testSuffix}`,
      creator: user1Id,
      category: 'Dance & Movement',
      skills: ['contemporary-dance', 'secret-practice'],
      duration: 60,
      views: 0,
      status: 'draft'
    });
    draftVideoId = vDraft._id;

    // Add social interactions: Viewer likes and saves Video 1, adds comment to Video 1, follows Creator 1
    await Like.create({ user: user3Id, video: video1Id });
    await Save.create({ user: user3Id, video: video1Id });
    await Comment.create({ user: user3Id, video: video1Id, text: 'Incredible movement quality!' });
    await Follow.create({ follower: user3Id, following: user1Id });

    console.log('Setup complete. Running Phase 6 Search tests...\n');

    // ==========================================
    // TEST SECTION A: VIDEO SEARCH
    // ==========================================

    // 1. Basic video search matching title
    const res1 = await makeRequest('GET', `/search/videos?q=Contemporary%20Hip%20Hop`);
    assert(
      res1.status === 200 && res1.data.success && res1.data.videos.some((v) => v._id.toString() === video1Id.toString()),
      '1. Video search returns matching published videos by title',
      JSON.stringify(res1.data)
    );

    // 2. Case-insensitivity test (search uppercase "CYBERPUNK SYNTHWAVE")
    const res2 = await makeRequest('GET', `/search/videos?q=CYBERPUNK%20SYNTHWAVE`);
    assert(
      res2.status === 200 && res2.data.videos.some((v) => v._id.toString() === video2Id.toString()),
      '2. Video search is case-insensitive',
      JSON.stringify(res2.data)
    );

    // 3. Exclude draft videos
    const res3 = await makeRequest('GET', `/search/videos?q=Secret%20Unreleased%20${testSuffix}`);
    assert(
      res3.status === 200 && !res3.data.videos.some((v) => v._id.toString() === draftVideoId.toString()) && res3.data.total === 0,
      '3. Video search strictly excludes draft videos',
      JSON.stringify(res3.data)
    );

    // 4. Video search by category only
    const res4 = await makeRequest('GET', `/search/videos?category=Music%20%26%20Production&q=${testSuffix}`);
    assert(
      res4.status === 200 &&
      res4.data.videos.every((v) => v.category === 'Music & Production') &&
      res4.data.videos.some((v) => v._id.toString() === video2Id.toString()),
      '4. Video search supports category filtering',
      JSON.stringify(res4.data)
    );

    // 5. Video search by skill only
    const res5 = await makeRequest('GET', `/search/videos?skill=popping&q=${testSuffix}`);
    assert(
      res5.status === 200 &&
      res5.data.videos.some((v) => v._id.toString() === video3Id.toString()) &&
      !res5.data.videos.some((v) => v._id.toString() === video2Id.toString()),
      '5. Video search supports skill filtering',
      JSON.stringify(res5.data)
    );

    // 6. Combined filter: q + category + skill
    const res6 = await makeRequest(
      'GET',
      `/search/videos?q=Routine&category=Dance%20%26%20Movement&skill=hip-hop`
    );
    assert(
      res6.status === 200 &&
      res6.data.videos.some((v) => v._id.toString() === video1Id.toString()),
      '6. Video search supports combined filters (q + category + skill)',
      JSON.stringify(res6.data)
    );

    // 7. Video search enriches social stats (likeCount, commentCount, isLiked, isSaved)
    const res7 = await makeRequest('GET', `/search/videos?q=${testSuffix}`, null, token3);
    const enrichedV1 = res7.data.videos.find((v) => v._id.toString() === video1Id.toString());
    assert(
      enrichedV1 &&
      enrichedV1.likeCount >= 1 &&
      enrichedV1.commentCount >= 1 &&
      enrichedV1.isLiked === true &&
      enrichedV1.isSaved === true,
      '7. Video search enriches likeCount, commentCount, isLiked, and isSaved for authenticated requests',
      JSON.stringify(enrichedV1)
    );

    // ==========================================
    // TEST SECTION B: CREATOR SEARCH
    // ==========================================

    // 8. Creator search matching username and displayName
    const res8 = await makeRequest('GET', `/search/creators?q=Elena%20Rostova%20${testSuffix}`);
    assert(
      res8.status === 200 &&
      res8.data.success &&
      res8.data.creators.some((c) => c._id.toString() === user1Id.toString()),
      '8. Creator search returns matching public profile by display name',
      JSON.stringify(res8.data)
    );

    // 9. Creator search by bio keyword & location
    const res9 = await makeRequest('GET', `/search/creators?q=London`);
    assert(
      res9.status === 200 &&
      res9.data.creators.some((c) => c._id.toString() === user2Id.toString()),
      '9. Creator search matches keywords in location/bio',
      JSON.stringify(res9.data)
    );

    assert(
      res9.status === 200 &&
      res9.data.creators.some((c) => c._id.toString() === user2Id.toString()),
      '9. Creator search matches keywords in location/bio',
      JSON.stringify(res9.data)
    );

    // 10. Creator search strictly excludes sensitive fields (password, email, etc.)
    const sampleCreator = res8.data.creators[0];
    assert(
      sampleCreator &&
      sampleCreator.password === undefined &&
      sampleCreator.email === undefined &&
      sampleCreator.username !== undefined &&
      sampleCreator.displayName !== undefined,
      '10. Creator search strictly excludes private and authentication fields',
      JSON.stringify(sampleCreator)
    );

    // 11. Creator search by category
    const res11 = await makeRequest('GET', `/search/creators?category=Tech%20%26%20Programming&q=${testSuffix}`);
    assert(
      res11.status === 200 &&
      res11.data.creators.some((c) => c._id.toString() === user2Id.toString()) &&
      !res11.data.creators.some((c) => c._id.toString() === user1Id.toString()),
      '11. Creator search supports category filtering',
      JSON.stringify(res11.data)
    );

    // 12. Creator search by skill
    const res12 = await makeRequest('GET', `/search/creators?skill=contemporary-dance&q=${testSuffix}`);
    assert(
      res12.status === 200 &&
      res12.data.creators.some((c) => c._id.toString() === user1Id.toString()),
      '12. Creator search supports skill filtering',
      JSON.stringify(res12.data)
    );

    // 13. Creator search enriches metrics (followerCount, followingCount, videoCount, isFollowing)
    const res13 = await makeRequest('GET', `/search/creators?q=elena_dance_${testSuffix}`, null, token3);
    const enrichedC1 = res13.data.creators.find((c) => c._id.toString() === user1Id.toString());
    assert(
      enrichedC1 &&
      enrichedC1.followerCount >= 1 &&
      enrichedC1.videoCount >= 2 && // 2 published videos
      enrichedC1.isFollowing === true,
      '13. Creator search enriches followerCount, videoCount (published only), and isFollowing flag',
      JSON.stringify(enrichedC1)
    );

    // ==========================================
    // TEST SECTION C: PAGINATION & EDGE CASES
    // ==========================================

    // 14. Pagination metadata format
    const res14 = await makeRequest('GET', `/search/videos?q=${testSuffix}&page=1&limit=2`);
    assert(
      res14.status === 200 &&
      res14.data.page === 1 &&
      res14.data.limit === 2 &&
      res14.data.total === 3 &&
      res14.data.totalPages === 2 &&
      res14.data.hasNextPage === true &&
      res14.data.videos.length === 2 &&
      res14.data.pagination &&
      res14.data.pagination.total === 3,
      '14. Pagination returns standardized metadata structure (total, totalPages, hasNextPage)',
      JSON.stringify(res14.data)
    );

    // 15. Page 2 returns distinct results
    const res15 = await makeRequest('GET', `/search/videos?q=${testSuffix}&page=2&limit=2`);
    const page1Ids = res14.data.videos.map((v) => v._id.toString());
    const page2Ids = res15.data.videos.map((v) => v._id.toString());
    const hasOverlap = page2Ids.some((id) => page1Ids.includes(id));
    assert(
      res15.status === 200 &&
      res15.data.videos.length === 1 &&
      res15.data.hasNextPage === false &&
      !hasOverlap,
      '15. Page 2 returns distinct next results without duplicate records',
      `Page 1 IDs: ${page1Ids.join(', ')}, Page 2 IDs: ${page2Ids.join(', ')}`
    );

    // 16. Safe handling of invalid / negative page and limit cap
    const res16 = await makeRequest('GET', `/search/videos?page=-5&limit=9999`);
    assert(
      res16.status === 200 &&
      res16.data.page === 1 &&
      res16.data.limit === 50,
      '16. Safe handling and bounding of negative page (1) and oversized limit (50 cap)',
      JSON.stringify(res16.data)
    );

    // 17. Invalid category is safely rejected with 400 Bad Request
    const res17 = await makeRequest('GET', `/search/videos?category=NonExistentCategory`);
    assert(
      res17.status === 400 && res17.data.success === false,
      '17. Invalid category query is rejected with 400 Bad Request',
      JSON.stringify(res17.data)
    );

    // 18. Empty search query text returns clean published results
    const res18 = await makeRequest('GET', `/search/videos?page=1&limit=5`);
    assert(
      res18.status === 200 && Array.isArray(res18.data.videos),
      '18. Empty search text returns paginated published videos safely',
      JSON.stringify(res18.data)
    );

    // 19. Regex Injection / Special Characters safety
    const res19 = await makeRequest('GET', `/search/videos?q=.*[a-z]+(test)`);
    assert(
      res19.status === 200 && Array.isArray(res19.data.videos),
      '19. Search input safely escapes special regex characters (prevents ReDoS or query injection)',
      JSON.stringify(res19.data)
    );

    // 20. No matching results returns empty array with total: 0
    const res20 = await makeRequest('GET', `/search/videos?q=NonExistentSuperUnlikelyQuery9988776655`);
    assert(
      res20.status === 200 &&
      res20.data.total === 0 &&
      res20.data.videos.length === 0 &&
      res20.data.hasNextPage === false,
      '20. No matching results returns clean 200 OK with empty array and total: 0',
      JSON.stringify(res20.data)
    );

    // 21. Health check & core regression
    const healthRes = await makeRequest('GET', '/health');
    assert(
      healthRes.status === 200 && healthRes.data.status === 'ok',
      '21. Core /api/health endpoint remains fully operational',
      JSON.stringify(healthRes.data)
    );

    // 22. Phase 5 Discover endpoint regression
    const freshRes = await makeRequest('GET', '/discover/fresh?limit=5');
    assert(
      freshRes.status === 200 && freshRes.data.success === true && Array.isArray(freshRes.data.videos),
      '22. Phase 5 /api/discover/fresh endpoint remains fully operational',
      JSON.stringify(freshRes.data)
    );

  } catch (err) {
    console.error('Test Execution Error:', err);
    failed++;
  } finally {
    console.log('\n🧹 Cleaning up test records...');
    try {
      if (user1Id) await User.deleteOne({ _id: user1Id });
      if (user2Id) await User.deleteOne({ _id: user2Id });
      if (user3Id) await User.deleteOne({ _id: user3Id });
      if (video1Id) await Video.deleteOne({ _id: video1Id });
      if (video2Id) await Video.deleteOne({ _id: video2Id });
      if (video3Id) await Video.deleteOne({ _id: video3Id });
      if (draftVideoId) await Video.deleteOne({ _id: draftVideoId });
      if (user3Id) {
        await Like.deleteMany({ user: user3Id });
        await Save.deleteMany({ user: user3Id });
        await Comment.deleteMany({ user: user3Id });
        await Follow.deleteMany({ follower: user3Id });
      }
      console.log('Test data cleaned up successfully.');
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
  }

  console.log('\n========================================');
  console.log(`Phase 6 Test Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
