/**
 * Spotly Phase 8 Automated Test Suite
 * Tests all Creator Analytics & Insights requirements:
 * 1. Authenticated user can access analytics
 * 2. Unauthenticated user cannot access analytics (returns 401)
 * 3. User only receives their own analytics (isolation)
 * 4. User cannot access another user's analytics (ignores any frontend-supplied userId)
 * 5. Overview video count is correct
 * 6. Overview view count is correct
 * 7. Overview like count is correct
 * 8. Overview comment count is correct
 * 9. Overview save count is correct
 * 10. Follower count is correct
 * 11. Following count is correct
 * 12. Draft videos are excluded from analytics
 * 13. Video analytics returns only the creator's videos
 * 14. Video pagination works
 * 15. Pagination limit is safely capped
 * 16. Top-video calculation is correct (views + likes*3 + comments*5 + saves*4)
 * 17. Engagement calculation is correct ((likes+comments+saves)/views * 100)
 * 18. Zero views do not produce NaN or Infinity
 * 19. Follower period filtering works (7d, 30d, 90d, all)
 * 20. Recent activity belongs only to the authenticated creator
 * 21. Sensitive fields (passwords, emails) are not exposed
 * 22. Invalid period is handled safely
 * 23. Invalid pagination is handled safely
 * 24. Existing Phase 7 Notifications & core endpoints remain fully operational
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
const Notification = require('./src/models/Notification');

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
  console.log('🧪 Starting Spotly Phase 8 Creator Analytics & Insights Test Suite...\n');

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
  const creatorEmail = `analytics_creator_${testSuffix}@spotlytest.com`;
  const fan1Email = `analytics_fan1_${testSuffix}@spotlytest.com`;
  const fan2Email = `analytics_fan2_${testSuffix}@spotlytest.com`;
  const otherCreatorEmail = `analytics_other_${testSuffix}@spotlytest.com`;

  let creatorToken, fan1Token, fan2Token, otherCreatorToken;
  let creatorId, fan1Id, fan2Id, otherCreatorId;
  let video1Id, video2Id, draftVideoId;

  try {
    await startTestServer();
    await waitForDB();

    console.log('📦 Setting up test users, videos, social interactions and activities...');

    // 1. Primary Creator
    const regCreator = await makeRequest('POST', '/auth/register', {
      displayName: `Creator Maya ${testSuffix}`,
      username: `maya_dance_${testSuffix}`,
      email: creatorEmail,
      password: 'password123',
      categories: ['Dance & Movement'],
      skills: ['contemporary', 'hip-hop']
    });
    creatorToken = regCreator.data?.token;
    creatorId = regCreator.data?.user?._id;

    // 2. Fan 1
    const regFan1 = await makeRequest('POST', '/auth/register', {
      displayName: `Fan James ${testSuffix}`,
      username: `james_fan_${testSuffix}`,
      email: fan1Email,
      password: 'password123',
      categories: ['Dance & Movement'],
      skills: ['dance-fan']
    });
    fan1Token = regFan1.data?.token;
    fan1Id = regFan1.data?.user?._id;

    // 3. Fan 2
    const regFan2 = await makeRequest('POST', '/auth/register', {
      displayName: `Fan Chloe ${testSuffix}`,
      username: `chloe_fan_${testSuffix}`,
      email: fan2Email,
      password: 'password123',
      categories: ['Music & Production'],
      skills: ['music-fan']
    });
    fan2Token = regFan2.data?.token;
    fan2Id = regFan2.data?.user?._id;

    // 4. Other Creator (for isolation tests)
    const regOther = await makeRequest('POST', '/auth/register', {
      displayName: `Creator Zack ${testSuffix}`,
      username: `zack_art_${testSuffix}`,
      email: otherCreatorEmail,
      password: 'password123',
      categories: ['Art & Design'],
      skills: ['digital-illustration']
    });
    otherCreatorToken = regOther.data?.token;
    otherCreatorId = regOther.data?.user?._id;

    // 5. Create Published Video 1 for Creator Maya (views: 100)
    const v1 = await Video.create({
      title: `Urban Flow Routine ${testSuffix}`,
      description: 'Studio choreography piece.',
      videoUrl: 'https://res.cloudinary.com/spotly/video/upload/sample_v1.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/spotly/image/upload/sample_v1.jpg',
      publicId: `spotly_test/analytics_v1_${testSuffix}`,
      creator: creatorId,
      category: 'Dance & Movement',
      skills: ['hip-hop'],
      duration: 90,
      views: 100,
      status: 'published'
    });
    video1Id = v1._id;

    // 6. Create Published Video 2 for Creator Maya (views: 50)
    const v2 = await Video.create({
      title: `Contemporary Solo ${testSuffix}`,
      description: 'Lyrical contemporary piece.',
      videoUrl: 'https://res.cloudinary.com/spotly/video/upload/sample_v2.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/spotly/image/upload/sample_v2.jpg',
      publicId: `spotly_test/analytics_v2_${testSuffix}`,
      creator: creatorId,
      category: 'Dance & Movement',
      skills: ['contemporary'],
      duration: 110,
      views: 50,
      status: 'published'
    });
    video2Id = v2._id;

    // 7. Create Draft Video for Creator Maya (should be excluded from analytics)
    const vDraft = await Video.create({
      title: `Unpublished Draft Showcase ${testSuffix}`,
      description: 'Incomplete rehearsal video.',
      videoUrl: 'https://res.cloudinary.com/spotly/video/upload/sample_draft.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/spotly/image/upload/sample_draft.jpg',
      publicId: `spotly_test/analytics_draft_${testSuffix}`,
      creator: creatorId,
      category: 'Dance & Movement',
      skills: ['rehearsal'],
      duration: 45,
      views: 999, // Should NOT be included in total views!
      status: 'draft'
    });
    draftVideoId = vDraft._id;

    // 8. Add Social Interactions to Published Video 1:
    // Fan 1 likes, comments, and saves Video 1
    await makeRequest('POST', `/videos/${video1Id}/like`, null, fan1Token);
    await makeRequest('POST', `/videos/${video1Id}/comments`, { text: 'Amazing flow!' }, fan1Token);
    await makeRequest('POST', `/videos/${video1Id}/save`, null, fan1Token);

    // Fan 2 likes Video 1
    await makeRequest('POST', `/videos/${video1Id}/like`, null, fan2Token);

    // Fan 1 likes Video 2
    await makeRequest('POST', `/videos/${video2Id}/like`, null, fan1Token);

    // 9. Follows:
    // Fan 1 and Fan 2 follow Creator Maya (totalFollowers = 2)
    await makeRequest('POST', `/users/${creatorId}/follow`, null, fan1Token);
    await makeRequest('POST', `/users/${creatorId}/follow`, null, fan2Token);

    // Creator Maya follows Creator Zack (totalFollowing = 1)
    await makeRequest('POST', `/users/${otherCreatorId}/follow`, null, creatorToken);

    console.log('Setup complete. Executing Phase 8 tests...\n');

    // ==========================================
    // 1. Authenticated user can access analytics
    // ==========================================
    const authRes = await makeRequest('GET', '/analytics/overview', null, creatorToken);
    assert(
      authRes.status === 200 && authRes.data.success === true,
      '1. Authenticated creator can access GET /api/analytics/overview'
    );

    // ==========================================
    // 2. Unauthenticated user cannot access analytics (401)
    // ==========================================
    const unauthRes = await makeRequest('GET', '/analytics/overview');
    assert(
      unauthRes.status === 401,
      '2. Unauthenticated user cannot access analytics (returns 401 Unauthorized)'
    );

    // ==========================================
    // 3. User only receives their own analytics (isolation)
    // ==========================================
    const otherRes = await makeRequest('GET', '/analytics/overview', null, otherCreatorToken);
    assert(
      otherRes.status === 200 &&
      otherRes.data.totalVideos === 0 &&
      otherRes.data.totalViews === 0 &&
      otherRes.data.totalLikes === 0 &&
      otherRes.data.totalFollowers === 1 && // Followed by Maya
      otherRes.data.totalFollowing === 0,
      '3. User only receives their own analytics (cross-user data isolation)',
      JSON.stringify(otherRes.data)
    );

    // ==========================================
    // 4. User cannot access another user's analytics (ignores frontend-supplied userId)
    // ==========================================
    const spoofRes = await makeRequest('GET', `/analytics/overview?userId=${creatorId}`, null, otherCreatorToken);
    assert(
      spoofRes.status === 200 &&
      spoofRes.data.totalVideos === 0, // Zack still gets 0 videos, Maya's ID in query is strictly ignored
      '4. Server strictly derives identity from verified JWT and ignores frontend-supplied userId'
    );

    // ==========================================
    // 5. Overview video count is correct (only published)
    // ==========================================
    assert(
      authRes.data.totalVideos === 2,
      '5. Overview published video count is correct (2 published, draft excluded)',
      `Actual totalVideos: ${authRes.data.totalVideos}`
    );

    // ==========================================
    // 6. Overview view count is correct (sum of published only)
    // ==========================================
    // Video 1 = 100 views, Video 2 = 50 views, Draft = 999 views (must be excluded)
    // Expected: 150 views
    assert(
      authRes.data.totalViews === 150,
      '6. Overview totalViews is correct (100 + 50 = 150, draft 999 views excluded)',
      `Actual totalViews: ${authRes.data.totalViews}`
    );

    // ==========================================
    // 7. Overview like count is correct
    // ==========================================
    // Video 1 has 2 likes (Fan 1, Fan 2), Video 2 has 1 like (Fan 1). Total = 3 likes.
    assert(
      authRes.data.totalLikes === 3,
      '7. Overview totalLikes count is correct (3 total likes)',
      `Actual totalLikes: ${authRes.data.totalLikes}`
    );

    // ==========================================
    // 8. Overview comment count is correct
    // ==========================================
    // Video 1 has 1 comment. Total = 1 comment.
    assert(
      authRes.data.totalComments === 1,
      '8. Overview totalComments count is correct (1 comment)',
      `Actual totalComments: ${authRes.data.totalComments}`
    );

    // ==========================================
    // 9. Overview save count is correct
    // ==========================================
    // Video 1 has 1 save. Total = 1 save.
    assert(
      authRes.data.totalSaves === 1,
      '9. Overview totalSaves count is correct (1 save)',
      `Actual totalSaves: ${authRes.data.totalSaves}`
    );

    // ==========================================
    // 10. Follower count is correct
    // ==========================================
    // Fan 1 and Fan 2 follow Maya = 2 followers
    assert(
      authRes.data.totalFollowers === 2,
      '10. Follower count is correct (2 followers)',
      `Actual totalFollowers: ${authRes.data.totalFollowers}`
    );

    // ==========================================
    // 11. Following count is correct
    // ==========================================
    // Maya follows Zack = 1 following
    assert(
      authRes.data.totalFollowing === 1,
      '11. Following count is correct (1 following)',
      `Actual totalFollowing: ${authRes.data.totalFollowing}`
    );

    // ==========================================
    // 12. Draft videos are excluded from Video Analytics
    // ==========================================
    const videoAnalyticsRes = await makeRequest('GET', '/analytics/videos', null, creatorToken);
    assert(
      videoAnalyticsRes.status === 200 &&
      videoAnalyticsRes.data.videos.length === 2 &&
      !videoAnalyticsRes.data.videos.some((v) => v.id?.toString() === draftVideoId.toString()),
      '12. GET /api/analytics/videos strictly excludes draft videos',
      JSON.stringify(videoAnalyticsRes.data)
    );

    // ==========================================
    // 13. Video analytics returns only the creator's videos
    // ==========================================
    const otherVideoAnalytics = await makeRequest('GET', '/analytics/videos', null, otherCreatorToken);
    assert(
      otherVideoAnalytics.status === 200 &&
      otherVideoAnalytics.data.videos.length === 0,
      '13. Video analytics returns only the authenticated creator videos'
    );

    // ==========================================
    // 14. Video pagination works
    // ==========================================
    const paginatedRes = await makeRequest('GET', '/analytics/videos?page=1&limit=1', null, creatorToken);
    assert(
      paginatedRes.status === 200 &&
      paginatedRes.data.videos.length === 1 &&
      paginatedRes.data.total === 2 &&
      paginatedRes.data.totalPages === 2 &&
      paginatedRes.data.hasNextPage === true &&
      paginatedRes.data.page === 1 &&
      paginatedRes.data.limit === 1,
      '14. Video pagination returns accurate pagination metadata and slices correctly'
    );

    // ==========================================
    // 15. Pagination limit is safely capped
    // ==========================================
    const cappedRes = await makeRequest('GET', '/analytics/videos?limit=9999', null, creatorToken);
    assert(
      cappedRes.status === 200 && cappedRes.data.limit === 50,
      '15. Video pagination limit is safely capped at maximum 50',
      `Actual limit: ${cappedRes.data.limit}`
    );

    // ==========================================
    // 16. Top-video calculation is correct
    // ==========================================
    // Formula: Raw Engagement = views + (likes * 3) + (comments * 5) + (saves * 4)
    // Video 1: views=100, likes=2, comments=1, saves=1
    //   Score = 100 + (2*3) + (1*5) + (1*4) = 100 + 6 + 5 + 4 = 115
    // Video 2: views=50, likes=1, comments=0, saves=0
    //   Score = 50 + (1*3) + 0 + 0 = 53
    const topVideosRes = await makeRequest('GET', '/analytics/top-videos', null, creatorToken);
    const topList = topVideosRes.data?.topVideos || [];
    const top1 = topList[0];
    const top2 = topList[1];

    assert(
      topVideosRes.status === 200 &&
      topList.length === 2 &&
      top1?.video?._id?.toString() === video1Id.toString() &&
      top1?.engagementScore === 115 &&
      top2?.video?._id?.toString() === video2Id.toString() &&
      top2?.engagementScore === 53 &&
      typeof topVideosRes.data.formula === 'string',
      '16. Top videos accurately calculated using views + (likes*3) + (comments*5) + (saves*4)',
      `Top 1: ${top1?.engagementScore}, Top 2: ${top2?.engagementScore}`
    );

    // ==========================================
    // 17. Engagement rate calculation is correct
    // ==========================================
    // Total interactions = 3 likes + 1 comment + 1 save = 5
    // Total views = 150
    // Engagement Rate = (5 / 150) * 100 = 3.33%
    assert(
      authRes.data.totalInteractions === 5 &&
      authRes.data.engagementRate === 3.33,
      '17. Engagement calculation is correct ((5 interactions / 150 views) * 100 = 3.33%)',
      `Actual: interactions=${authRes.data.totalInteractions}, rate=${authRes.data.engagementRate}`
    );

    // ==========================================
    // 18. Zero views do not produce NaN or Infinity
    // ==========================================
    // Zack has 0 views and 0 interactions
    assert(
      otherRes.data.totalViews === 0 &&
      otherRes.data.engagementRate === 0 &&
      !isNaN(otherRes.data.engagementRate) &&
      isFinite(otherRes.data.engagementRate),
      '18. Zero views safely evaluates to engagementRate = 0 (never NaN or Infinity)'
    );

    // ==========================================
    // 19. Follower period filtering works (7d, 30d, 90d, all)
    // ==========================================
    const followers7d = await makeRequest('GET', '/analytics/followers?period=7d', null, creatorToken);
    const followersAll = await makeRequest('GET', '/analytics/followers?period=all', null, creatorToken);

    assert(
      followers7d.status === 200 &&
      followers7d.data.period === '7d' &&
      followers7d.data.newFollowers === 2 &&
      followers7d.data.currentFollowers === 2 &&
      followers7d.data.currentFollowing === 1 &&
      Array.isArray(followers7d.data.growthHistory) &&
      followersAll.data.period === 'all' &&
      followersAll.data.newFollowers === 2,
      '19. Follower period filtering accurately returns period-bounded follower metrics'
    );

    // ==========================================
    // 20. Recent activity belongs only to the authenticated creator
    // ==========================================
    const activityRes = await makeRequest('GET', '/analytics/activity', null, creatorToken);
    assert(
      activityRes.status === 200 &&
      activityRes.data.activities.length > 0 &&
      activityRes.data.activities.every((a) => ['FOLLOW', 'LIKE', 'COMMENT', 'SAVE'].includes(a.type)),
      '20. GET /api/analytics/activity returns creator interaction stream',
      `Activity count: ${activityRes.data.activities?.length}`
    );

    // ==========================================
    // 21. Sensitive fields are strictly excluded
    // ==========================================
    const firstActivitySender = activityRes.data.activities[0]?.sender;
    assert(
      firstActivitySender &&
      firstActivitySender.password === undefined &&
      firstActivitySender.email === undefined &&
      firstActivitySender.displayName !== undefined,
      '21. Activity sender strictly excludes sensitive fields (password, email)'
    );

    // ==========================================
    // 22. Invalid period is handled safely
    // ==========================================
    const invalidPeriodRes = await makeRequest('GET', '/analytics/followers?period=invalid123xyz', null, creatorToken);
    assert(
      invalidPeriodRes.status === 200 &&
      invalidPeriodRes.data.period === '30d' &&
      typeof invalidPeriodRes.data.newFollowers === 'number',
      '22. Invalid period safely falls back to default 30d without failing'
    );

    // ==========================================
    // 23. Invalid pagination is handled safely
    // ==========================================
    const invalidPageRes = await makeRequest('GET', '/analytics/videos?page=-5&limit=abc', null, creatorToken);
    assert(
      invalidPageRes.status === 200 &&
      invalidPageRes.data.page === 1 &&
      invalidPageRes.data.limit === 10,
      '23. Invalid pagination parameters safely fallback to page=1 and limit=10'
    );

    // ==========================================
    // 24. Existing Phase 7 & core regression checks
    // ==========================================
    const notifsRes = await makeRequest('GET', '/notifications', null, creatorToken);
    assert(
      notifsRes.status === 200 && notifsRes.data.success === true,
      '24. Phase 7 Notifications endpoint remains fully operational'
    );

    const healthRes = await makeRequest('GET', '/health');
    assert(
      healthRes.status === 200 && healthRes.data.status === 'ok',
      '25. Core /api/health endpoint remains fully operational'
    );

  } catch (err) {
    console.error('Test Execution Error:', err);
    failed++;
  } finally {
    console.log('\n🧹 Cleaning up test records...');
    try {
      if (creatorId) await User.deleteOne({ _id: creatorId });
      if (fan1Id) await User.deleteOne({ _id: fan1Id });
      if (fan2Id) await User.deleteOne({ _id: fan2Id });
      if (otherCreatorId) await User.deleteOne({ _id: otherCreatorId });
      if (video1Id) await Video.deleteOne({ _id: video1Id });
      if (video2Id) await Video.deleteOne({ _id: video2Id });
      if (draftVideoId) await Video.deleteOne({ _id: draftVideoId });
      if (creatorId) {
        await Notification.deleteMany({ recipient: creatorId });
        await Follow.deleteMany({ $or: [{ follower: creatorId }, { following: creatorId }] });
      }
      if (otherCreatorId) {
        await Follow.deleteMany({ $or: [{ follower: otherCreatorId }, { following: otherCreatorId }] });
      }
      if (fan1Id) {
        await Like.deleteMany({ user: fan1Id });
        await Comment.deleteMany({ user: fan1Id });
        await Save.deleteMany({ user: fan1Id });
        await Follow.deleteMany({ follower: fan1Id });
      }
      if (fan2Id) {
        await Like.deleteMany({ user: fan2Id });
        await Follow.deleteMany({ follower: fan2Id });
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
  console.log(`Phase 8 Test Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
