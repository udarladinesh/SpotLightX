# Spotly — Discovery-First Video Platform for Emerging Talent

> **"Where Emerging Talent Takes Center Stage"**  
> Built with MERN Stack (MongoDB Atlas, Express.js, React + Vite, Node.js) with Cloudinary video hosting, rich social interactions, talent discovery feeds, search, and a comprehensive notifications & activity center.

---

## 🚀 Implemented Phases Overview

LIVE DEMO-https://spot-light-x.vercel.app/

- **Phase 1: Project Foundation & Health Monitoring**  
  Centralized Express architecture, MongoDB Atlas connection handling, health checks with latency monitoring, and glassmorphic UI.
- **Phase 2: Authentication & Creator Profiles**  
  JWT authentication, bcrypt password hashing, input validation, role-based protection, and public creator portfolios.
- **Phase 3: Video Upload & Cloud Storage**  
  Cloudinary video and thumbnail streaming, multipart upload handling, metadata management, draft privacy, and view cooldown tracking.
- **Phase 4: Social Features & Community Engagement**  
  Video likes & unlikes, real-time like counts, comment threads with author deletion, bookmarking / saved showcases, creator follow / unfollow relationships, and social stats.
- **Phase 5: Fresh Discovery & Trending Feed**  
  Rule-based discovery feeds (Fresh, Trending with time-decay scoring, Following feed, Category filter chips), compound indexing, responsive discovery page UI, and safe pagination.
- **Phase 6: Search & Talent Discovery**  
  Full-text & multi-field search for published showcases and creator profiles, talent category & skill tag filtering, combined queries, secure profile serialization, ReDoS-safe regex escaping, pagination, dedicated `/search` page, and `CreatorCard` components.
- **Phase 7: Notifications & Activity Center**  
  Notification data model, automated notification triggers (Follows, Likes, Comments, Saves, Video Published) with duplicate & self-action suppression, unread count tracking, cascading cleanup on content deletion, interactive `NotificationBell` in Navbar, and a dedicated `/notifications` management center.
- **Phase 8: Creator Analytics & Insights**  
  Rule-based and statistical creator performance telemetry, high-level portfolio overview (published videos, views, likes, comments, saves, followers, following, interactions, engagement rate), top-performing showcase scoring formula, period-based follower growth tracking (7d, 30d, 90d, all), recent interaction activity stream, paginated showcase telemetry table, and responsive SVG growth charts. Strictly statistical, zero AI/ML/recommendation engine.
- **Phase 11: UI/UX & Performance Polish**  
  Platform-wide design consistency, responsive mobile navigation drawer with backdrop, route-based code splitting (`React.lazy` + `Suspense`), optimized vendor chunking (cutting entry bundle from 413 kB to 20 kB), elimination of duplicate API requests in Creator Analytics, image `onError` fallbacks, video playback error recovery overlay, shimmer skeleton loaders, Set-based list deduplication, and full keyboard/ARIA accessibility.

---

## 📁 Project Architecture

