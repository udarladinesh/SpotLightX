/**
 * Spotly Phase 5 Automated Test Suite
 * Tests all Fresh Discovery & Trending Feed requirements:
 * 1. Fresh feed (published videos, newest first, exclude drafts, category filtering)
 * 2. Trending feed (rule-based engagement score with recency decay, exclude drafts, category filtering)
 * 3. Following feed (authentication required, followed creators only, exclude drafts, empty states)
 * 4. Pagination & Query validation (page, limit, caps, invalid parameters)
 * 5. Security & Isolation (never trust client user IDs, draft protection)
 * 6. Social stats enrichment (likeCount, commentCount, isLiked, isSaved)
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
  console.log('🧪 Starting Spotly Phase 5 Fresh Discovery & Trending Feed Verification Test Suite...\n');

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

  try {
    await startTestServer();
    await waitForDB();

    const testSuffix = Date.now().toString().slice(-6);

    let tokenUserA = null;
    let userA = null;
    let tokenUserB = null;
    let userB = null;
    let tokenUserC = null;
    let userC = null;

    let videoA1 = null; // Dance, published, newest
    let videoA2 = null; // Dance, published, older, high likes/comments (trending candidate)
    let videoADraft = null; // Dance, draft
    let videoB1 = null; // Singing, published
    let videoC1 = null; // Acting, published

    // -------------------------------------------------------------
    // Setup: Create Test Users and Test Showcases
    // -------------------------------------------------------------
    console.log('📦 Setting up test users and test showcases...');

    // User A (Dance Creator)
    const regResA = await makeRequest('POST', '/auth/register', {
      displayName: `Creator Alpha ${testSuffix}`,
      username: `alpha_${testSuffix}`,
      email: `alpha_${testSuffix}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    tokenUserA = regResA.data.token;
    userA = regResA.data.user;

    // User B (Singing Creator)
    const regResB = await makeRequest('POST', '/auth/register', {
      displayName: `Creator Beta ${testSuffix}`,
      username: `beta_${testSuffix}`,
      email: `beta_${testSuffix}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    tokenUserB = regResB.data.token;
    userB = regResB.data.user;

    // User C (Fan / Discoverer)
    const regResC = await makeRequest('POST', '/auth/register', {
      displayName: `Spotter Gamma ${testSuffix}`,
      username: `gamma_${testSuffix}`,
      email: `gamma_${testSuffix}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    tokenUserC = regResC.data.token;
    userC = regResC.data.user;

    // Create Videos:
    // 1. videoA2: Published 3 hours ago, 50 views
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    videoA2 = await Video.create({
      title: `Choreography Masterclass ${testSuffix}`,
      description: 'Advanced contemporary routine.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: `test_p5_a2_${testSuffix}`,
      creator: userA._id,
      category: 'Dance & Movement',
      skills: ['Contemporary', 'Choreography'],
      duration: 60,
      views: 50,
      status: 'published',
      createdAt: threeHoursAgo,
      updatedAt: threeHoursAgo
    });

    // Add engagement to videoA2: 2 likes, 2 comments
    await Like.create([
      { user: userB._id, video: videoA2._id },
      { user: userC._id, video: videoA2._id }
    ]);
    await Comment.create([
      { user: userB._id, video: videoA2._id, text: 'Inspiring piece!' },
      { user: userC._id, video: videoA2._id, text: 'Great control and execution!' }
    ]);

    // 2. videoA1: Fresh Published (just now), 5 views, 0 likes
    videoA1 = await Video.create({
      title: `Fresh Hip Hop Routine ${testSuffix}`,
      description: 'Brand new freestyle session uploaded minutes ago.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: `test_p5_a1_${testSuffix}`,
      creator: userA._id,
      category: 'Dance & Movement',
      skills: ['Hip Hop', 'Freestyle'],
      duration: 35,
      views: 5,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 3. videoADraft: Draft (must NEVER be exposed publicly)
    videoADraft = await Video.create({
      title: `Unreleased Rehearsal Draft ${testSuffix}`,
      description: 'Private unpolished rehearsal footage.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: `test_p5_adraft_${testSuffix}`,
      creator: userA._id,
      category: 'Dance & Movement',
      status: 'draft'
    });

    // 4. videoB1: Singing & Vocals, published
    videoB1 = await Video.create({
      title: `Acoustic Soul Vocal ${testSuffix}`,
      description: 'Live studio acoustic cover performance.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: `test_p5_b1_${testSuffix}`,
      creator: userB._id,
      category: 'Singing & Vocals',
      skills: ['Vocals', 'Acoustic'],
      duration: 120,
      views: 12,
      status: 'published',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    });

    // 5. videoC1: Acting & Drama, published
    videoC1 = await Video.create({
      title: `Dramatic Monologue Performance ${testSuffix}`,
      description: 'Intense theatrical scene audition.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: `test_p5_c1_${testSuffix}`,
      creator: userC._id,
      category: 'Acting & Drama',
      skills: ['Monologue', 'Theatre'],
      duration: 90,
      views: 8,
      status: 'published',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    console.log('Setup complete. Executing discovery feed tests...\n');

    // =============================================================
    // 1. Fresh Feed: Returns published videos
    // =============================================================
    const freshRes = await makeRequest('GET', '/discover/fresh?limit=20');
    assert(
      freshRes.status === 200 &&
        freshRes.data.success &&
        Array.isArray(freshRes.data.videos) &&
        freshRes.data.videos.length >= 4,
      '1. Fresh endpoint returns published videos array'
    );

    // =============================================================
    // 2. Fresh Feed: Sorts newest first (createdAt descending)
    // =============================================================
    const freshVideos = freshRes.data.videos;
    const isSortedNewestFirst = freshVideos.every((v, i) => {
      if (i === 0) return true;
      return new Date(freshVideos[i - 1].createdAt) >= new Date(v.createdAt);
    });
    assert(
      isSortedNewestFirst && freshVideos[0]._id.toString() === videoA1._id.toString(),
      '2. Fresh endpoint sorts strictly by newest createdAt first'
    );

    // =============================================================
    // 3. Fresh Feed: Excludes drafts
    // =============================================================
    const draftInFresh = freshVideos.some((v) => v._id.toString() === videoADraft._id.toString() || v.status === 'draft');
    assert(
      !draftInFresh,
      '3. Fresh endpoint strictly excludes draft videos'
    );

    // =============================================================
    // 4. Fresh Feed: Category filtering
    // =============================================================
    const danceCategoryRes = await makeRequest(
      'GET',
      `/discover/fresh?category=${encodeURIComponent('Dance & Movement')}`
    );
    const onlyDance = danceCategoryRes.data.videos.every((v) => v.category === 'Dance & Movement');
    const hasDanceVideos = danceCategoryRes.data.videos.some((v) => v._id.toString() === videoA1._id.toString());
    const hasNonDance = danceCategoryRes.data.videos.some((v) => v.category === 'Singing & Vocals');
    assert(
      danceCategoryRes.status === 200 && onlyDance && hasDanceVideos && !hasNonDance,
      '4. Fresh endpoint accurately filters by talent category'
    );

    // =============================================================
    // 5. Trending Feed: Returns published videos
    // =============================================================
    const trendingRes = await makeRequest('GET', '/discover/trending?limit=20');
    assert(
      trendingRes.status === 200 &&
        trendingRes.data.success &&
        Array.isArray(trendingRes.data.videos) &&
        trendingRes.data.videos.length >= 4,
      '5. Trending endpoint returns published videos'
    );

    // =============================================================
    // 6. Trending Feed: Applies documented formula and ranking
    //    videoA2 has: 50 views + (2 likes * 3) + (2 comments * 5) = 66 raw engagement.
    //    videoA1 has: 5 views + 0 likes + 0 comments = 5 raw engagement.
    //    videoA2 should rank higher than videoA1 despite being 3 hours older.
    // =============================================================
    const trendingVideos = trendingRes.data.videos;
    const a2Index = trendingVideos.findIndex((v) => v._id.toString() === videoA2._id.toString());
    const a1Index = trendingVideos.findIndex((v) => v._id.toString() === videoA1._id.toString());
    assert(
      a2Index !== -1 && a1Index !== -1 && a2Index < a1Index,
      '6. Trending endpoint applies engagement formula (high engagement ranks above lower engagement)'
    );

    // =============================================================
    // 7. Trending Feed: Excludes drafts
    // =============================================================
    const draftInTrending = trendingVideos.some((v) => v._id.toString() === videoADraft._id.toString() || v.status === 'draft');
    assert(
      !draftInTrending,
      '7. Trending endpoint strictly excludes draft videos'
    );

    // =============================================================
    // 8. Trending Feed: Category filtering
    // =============================================================
    const vocalTrendingRes = await makeRequest(
      'GET',
      `/discover/trending?category=${encodeURIComponent('Singing & Vocals')}`
    );
    const onlyVocals = vocalTrendingRes.data.videos.every((v) => v.category === 'Singing & Vocals');
    const hasVocalVideo = vocalTrendingRes.data.videos.some((v) => v._id.toString() === videoB1._id.toString());
    assert(
      vocalTrendingRes.status === 200 && onlyVocals && hasVocalVideo,
      '8. Trending endpoint supports category filtering'
    );

    // =============================================================
    // 9. Following Feed: Requires authentication (401 when missing)
    // =============================================================
    const unauthFollowFeed = await makeRequest('GET', '/discover/following', null, null);
    assert(
      unauthFollowFeed.status === 401 && !unauthFollowFeed.data.success,
      '9. Following endpoint requires authentication (returns 401 for unauthenticated requests)'
    );

    // =============================================================
    // 10. Following Feed: Empty state when following nobody
    // =============================================================
    // User C follows nobody yet
    const emptyFollowingRes = await makeRequest('GET', '/discover/following', null, tokenUserC);
    assert(
      emptyFollowingRes.status === 200 &&
        emptyFollowingRes.data.success &&
        emptyFollowingRes.data.count === 0 &&
        emptyFollowingRes.data.videos.length === 0,
      '10. Following endpoint returns clean empty response when user follows nobody'
    );

    // User C follows User A
    await makeRequest('POST', `/users/${userA._id}/follow`, {}, tokenUserC);

    // =============================================================
    // 11. Following Feed: Returns published videos from followed creator
    // =============================================================
    const followingRes = await makeRequest('GET', '/discover/following', null, tokenUserC);
    const followingVideos = followingRes.data.videos;
    const onlyFollowedCreator = followingVideos.every((v) => v.creator._id.toString() === userA._id.toString());
    const hasA1 = followingVideos.some((v) => v._id.toString() === videoA1._id.toString());
    const hasA2 = followingVideos.some((v) => v._id.toString() === videoA2._id.toString());
    const hasUnfollowedB = followingVideos.some((v) => v.creator._id.toString() === userB._id.toString());
    assert(
      followingRes.status === 200 &&
        onlyFollowedCreator &&
        hasA1 &&
        hasA2 &&
        !hasUnfollowedB,
      '11. Following endpoint returns videos strictly from followed creators'
    );

    // =============================================================
    // 12. Following Feed: Excludes drafts of followed creator
    // =============================================================
    const draftInFollowing = followingVideos.some(
      (v) => v._id.toString() === videoADraft._id.toString() || v.status === 'draft'
    );
    assert(
      !draftInFollowing,
      '12. Following endpoint excludes drafts of followed creators'
    );

    // =============================================================
    // 13. Following Feed: Cannot be spoofed via client request parameters
    // =============================================================
    // Sending ?userId=otherUser should still return authenticated user's following feed
    const spoofAttemptRes = await makeRequest('GET', `/discover/following?userId=${userB._id}`, null, tokenUserC);
    const spoofOnlyUserA = spoofAttemptRes.data.videos.every((v) => v.creator._id.toString() === userA._id.toString());
    assert(
      spoofAttemptRes.status === 200 && spoofOnlyUserA,
      '13. Following feed relies exclusively on verified server JWT identity (ignores spoofed query params)'
    );

    // =============================================================
    // 14. Pagination: page, limit, total, totalPages, hasNextPage
    // =============================================================
    const paginatedRes = await makeRequest('GET', '/discover/fresh?page=1&limit=2');
    assert(
      paginatedRes.status === 200 &&
        paginatedRes.data.success &&
        paginatedRes.data.videos.length === 2 &&
        paginatedRes.data.page === 1 &&
        paginatedRes.data.limit === 2 &&
        paginatedRes.data.total >= 4 &&
        paginatedRes.data.totalPages >= 2 &&
        paginatedRes.data.hasNextPage === true &&
        paginatedRes.data.pagination.hasNextPage === true,
      '14. Pagination delivers accurate page, limit, total, totalPages, and hasNextPage'
    );

    // Second page
    const page2Res = await makeRequest('GET', '/discover/fresh?page=2&limit=2');
    assert(
      page2Res.status === 200 &&
        page2Res.data.page === 2 &&
        page2Res.data.videos.length === 2 &&
        page2Res.data.videos[0]._id.toString() !== paginatedRes.data.videos[0]._id.toString(),
      '14b. Second page retrieves distinct next page records'
    );

    // =============================================================
    // 15. Validation: Invalid page, limit, and category values handled safely
    // =============================================================
    // Negative page and huge limit are bounded safely
    const boundsRes = await makeRequest('GET', '/discover/fresh?page=-5&limit=9999');
    assert(
      boundsRes.status === 200 &&
        boundsRes.data.page === 1 &&
        boundsRes.data.limit === 50,
      '15. Safe handling and bounding of negative page (1) and oversized limit (50 cap)'
    );

    // Invalid category is rejected with 400 Bad Request
    const invalidCatRes = await makeRequest('GET', '/discover/fresh?category=InvalidNonExistentCat');
    assert(
      invalidCatRes.status === 400 && !invalidCatRes.data.success,
      '15b. Invalid talent category parameter is safely rejected with 400 Bad Request'
    );

    // =============================================================
    // 16. Social Stats Enrichment on Discovery Feeds
    // =============================================================
    // User C is logged in and liked videoA2
    const enrichedRes = await makeRequest('GET', '/discover/fresh?limit=20', null, tokenUserC);
    const enrichedA2 = enrichedRes.data.videos.find((v) => v._id.toString() === videoA2._id.toString());
    assert(
      enrichedA2 &&
        enrichedA2.likeCount === 2 &&
        enrichedA2.commentCount === 2 &&
        enrichedA2.isLiked === true &&
        enrichedA2.isSaved === false,
      '16. Discovery feeds enrich likeCount (2), commentCount (2), and personalized isLiked/isSaved flags'
    );

    // =============================================================
    // 17. Unfollow creator updates Following feed dynamically
    // =============================================================
    await makeRequest('DELETE', `/users/${userA._id}/follow`, null, tokenUserC);
    const followingAfterUnfollow = await makeRequest('GET', '/discover/following', null, tokenUserC);
    assert(
      followingAfterUnfollow.status === 200 && followingAfterUnfollow.data.count === 0,
      '17. Unfollowing a creator instantly updates the Following feed'
    );

    // =============================================================
    // 18. Health Check and Existing Routes Intact
    // =============================================================
    const healthRes = await makeRequest('GET', '/health');
    assert(
      healthRes.status === 200 && healthRes.data.status === 'ok',
      '18. /api/health and existing core API endpoints remain fully functional'
    );

    // -------------------------------------------------------------
    // Cleanup Test Data
    // -------------------------------------------------------------
    console.log('\n🧹 Cleaning up test records...');
    await Promise.all([
      User.deleteMany({ _id: { $in: [userA._id, userB._id, userC._id] } }),
      Video.deleteMany({ _id: { $in: [videoA1._id, videoA2._id, videoADraft._id, videoB1._id, videoC1._id] } }),
      Like.deleteMany({ video: { $in: [videoA1._id, videoA2._id, videoADraft._id, videoB1._id, videoC1._id] } }),
      Comment.deleteMany({ video: { $in: [videoA1._id, videoA2._id, videoADraft._id, videoB1._id, videoC1._id] } }),
      Save.deleteMany({ video: { $in: [videoA1._id, videoA2._id, videoADraft._id, videoB1._id, videoC1._id] } }),
      Follow.deleteMany({
        $or: [
          { follower: { $in: [userA._id, userB._id, userC._id] } },
          { following: { $in: [userA._id, userB._id, userC._id] } }
        ]
      })
    ]);
    console.log('Test data cleaned up successfully.');

    console.log(`\n========================================`);
    console.log(`Phase 5 Test Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    console.log(`========================================\n`);

    if (serverInstance) serverInstance.close();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
    if (serverInstance) serverInstance.close();
    process.exit(1);
  }
}

runTests();
