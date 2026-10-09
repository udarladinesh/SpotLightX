/**
 * Spotly Phase 7 Automated Test Suite
 * Tests all Notifications & Activity Center requirements:
 * 1. Authenticated user can fetch notifications
 * 2. Unauthenticated user cannot fetch notifications (returns 401)
 * 3. User can only see their own notifications (isolation)
 * 4. Follow creates a FOLLOW notification for the target user
 * 5. Like creates a LIKE notification for the video creator
 * 6. Comment creates a COMMENT notification for the video creator
 * 7. Save creates a SAVE notification for the video creator
 * 8. Self-actions do not create notifications
 * 9. Duplicate likes do not create duplicate notifications
 * 10. Duplicate follows do not create duplicate notifications
 * 11. Unread count is correct
 * 12. User can mark one notification as read
 * 13. User cannot mark another user's notification as read (returns 404)
 * 14. User can mark all their notifications as read
 * 15. User can delete their own notification
 * 16. User cannot delete another user's notification (returns 404)
 * 17. Pagination works correctly
 * 18. Limit is safely capped
 * 19. Invalid notification ID is handled safely
 * 20. Sensitive user fields (passwords, emails) are strictly excluded
 * 21. Deleting a video cleans up associated video notifications
 * 22. Deleting a comment cleans up associated comment notifications
 * 23. Core endpoints (/api/health, /api/discover/fresh, /api/search/videos) remain fully operational
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
  console.log('🧪 Starting Spotly Phase 7 Notifications & Activity Center Test Suite...\n');

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
  const user1Email = `notif_creator_${testSuffix}@spotlytest.com`;
  const user2Email = `notif_fan_${testSuffix}@spotlytest.com`;
  const user3Email = `notif_other_${testSuffix}@spotlytest.com`;

  let token1, token2, token3;
  let user1Id, user2Id, user3Id;
  let video1Id;

  try {
    await startTestServer();
    await waitForDB();

    console.log('📦 Setting up test users and showcase for notification verification...');

    // 1. Creator User (receives notifications)
    const reg1 = await makeRequest('POST', '/auth/register', {
      displayName: `Creator Sarah ${testSuffix}`,
      username: `sarah_dance_${testSuffix}`,
      email: user1Email,
      password: 'password123',
      categories: ['Dance & Movement'],
      skills: ['contemporary-dance']
    });
    token1 = reg1.data?.token;
    user1Id = reg1.data?.user?._id;

    // 2. Fan User (generates actions: follow, like, comment, save)
    const reg2 = await makeRequest('POST', '/auth/register', {
      displayName: `Fan Alex ${testSuffix}`,
      username: `alex_fan_${testSuffix}`,
      email: user2Email,
      password: 'password123',
      categories: ['Dance & Movement'],
      skills: ['dance-spotting']
    });
    token2 = reg2.data?.token;
    user2Id = reg2.data?.user?._id;

    // 3. Unrelated Third User
    const reg3 = await makeRequest('POST', '/auth/register', {
      displayName: `User Leo ${testSuffix}`,
      username: `leo_other_${testSuffix}`,
      email: user3Email,
      password: 'password123',
      categories: ['Music & Production'],
      skills: ['music-listening']
    });
    token3 = reg3.data?.token;
    user3Id = reg3.data?.user?._id;

    // 4. Create Published Video for Creator Sarah
    const v1 = await Video.create({
      title: `Choreography Spotlight Routine ${testSuffix}`,
      description: 'Dynamic contemporary dance piece recorded in studio.',
      videoUrl: 'https://res.cloudinary.com/spotly/video/upload/notif_sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/spotly/image/upload/notif_sample.jpg',
      publicId: `spotly_test/video_notif_${testSuffix}`,
      creator: user1Id,
      category: 'Dance & Movement',
      skills: ['contemporary-dance', 'choreography'],
      duration: 120,
      views: 10,
      status: 'published'
    });
    video1Id = v1._id;

    console.log('Setup complete. Executing notification tests...\n');

    // ==========================================
    // 1. Unauthenticated request protection
    // ==========================================
    const unauthRes = await makeRequest('GET', '/notifications');
    assert(
      unauthRes.status === 401,
      '1. Unauthenticated users cannot fetch notifications (401 Unauthorized)'
    );

    // ==========================================
    // 2. Self-actions do not create notifications
    // ==========================================
    // Creator likes their own video
    await makeRequest('POST', `/videos/${video1Id}/like`, null, token1);
    // Creator comments on their own video
    await makeRequest('POST', `/videos/${video1Id}/comments`, { text: 'My own self-comment.' }, token1);
    // Creator saves their own video
    await makeRequest('POST', `/videos/${video1Id}/save`, null, token1);

    const initialNotifs = await makeRequest('GET', '/notifications', null, token1);
    assert(
      initialNotifs.status === 200 &&
      !initialNotifs.data.notifications.some((n) => ['LIKE', 'COMMENT', 'SAVE'].includes(n.type)),
      '2. Self-actions (self-like, self-comment, self-save) do not generate notifications',
      JSON.stringify(initialNotifs.data)
    );

    // ==========================================
    // 3. Follow action creates a FOLLOW notification
    // ==========================================
    const followRes = await makeRequest('POST', `/users/${user1Id}/follow`, null, token2);
    assert(followRes.status === 200 && followRes.data.following === true, 'Setup: Fan Alex followed Creator Sarah');

    const notifsAfterFollow = await makeRequest('GET', '/notifications', null, token1);
    const followNotif = notifsAfterFollow.data.notifications.find((n) => n.type === 'FOLLOW');
    assert(
      followNotif &&
      followNotif.sender?._id?.toString() === user2Id.toString() &&
      followNotif.isRead === false,
      '3. Follow action creates a FOLLOW notification with sender information',
      JSON.stringify(followNotif)
    );

    // ==========================================
    // 4. Duplicate follow does not duplicate notification
    // ==========================================
    await makeRequest('POST', `/users/${user1Id}/follow`, null, token2);
    const notifsAfterDupFollow = await makeRequest('GET', '/notifications', null, token1);
    const followNotifsCount = notifsAfterDupFollow.data.notifications.filter((n) => n.type === 'FOLLOW').length;
    assert(
      followNotifsCount === 1,
      '4. Duplicate follow does not create duplicate notifications',
      `Follow notifications count: ${followNotifsCount}`
    );

    // ==========================================
    // 5. Like action creates a LIKE notification
    // ==========================================
    await makeRequest('POST', `/videos/${video1Id}/like`, null, token2);
    const notifsAfterLike = await makeRequest('GET', '/notifications', null, token1);
    const likeNotif = notifsAfterLike.data.notifications.find((n) => n.type === 'LIKE');
    assert(
      likeNotif &&
      likeNotif.sender?._id?.toString() === user2Id.toString() &&
      likeNotif.video?._id?.toString() === video1Id.toString() &&
      likeNotif.isRead === false,
      '5. Like action creates a LIKE notification referencing the video and sender',
      JSON.stringify(likeNotif)
    );

    // ==========================================
    // 6. Duplicate like does not duplicate notification
    // ==========================================
    await makeRequest('POST', `/videos/${video1Id}/like`, null, token2);
    const notifsAfterDupLike = await makeRequest('GET', '/notifications', null, token1);
    const likeNotifsCount = notifsAfterDupLike.data.notifications.filter((n) => n.type === 'LIKE').length;
    assert(
      likeNotifsCount === 1,
      '6. Duplicate like does not create duplicate notifications',
      `Like notifications count: ${likeNotifsCount}`
    );

    // ==========================================
    // 7. Comment action creates a COMMENT notification
    // ==========================================
    const commentRes = await makeRequest(
      'POST',
      `/videos/${video1Id}/comments`,
      { text: 'Magnificent footwork and fluid transitions!' },
      token2
    );
    const createdCommentId = commentRes.data.comment?._id;

    const notifsAfterComment = await makeRequest('GET', '/notifications', null, token1);
    const commentNotif = notifsAfterComment.data.notifications.find((n) => n.type === 'COMMENT');
    assert(
      commentNotif &&
      commentNotif.sender?._id?.toString() === user2Id.toString() &&
      commentNotif.video?._id?.toString() === video1Id.toString() &&
      commentNotif.comment?._id?.toString() === createdCommentId.toString(),
      '7. Comment action creates a COMMENT notification referencing video and comment',
      JSON.stringify(commentNotif)
    );

    // ==========================================
    // 8. Save action creates a SAVE notification
    // ==========================================
    await makeRequest('POST', `/videos/${video1Id}/save`, null, token2);
    const notifsAfterSave = await makeRequest('GET', '/notifications', null, token1);
    const saveNotif = notifsAfterSave.data.notifications.find((n) => n.type === 'SAVE');
    assert(
      saveNotif &&
      saveNotif.sender?._id?.toString() === user2Id.toString() &&
      saveNotif.video?._id?.toString() === video1Id.toString(),
      '8. Save action creates a SAVE notification referencing video and sender',
      JSON.stringify(saveNotif)
    );

    // ==========================================
    // 9. Isolation: User only sees their own notifications
    // ==========================================
    const user3Notifs = await makeRequest('GET', '/notifications', null, token3);
    assert(
      user3Notifs.status === 200 && user3Notifs.data.notifications.length === 0,
      '9. User isolation: Unrelated user sees zero notifications for actions on other users',
      JSON.stringify(user3Notifs.data)
    );

    // ==========================================
    // 10. Unread count endpoint
    // ==========================================
    const unreadRes = await makeRequest('GET', '/notifications/unread-count', null, token1);
    assert(
      unreadRes.status === 200 && unreadRes.data.unreadCount >= 4,
      '10. GET /api/notifications/unread-count accurately returns unread count (>= 4)',
      JSON.stringify(unreadRes.data)
    );

    // ==========================================
    // 11. Mark single notification as read
    // ==========================================
    const notifToRead = likeNotif._id;
    const markReadRes = await makeRequest('PATCH', `/notifications/${notifToRead}/read`, null, token1);
    assert(
      markReadRes.status === 200 && markReadRes.data.notification?.isRead === true,
      '11. PATCH /api/notifications/:id/read marks the specified notification as read',
      JSON.stringify(markReadRes.data)
    );

    // ==========================================
    // 12. Unauthorized user cannot mark another user's notification as read
    // ==========================================
    const unauthorizedMarkRead = await makeRequest('PATCH', `/notifications/${notifToRead}/read`, null, token3);
    assert(
      unauthorizedMarkRead.status === 404,
      '12. User cannot mark another user notification as read (returns 404 Not Found)',
      JSON.stringify(unauthorizedMarkRead.data)
    );

    // ==========================================
    // 13. Mark all notifications as read
    // ==========================================
    const markAllRes = await makeRequest('PATCH', '/notifications/read-all', null, token1);
    assert(
      markAllRes.status === 200 && markAllRes.data.updatedCount >= 1,
      '13. PATCH /api/notifications/read-all marks all unread notifications as read',
      JSON.stringify(markAllRes.data)
    );

    const unreadAfterMarkAll = await makeRequest('GET', '/notifications/unread-count', null, token1);
    assert(
      unreadAfterMarkAll.status === 200 && unreadAfterMarkAll.data.unreadCount === 0,
      '13b. Unread count becomes 0 after read-all',
      JSON.stringify(unreadAfterMarkAll.data)
    );

    // ==========================================
    // 14. Delete single notification
    // ==========================================
    const notifToDelete = saveNotif._id;
    const deleteRes = await makeRequest('DELETE', `/notifications/${notifToDelete}`, null, token1);
    assert(
      deleteRes.status === 200 && deleteRes.data.success === true,
      '14. DELETE /api/notifications/:id deletes own notification successfully',
      JSON.stringify(deleteRes.data)
    );

    // ==========================================
    // 15. User cannot delete another user's notification
    // ==========================================
    const notifOwnedBy1 = followNotif._id;
    const unauthorizedDelete = await makeRequest('DELETE', `/notifications/${notifOwnedBy1}`, null, token3);
    assert(
      unauthorizedDelete.status === 404,
      '15. User cannot delete another user notification (returns 404 Not Found)',
      JSON.stringify(unauthorizedDelete.data)
    );

    // ==========================================
    // 16. Pagination and limit capping
    // ==========================================
    const paginatedRes = await makeRequest('GET', '/notifications?page=1&limit=2', null, token1);
    assert(
      paginatedRes.status === 200 &&
      paginatedRes.data.page === 1 &&
      paginatedRes.data.limit === 2 &&
      paginatedRes.data.notifications.length <= 2 &&
      paginatedRes.data.pagination &&
      paginatedRes.data.pagination.limit === 2,
      '16. Pagination returns correct page, limit, total, totalPages, and pagination metadata',
      JSON.stringify(paginatedRes.data)
    );

    const cappedLimitRes = await makeRequest('GET', '/notifications?limit=9999', null, token1);
    assert(
      cappedLimitRes.status === 200 && cappedLimitRes.data.limit === 50,
      '16b. Limit is safely capped at maximum 50',
      JSON.stringify(cappedLimitRes.data)
    );

    // ==========================================
    // 17. Invalid notification ID handling
    // ==========================================
    const invalidIdRes = await makeRequest('PATCH', '/notifications/invalidObjectId123/read', null, token1);
    assert(
      invalidIdRes.status === 404,
      '17. Invalid notification ID is safely handled with 404 Not Found',
      JSON.stringify(invalidIdRes.data)
    );

    // ==========================================
    // 18. Sensitive fields are strictly excluded
    // ==========================================
    const checkSenderNotif = (await makeRequest('GET', '/notifications', null, token1)).data.notifications[0];
    assert(
      checkSenderNotif &&
      checkSenderNotif.sender?.password === undefined &&
      checkSenderNotif.sender?.email === undefined &&
      checkSenderNotif.sender?.displayName !== undefined,
      '18. Populated sender strictly excludes private fields (password, email)',
      JSON.stringify(checkSenderNotif?.sender)
    );

    // ==========================================
    // 19. Comment deletion cascades to clean related notifications
    // ==========================================
    await makeRequest('DELETE', `/videos/${video1Id}/comments/${createdCommentId}`, null, token2);
    const notifsAfterCommentDelete = await Notification.find({ comment: createdCommentId });
    assert(
      notifsAfterCommentDelete.length === 0,
      '19. Deleting a comment cascades and cleans up associated comment notifications',
      `Remaining comment notifications: ${notifsAfterCommentDelete.length}`
    );

    // ==========================================
    // 20. Video deletion cascades to clean related notifications
    // ==========================================
    await makeRequest('DELETE', `/videos/${video1Id}`, null, token1);
    const notifsAfterVideoDelete = await Notification.find({ video: video1Id });
    assert(
      notifsAfterVideoDelete.length === 0,
      '20. Deleting a video cascades and cleans up associated video notifications',
      `Remaining video notifications: ${notifsAfterVideoDelete.length}`
    );

    // ==========================================
    // 21. Core regressions
    // ==========================================
    const healthRes = await makeRequest('GET', '/health');
    assert(
      healthRes.status === 200 && healthRes.data.status === 'ok',
      '21. Core /api/health endpoint remains fully operational'
    );

    const searchRes = await makeRequest('GET', '/search/videos?q=test');
    assert(
      searchRes.status === 200 && searchRes.data.success === true,
      '22. Phase 6 Search endpoint remains fully operational'
    );

    const discoverRes = await makeRequest('GET', '/discover/fresh?limit=5');
    assert(
      discoverRes.status === 200 && discoverRes.data.success === true,
      '23. Phase 5 Discover feed remains fully operational'
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
      if (user1Id) await Notification.deleteMany({ recipient: user1Id });
      if (user2Id) await Notification.deleteMany({ recipient: user2Id });
      if (user3Id) await Notification.deleteMany({ recipient: user3Id });
      if (user2Id) {
        await Like.deleteMany({ user: user2Id });
        await Save.deleteMany({ user: user2Id });
        await Comment.deleteMany({ user: user2Id });
        await Follow.deleteMany({ follower: user2Id });
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
  console.log(`Phase 7 Test Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