```
SpotLightX/
├── .gitignore               # Root git ignore
├── package.json             # Root scripts for running backend and frontend
├── README.md                # Comprehensive project documentation
├── backend/                 # Node.js + Express REST API
│   ├── .env.example         # Backend environment template
│   ├── .env                 # Local backend configuration (ignored in git)
│   ├── package.json         # Backend dependencies & scripts
│   ├── server.js            # Server entrypoint & middleware mounting
│   ├── test_phase2.js       # Phase 2 test suite
│   ├── test_phase3.js       # Phase 3 test suite
│   ├── test_phase4.js       # Phase 4 social features test suite
│   ├── test_phase5.js       # Phase 5 discovery & trending test suite
│   ├── test_phase6.js       # Phase 6 search & talent discovery test suite
│   ├── test_phase7.js       # Phase 7 notifications & activity center test suite
│   ├── test_phase8.js       # Phase 8 creator analytics & insights test suite
│   └── src/
│       ├── config/          # Database configuration (Mongoose)
│       ├── controllers/     # Route handlers (auth, user, video, like, comment, save, follow, discover, search, notification, analytics)
│       ├── middleware/      # JWT auth, Multer upload, 404, & centralized error handler
│       ├── models/          # User, Video, Like, Comment, Save, Follow, Notification
│       ├── routes/          # API route definitions (auth, user, video, health, discover, search, notification, analytics)
│       ├── services/        # Cloudinary storage, discoverService, searchService, notificationService, analyticsService
│       └── utils/           # JWT generation & token utilities
└── frontend/                # React 18 + Vite Client
    ├── .env.example         # Frontend environment template
    ├── .env                 # Frontend local environment config
    ├── package.json         # Frontend dependencies & scripts
    ├── vite.config.js       # Vite build & proxy configuration
    ├── index.html           # HTML template
    └── src/
        ├── components/      # NotificationBell, CreatorCard, VideoCard, LikeButton, SaveButton, FollowButton, CommentSection, Navbar, Footer, Hero, CategoriesPreview
        ├── context/         # AuthContext (JWT management & session handling)
        ├── pages/           # AnalyticsPage, NotificationsPage, SearchPage, DiscoverPage, HomePage, VideoDetailsPage, SavedVideosPage, ProfilePage, PublicProfilePage, UploadVideoPage
        ├── services/        # Axios API client, authService, userService, videoService, socialService, discoverService, searchService, notificationService, analyticsService
        └── index.css        # Design tokens, glassmorphism, analytics dashboard, notifications UI, search bar, creator cards, category chips, & responsive grid
```

---

## 🗄️ Database Models & Indexes

### Notification Schema (`backend/src/models/Notification.js`)
- `recipient`: ObjectId reference to `User` (required, indexed)
- `sender`: ObjectId reference to `User` (optional, indexed)
- `type`: String enum: `FOLLOW`, `LIKE`, `COMMENT`, `SAVE`, `VIDEO_PUBLISHED` (required)
- `message`: String (required)
- `video`: ObjectId reference to `Video` (optional, indexed)
- `comment`: ObjectId reference to `Comment` (optional)
- `isRead`: Boolean (default: `false`, indexed)
- `timestamps`: `createdAt`, `updatedAt`

#### Notification Indexes
- `{ recipient: 1, createdAt: -1 }`: Fast retrieval of user notifications sorted by newest first.
- `{ recipient: 1, isRead: 1, createdAt: -1 }`: Instant unread notification count lookups.
- `{ recipient: 1, sender: 1, type: 1, video: 1 }`: Fast duplicate notification suppression lookups.
- `{ video: 1 }`: Fast cascading deletion when a video is permanently removed.

### Video Indexes (`backend/src/models/Video.js`)
- `{ status: 1, createdAt: -1 }`: Fast queries for default Fresh Feed.
- `{ status: 1, category: 1, createdAt: -1 }`: Fast queries for category-filtered Fresh & Trending feeds.
- `{ status: 1, creator: 1, createdAt: -1 }`: Fast queries for Following Feed (`$in` creators).
- `{ status: 1, skills: 1 }`: Fast queries for skill-filtered video search.
- `{ creator: 1, createdAt: -1 }`: Fast creator showcase lookups.
- `{ creator: 1, status: 1, createdAt: -1 }`: Instant queries for creator published showcases & analytics aggregations.
- `{ category: 1, createdAt: -1 }`: General category sorting.

### Save Indexes (`backend/src/models/Save.js`)
- `{ user: 1, video: 1 }` (unique): Prevents duplicate saves per user.
- `{ user: 1, createdAt: -1 }`: Fast queries for user's saved showcases.
- `{ video: 1, createdAt: -1 }`: Fast video save count queries & analytics aggregations.

### User Indexes (`backend/src/models/User.js`)
- `{ username: 1 }` (unique): Fast creator profile lookups.
- `{ categories: 1 }`: Fast category-filtered creator searches.
- `{ skills: 1 }`: Fast skill-filtered creator searches.
- `{ createdAt: -1 }`: Predictable creator recency sorting.

