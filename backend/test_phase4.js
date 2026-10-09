/**
 * Spotly Phase 4 Automated Test Suite
 * Tests all Social Features requirements: Likes, Comments, Saves, Follows, Security, and Integrity.
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
  console.log('🧪 Starting Spotly Phase 4 Social Features Verification Test Suite...\n');

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
    let publishedVideo = null;
    let draftVideo = null;
    let commentAId = null;

    // -------------------------------------------------------------
    // Setup: Create Test Users and Test Videos
    // -------------------------------------------------------------
    console.log('📦 Setting up test users and test showcases...');

    // User A (Creator)
    const regResA = await makeRequest('POST', '/auth/register', {
      displayName: `Social Creator A ${testSuffix}`,
      username: `social_a_${testSuffix}`,
      email: `social_a_${testSuffix}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    tokenUserA = regResA.data.token;
    userA = regResA.data.user;

    // User B (Fan / Spotter)
    const regResB = await makeRequest('POST', '/auth/register', {
      displayName: `Social Spotter B ${testSuffix}`,
      username: `social_b_${testSuffix}`,
      email: `social_b_${testSuffix}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    tokenUserB = regResB.data.token;
    userB = regResB.data.user;

    // Create a published video for userA directly in DB
    publishedVideo = await Video.create({
      title: `Social Dance Showcase ${testSuffix}`,
      description: 'Choreography showcase testing likes and comments.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: `test_video_pub_${testSuffix}`,
      creator: userA._id,
      category: 'Dance & Movement',
      skills: ['Hip Hop', 'Freestyle'],
      duration: 45,
      views: 10,
      status: 'published'
    });

    // Create a draft video for userA directly in DB
    draftVideo = await Video.create({
      title: `Private Draft Showcase ${testSuffix}`,
      description: 'Private draft rehearsal video.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: `test_video_draft_${testSuffix}`,
      creator: userA._id,
      category: 'Music & Production',
      status: 'draft'
    });

    console.log(`Setup complete. Published Video ID: ${publishedVideo._id}\n`);

    // =============================================================
    // 1. Unauthenticated like request returns 401
    // =============================================================
    const unauthLikeRes = await makeRequest('POST', `/videos/${publishedVideo._id}/like`, {}, null);
    assert(
      unauthLikeRes.status === 401 && !unauthLikeRes.data.success,
      '1. Unauthenticated like request returns 401'
    );

    // =============================================================
    // 2. Authenticated user can like a published video
    // =============================================================
    const likeRes = await makeRequest('POST', `/videos/${publishedVideo._id}/like`, {}, tokenUserB);
    assert(
      likeRes.status === 200 && likeRes.data.success && likeRes.data.liked === true && likeRes.data.likeCount === 1,
      '2. Authenticated user can like a published video'
    );

    // =============================================================
    // 3. Duplicate like does not create another Like document
    // =============================================================
    const dupLikeRes = await makeRequest('POST', `/videos/${publishedVideo._id}/like`, {}, tokenUserB);
    const likeDocCount = await Like.countDocuments({ user: userB._id, video: publishedVideo._id });
    assert(
      dupLikeRes.status === 200 && dupLikeRes.data.liked === true && likeDocCount === 1,
      '3. Duplicate like does not create another Like document'
    );

    // Verify GET /api/videos/:id/like-status
    const likeStatusRes = await makeRequest('GET', `/videos/${publishedVideo._id}/like-status`, null, tokenUserB);
    assert(
      likeStatusRes.status === 200 && likeStatusRes.data.liked === true && likeStatusRes.data.likeCount === 1,
      '3b. GET /api/videos/:id/like-status accurately reflects liked: true and likeCount: 1'
    );

    // =============================================================
    // 4. User can unlike a video
    // =============================================================
    const unlikeRes = await makeRequest('DELETE', `/videos/${publishedVideo._id}/like`, null, tokenUserB);
    const likeCountAfterUnlike = await Like.countDocuments({ video: publishedVideo._id });
    assert(
      unlikeRes.status === 200 &&
        unlikeRes.data.success &&
        unlikeRes.data.liked === false &&
        unlikeRes.data.likeCount === 0 &&
        likeCountAfterUnlike === 0,
      '4. User can unlike a video'
    );

    // Re-like for counts verification later
    await makeRequest('POST', `/videos/${publishedVideo._id}/like`, {}, tokenUserB);

    // =============================================================
    // 5. Authenticated user can add a valid comment
    // =============================================================
    const commentRes = await makeRequest(
      'POST',
      `/videos/${publishedVideo._id}/comments`,
      { text: 'Incredible choreography and rhythm! Keep it up 🔥' },
      tokenUserB
    );
    assert(
      commentRes.status === 201 &&
        commentRes.data.success &&
        commentRes.data.comment &&
        commentRes.data.comment.text === 'Incredible choreography and rhythm! Keep it up 🔥' &&
        commentRes.data.comment.user.username === userB.username,
      '5. Authenticated user can add a valid comment'
    );
    commentAId = commentRes.data.comment?._id;

    // =============================================================
    // 6. Empty comment is rejected
    // =============================================================
    const emptyCommentRes = await makeRequest(
      'POST',
      `/videos/${publishedVideo._id}/comments`,
      { text: '   ' },
      tokenUserB
    );
    assert(
      emptyCommentRes.status === 400 && !emptyCommentRes.data.success,
      '6. Empty comment is rejected with 400 Bad Request'
    );

    // =============================================================
    // 7. Comment length validation works (> 500 chars rejected)
    // =============================================================
    const longText = 'a'.repeat(501);
    const longCommentRes = await makeRequest(
      'POST',
      `/videos/${publishedVideo._id}/comments`,
      { text: longText },
      tokenUserB
    );
    assert(
      longCommentRes.status === 400 && !longCommentRes.data.success,
      '7. Comment length validation works (> 500 characters rejected with 400)'
    );

    // Add a second comment from User A for testing deletion boundary
    const commentFromARes = await makeRequest(
      'POST',
      `/videos/${publishedVideo._id}/comments`,
      { text: 'Thank you so much! More coming soon!' },
      tokenUserA
    );
    const commentFromAId = commentFromARes.data.comment?._id;

    // =============================================================
    // 8. User can delete their own comment
    // =============================================================
    const deleteOwnCommentRes = await makeRequest(
      'DELETE',
      `/videos/${publishedVideo._id}/comments/${commentFromAId}`,
      null,
      tokenUserA
    );
    const commentFromADoc = await Comment.findById(commentFromAId);
    assert(
      deleteOwnCommentRes.status === 200 && deleteOwnCommentRes.data.success && !commentFromADoc,
      '8. User can delete their own comment'
    );

    // =============================================================
    // 9. User cannot delete another user's comment (403 Forbidden)
    // =============================================================
    // User A trying to delete User B's comment
    const unauthDeleteCommentRes = await makeRequest(
      'DELETE',
      `/videos/${publishedVideo._id}/comments/${commentAId}`,
      null,
      tokenUserA
    );
    assert(
      unauthDeleteCommentRes.status === 403 && !unauthDeleteCommentRes.data.success,
      '9. User cannot delete another user comment (403 Forbidden)'
    );

    // =============================================================
    // 10. Authenticated user can save a video
    // =============================================================
    const saveRes = await makeRequest('POST', `/videos/${publishedVideo._id}/save`, {}, tokenUserB);
    assert(
      saveRes.status === 200 && saveRes.data.success && saveRes.data.saved === true,
      '10. Authenticated user can save a video'
    );

    // Verify GET /api/videos/:id/save-status
    const saveStatusRes = await makeRequest('GET', `/videos/${publishedVideo._id}/save-status`, null, tokenUserB);
    assert(
      saveStatusRes.status === 200 && saveStatusRes.data.saved === true,
      '10b. GET /api/videos/:id/save-status returns saved: true'
    );

    // =============================================================
    // 11. Duplicate save is prevented
    // =============================================================
    const dupSaveRes = await makeRequest('POST', `/videos/${publishedVideo._id}/save`, {}, tokenUserB);
    const saveDocCount = await Save.countDocuments({ user: userB._id, video: publishedVideo._id });
    assert(
      dupSaveRes.status === 200 && dupSaveRes.data.saved === true && saveDocCount === 1,
      '11. Duplicate save is prevented at database and controller level'
    );

    // Verify GET /api/users/me/saved-videos returns the saved video
    const mySavedRes = await makeRequest('GET', '/users/me/saved-videos', null, tokenUserB);
    assert(
      mySavedRes.status === 200 &&
        mySavedRes.data.success &&
        mySavedRes.data.count === 1 &&
        mySavedRes.data.videos[0]._id.toString() === publishedVideo._id.toString(),
      '11b. GET /api/users/me/saved-videos returns authenticated user saved showcases'
    );

    // =============================================================
    // 12. User can unsave a video
    // =============================================================
    const unsaveRes = await makeRequest('DELETE', `/videos/${publishedVideo._id}/save`, null, tokenUserB);
    const saveDocCountAfter = await Save.countDocuments({ user: userB._id, video: publishedVideo._id });
    assert(
      unsaveRes.status === 200 &&
        unsaveRes.data.success &&
        unsaveRes.data.saved === false &&
        saveDocCountAfter === 0,
      '12. User can unsave a video'
    );

    // Re-save for testing
    await makeRequest('POST', `/videos/${publishedVideo._id}/save`, {}, tokenUserB);

    // =============================================================
    // 13. User can follow another user
    // =============================================================
    const followRes = await makeRequest('POST', `/users/${userA._id}/follow`, {}, tokenUserB);
    assert(
      followRes.status === 200 &&
        followRes.data.success &&
        followRes.data.following === true &&
        followRes.data.followerCount === 1,
      '13. User can follow another user'
    );

    // Verify GET /api/users/:userId/follow-status
    const followStatusRes = await makeRequest('GET', `/users/${userA._id}/follow-status`, null, tokenUserB);
    assert(
      followStatusRes.status === 200 && followStatusRes.data.following === true,
      '13b. GET /api/users/:userId/follow-status returns following: true'
    );

    // =============================================================
    // 14. Self-follow is rejected (400)
    // =============================================================
    const selfFollowRes = await makeRequest('POST', `/users/${userA._id}/follow`, {}, tokenUserA);
    assert(
      selfFollowRes.status === 400 && !selfFollowRes.data.success,
      '14. Self-follow is rejected with 400 Bad Request'
    );

    // =============================================================
    // 15. Duplicate follow is prevented
    // =============================================================
    const dupFollowRes = await makeRequest('POST', `/users/${userA._id}/follow`, {}, tokenUserB);
    const followDocCount = await Follow.countDocuments({ follower: userB._id, following: userA._id });
    assert(
      dupFollowRes.status === 200 && dupFollowRes.data.following === true && followDocCount === 1,
      '15. Duplicate follow is prevented at database and controller level'
    );

    // Verify Social Stats
    const socialStatsRes = await makeRequest('GET', `/users/${userA._id}/social-stats`);
    assert(
      socialStatsRes.status === 200 &&
        socialStatsRes.data.success &&
        socialStatsRes.data.followerCount === 1 &&
        socialStatsRes.data.followingCount === 0,
      '15b. GET /api/users/:userId/social-stats reports accurate follower (1) and following (0) counts'
    );

    // =============================================================
    // 16. User can unfollow another user
    // =============================================================
    const unfollowRes = await makeRequest('DELETE', `/users/${userA._id}/follow`, null, tokenUserB);
    const followCountAfterUnfollow = await Follow.countDocuments({ following: userA._id });
    assert(
      unfollowRes.status === 200 &&
        unfollowRes.data.success &&
        unfollowRes.data.following === false &&
        unfollowRes.data.followerCount === 0 &&
        followCountAfterUnfollow === 0,
      '16. User can unfollow another user'
    );

    // =============================================================
    // 17. Unauthenticated users cannot access protected social actions
    // =============================================================
    const unauthSave = await makeRequest('POST', `/videos/${publishedVideo._id}/save`, {}, null);
    const unauthComment = await makeRequest('POST', `/videos/${publishedVideo._id}/comments`, { text: 'hi' }, null);
    const unauthFollow = await makeRequest('POST', `/users/${userA._id}/follow`, {}, null);
    const unauthSavedList = await makeRequest('GET', '/users/me/saved-videos', null, null);

    assert(
      unauthSave.status === 401 &&
        unauthComment.status === 401 &&
        unauthFollow.status === 401 &&
        unauthSavedList.status === 401,
      '17. Unauthenticated users cannot access protected social actions (all return 401)'
    );

    // =============================================================
    // 18. Draft video privacy remains intact
    // =============================================================
    // Other user (User B) cannot like a draft video
    const draftLikeRes = await makeRequest('POST', `/videos/${draftVideo._id}/like`, {}, tokenUserB);
    // Other user (User B) cannot save a draft video
    const draftSaveRes = await makeRequest('POST', `/videos/${draftVideo._id}/save`, {}, tokenUserB);
    // Other user (User B) cannot comment on a draft video
    const draftCommentRes = await makeRequest(
      'POST',
      `/videos/${draftVideo._id}/comments`,
      { text: 'Sneaking comment' },
      tokenUserB
    );
    // Unauthenticated public cannot get draft comments
    const draftGetCommentsRes = await makeRequest('GET', `/videos/${draftVideo._id}/comments`, null, null);

    assert(
      draftLikeRes.status === 404 &&
        draftSaveRes.status === 404 &&
        draftCommentRes.status === 404 &&
        draftGetCommentsRes.status === 404,
      '18. Draft video privacy remains intact (inaccessible drafts reject likes, saves, comments with 404)'
    );

    // =============================================================
    // 19. Like and comment counts are correct on GET /api/videos/:id
    // =============================================================
    const videoDetailRes = await makeRequest('GET', `/videos/${publishedVideo._id}`, null, tokenUserB);
    assert(
      videoDetailRes.status === 200 &&
        videoDetailRes.data.success &&
        videoDetailRes.data.video.likeCount === 1 &&
        videoDetailRes.data.video.commentCount === 1 &&
        videoDetailRes.data.video.isLiked === true &&
        videoDetailRes.data.video.isSaved === true,
      '19. Video detail endpoint returns accurate likeCount (1), commentCount (1), isLiked (true), isSaved (true)'
    );

    // =============================================================
    // 20. Existing /api/health endpoint still works
    // =============================================================
    const healthRes = await makeRequest('GET', '/health');
    assert(
      healthRes.status === 200 &&
        healthRes.data.status === 'ok' &&
        healthRes.data.database &&
        healthRes.data.database.status === 'connected',
      '20. Existing /api/health endpoint remains fully operational'
    );

    // -------------------------------------------------------------
    // Cleanup Test Data
    // -------------------------------------------------------------
    console.log('\n🧹 Cleaning up test records...');
    await Promise.all([
      User.deleteMany({ _id: { $in: [userA._id, userB._id] } }),
      Video.deleteMany({ _id: { $in: [publishedVideo._id, draftVideo._id] } }),
      Like.deleteMany({ video: { $in: [publishedVideo._id, draftVideo._id] } }),
      Comment.deleteMany({ video: { $in: [publishedVideo._id, draftVideo._id] } }),
      Save.deleteMany({ video: { $in: [publishedVideo._id, draftVideo._id] } }),
      Follow.deleteMany({
        $or: [
          { follower: { $in: [userA._id, userB._id] } },
          { following: { $in: [userA._id, userB._id] } }
        ]
      })
    ]);
    console.log('Test data cleaned up successfully.');

    console.log(`\n========================================`);
    console.log(`Phase 4 Test Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
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