---

## 📡 REST API Reference

### Phase 8 Creator Analytics Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/overview` | Required | High-level summary of creator performance: `totalVideos` (published), `totalViews`, `totalLikes`, `totalComments`, `totalSaves`, `totalFollowers`, `totalFollowing`, `totalInteractions`, and `engagementRate`. Only published videos contribute. |
| `GET` | `/api/analytics/videos` | Required | Paginated list of creator's published showcases with views, likes, comments, saves, and calculated engagement score. Supports `page` (default 1) and `limit` (default 10, max 50). |
| `GET` | `/api/analytics/top-videos` | Required | Creator's top 5 published showcases ranked strictly by raw engagement score: `views + (likes * 3) + (comments * 5) + (saves * 4)`. |
| `GET` | `/api/analytics/followers` | Required | Follower metrics for creator across periods (`7d`, `30d`, `90d`, `all`). Returns `currentFollowers`, `currentFollowing`, `newFollowers`, and historical daily growth data. |
| `GET` | `/api/analytics/activity` | Required | Recent 10–20 creator interactions (follows, likes, comments, saves) referencing the creator's portfolio. Strictly excludes sensitive user fields. |

### Phase 7 Notification Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Required | Get paginated notifications for the authenticated user, newest first. Supports `page` (default 1) and `limit` (default 20, max 50). Returns populated sender and video summary. |
| `GET` | `/api/notifications/unread-count` | Required | Get the real-time unread notification count for the authenticated user (`{ unreadCount: N }`). |
| `PATCH` | `/api/notifications/:id/read` | Required | Mark a specific notification as read. Verifies recipient ownership; returns 404 if not found or unauthorized. |
| `PATCH` | `/api/notifications/read-all` | Required | Mark all unread notifications belonging to the authenticated user as read. |
| `DELETE` | `/api/notifications/:id` | Required | Delete a specific notification. Verifies recipient ownership; returns 404 if not found or unauthorized. |

### Phase 6 Search Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/search/videos` | Public / Optional | Search published showcases by text (`title`, `description`, `skills`), `category`, and `skill`. Returns populated creator and social metrics. |
| `GET` | `/api/search/creators` | Public / Optional | Search creator profiles by text (`displayName`, `username`, `bio`, `location`, `skills`), `category`, and `skill`. Returns safe profile data with follower, showcase, and following counts. |

### Phase 5 Discovery Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/discover/fresh` | Public / Optional | Get published videos sorted strictly by newest upload date (`createdAt: -1`). Supports pagination & `category`. |
| `GET` | `/api/discover/trending` | Public / Optional | Get trending published videos sorted by rule-based engagement score with recency decay. Supports pagination & `category`. |
| `GET` | `/api/discover/following` | Required | Get published videos from creators followed by the authenticated user (`createdAt: -1`). Supports pagination & `category`. |

### Notification Response Schema
```json
{
  "success": true,
  "count": 2,
  "total": 5,
  "totalPages": 3,
  "page": 1,
  "limit": 2,
  "hasNextPage": true,
  "notifications": [
    {
      "_id": "6ab6c799895066ebafaf8c61",
      "recipient": "6ab6c797895066ebafaf8c14",
      "sender": {
        "_id": "6ab6c797895066ebafaf8c21",
        "displayName": "Alex Rivera",
        "username": "alex_rivera",
        "profileImage": "https://..."
      },
      "type": "FOLLOW",
      "message": "Alex Rivera started following you",
      "isRead": false,
      "createdAt": "2026-09-25T19:00:00.000Z"
    },
    {
      "_id": "6ab6c799895066ebafaf8c76",
      "recipient": "6ab6c797895066ebafaf8c14",
      "sender": {
        "_id": "6ab6c797895066ebafaf8c21",
        "displayName": "Alex Rivera",
        "username": "alex_rivera",
        "profileImage": "https://..."
      },
      "type": "LIKE",
      "message": "Alex Rivera liked your showcase",
      "video": {
        "_id": "6ab6c798895066ebafaf8c2f",
        "title": "Contemporary Hip Hop Routine",
        "thumbnailUrl": "https://..."
      },
      "isRead": false,
      "createdAt": "2026-09-25T19:01:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 5,
    "totalPages": 3,
    "hasNextPage": true
  }
}
```

---

## 🛡️ Security, Privacy & Analytics Architecture

1. **Authentication & Recipient Identity Verification**: Every analytics and notification endpoint strictly requires a valid JWT. The user ID is retrieved exclusively from `req.user._id` on the server—frontend-supplied user IDs are never trusted or accepted for cross-user queries.
2. **Draft Privacy & Metric Integrity**: Public search, discovery feeds, and creator analytics strictly mandate `{ status: 'published' }`. Draft showcases are never exposed or counted towards public performance metrics or view counts.
3. **Safe Metric Calculations**: Engagement rate evaluates as `(Likes + Comments + Saves) / Views * 100`. When `views === 0`, it strictly evaluates to `0` and never returns `NaN` or `Infinity`.
4. **Optimized Aggregations (Zero N+1 Queries)**: All overview counts, video performance lists, and top showcase metrics use native MongoDB aggregations (`$group`, `$match`) and grouped queries, avoiding N+1 query overhead.
5. **Safe Sender Projections**: When activity or notification feeds are retrieved, populated sender documents strictly project safe public fields (`displayName`, `username`, `profileImage`), ensuring passwords, emails, and internal credentials are never leaked.
6. **Self-Action Suppression**: The notification engine automatically checks `sender.toString() === recipient.toString()` and suppresses notifications for self-likes, self-comments, self-saves, or self-follows.
7. **Duplicate Prevention**: For idempotent social interactions (likes, follows, saves), the notification service checks for existing unread notifications matching `(recipient, sender, type, video)` before creating duplicates.
8. **Cascading Cleanup**: Deleting a video permanently cascades to delete all associated video notifications. Deleting a comment cascades to clean up its corresponding comment notification.
9. **ReDoS Protection & Regex Escaping**: All user-provided search strings are sanitized through a strict regex escaping utility (`escapeRegex(text)`), escaping special metacharacters (`.*+?^${}()|[]\`) to prevent query injection and regular expression denial-of-service (ReDoS) attacks.

---

## 🧪 Testing & Verification

### Running Automated Test Suites

```bash
# Phase 8 Creator Analytics & Insights Test Suite (25 Tests)
cd backend && node test_phase8.js

# Phase 7 Notifications & Activity Center Test Suite (26 Tests)
cd backend && node test_phase7.js

# Phase 6 Search & Talent Discovery Test Suite (23 Tests)
cd backend && node test_phase6.js

# Phase 5 Fresh Discovery & Trending Feed Test Suite (20 Tests)
cd backend && node test_phase5.js

# Phase 4 Social Features Test Suite (25 Tests)
cd backend && node test_phase4.js

# Phase 3 Video Upload & Cloudinary Test Suite (21 Tests)
cd backend && node test_phase3.js

# Phase 2 Authentication & Profiles Test Suite (18 Tests)
cd backend && node test_phase2.js
```

### Building the Frontend

```bash
cd frontend && npm run build
```

---

## 🎨 Phase 11 — UI/UX & Performance Polish

Phase 11 focuses strictly on visual refinement, responsive layout stability, accessibility, and frontend performance optimizations while keeping all backend contracts and business logic completely intact:

### 1. Bundle Splitting & Lazy Route Loading
- **Route-Based Code Splitting**: Migrated all 16 pages in `App.jsx` from eager static imports to dynamic `React.lazy` imports wrapped in a `Suspense` boundary with a branded `PageLoader` indicator.
- **Rollup Vendor Chunking**: Configured manual vendor chunking in `vite.config.js` (`vendor-react`, `vendor-router`, `vendor-icons`, `vendor-axios`).
- **Impact**: Reduced initial entry chunk size from **413.75 kB** down to **20.71 kB** (~95% decrease in entry bundle weight) and cut build time from **28.68s** to **12.87s** (~55% faster).

### 2. Elimination of Cascading & Duplicate API Requests
- **Creator Analytics Effect Optimization**: Refactored `AnalyticsPage.jsx` data fetching effects. Previously, changing the follower period (`7d`, `30d`, `90d`, `all`) or paginating showcases re-triggered the master `fetchDashboardData` effect, causing 5 redundant API calls on every interaction. Now, initial load executes once, while period selection and pagination update only their respective data slices independently.
- **Set-Based List Deduplication**: Applied Set-based ID deduplication across `DiscoverPage`, `SearchPage`, `CommentSection`, `SavedVideosPage`, and `NotificationsPage` to eliminate duplicate item rendering during rapid pagination or race conditions.

### 3. Responsive Navigation & Mobile Drawer
- **Responsive Mobile Menu**: Added an accessible mobile hamburger toggle and slide-out navigation drawer (`.mobile-nav-drawer`) with a frosted backdrop for screens $\le$ 768px.
- **Mobile Usability**: Mobile users can effortlessly navigate between Discover, Search, Analytics, Upload, Notifications, Profile, My Videos, Saved Showcases, and Sign In/Out without navigation bar overflow.
- **Badge Modernization**: Replaced outdated phase-specific badges on Navbar and Footer with unified platform tags (`Talent Discovery`, `Spotly Platform • Talent Discovery`).

### 4. Video Experience & Asset Fallbacks
- **Graceful Playback Recovery**: Added an error boundary and overlay (`.video-player-error-overlay`) to `VideoDetailsPage.jsx`. If a video fails to stream or encounters a network disruption, a friendly recovery card is rendered with an in-place "Retry Playback" action without crashing the layout.
- **Asset Fallback Protection**: Added `onError` fallback handlers on avatars and thumbnails across `VideoCard`, `CreatorCard`, `Navbar`, `VideoDetailsPage`, `ProfilePage`, `SavedVideosPage`, and `AnalyticsPage` to prevent broken image icons from disrupting the UI.
- **CLS Prevention**: Preserved strict 16:9 aspect ratios (`aspect-ratio: 16 / 9`) on all thumbnail wraps and video players, supplemented by `loading="lazy"` and `decoding="async"`.

### 5. Skeleton Loaders, Empty States & Usability
- **Shimmer Skeletons**: Added structured shimmer skeleton states for the video details page, saved showcases collection, discover feed, and creator search results.
- **Enhanced Empty States**: Standardized empty states with descriptive messaging, relevant icons, and actionable CTA buttons (e.g., "Explore Showcases", "Upload Showcase").
- **Accessibility Enhancements**: Added keyboard-visible focus rings (`:focus-visible`), `aria-expanded` and `aria-label` tags on icon buttons, and accessible ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) on destructive action confirmation dialogs.

---

## 💡 Known Limitations

- **Rule-Based Statistical Analytics Only**: Phase 8 strictly uses rule-based statistical metrics and deterministic formulas (such as `views + (likes * 3) + (comments * 5) + (saves * 4)` for top showcases). No AI, machine learning, predictive modeling, embeddings, or recommendation algorithms are implemented.
- **WebSockets / Push Notifications**: Real-time push via WebSockets or Web Push is not implemented in this phase. Spotly currently uses visibility-aware lightweight periodic polling (45s) and event-driven optimistic refreshes across component boundaries.
- **Fuzzy Typo Tolerance**: Basic regex search requires substring matches; fuzzy phonetic or edit-distance matching is not included in this phase.
- **Complex Query Operators**: Boolean search operators (such as `AND`, `OR`, `NOT`, quotes for exact phrases) are treated as literal text.
- **Nested Replies**: Comments support single-level threads; multi-tier nested comment threads are planned for a subsequent update.
