# Spotly — Discovery-First Video Platform for Emerging Talent

> **Phase 1: Project Foundation**  
> Built with MERN Stack (MongoDB Atlas, Express.js, React + Vite, Node.js).

---

## 📁 Project Architecture

```
SpotLightX/
├── .gitignore               # Root git ignore
├── package.json             # Root scripts for concurrently running backend and frontend
├── README.md                # Project documentation
├── backend/                 # Node.js + Express API
│   ├── .env.example         # Environment template
│   ├── .env                 # Local environment config
│   ├── package.json         # Backend dependencies and scripts
│   ├── server.js            # Server entrypoint & middleware mounting
│   └── src/
│       ├── config/          # Database connection (Mongoose)
│       ├── controllers/     # Health check & route controllers
│       ├── middleware/      # Centralized error handling & 404 handler
│       ├── models/          # Schema models (ready for Phase 2)
│       ├── routes/          # API route definitions
│       ├── services/        # Business logic services
│       └── utils/           # Shared utilities
└── frontend/                # React + Vite Client
    ├── .env.example         # Frontend environment template
    ├── .env                 # Frontend local environment config
    ├── package.json         # Frontend dependencies and scripts
    ├── vite.config.js       # Vite build & proxy configuration
    ├── index.html           # HTML template
    └── src/
        ├── components/      # Navbar, Hero, HealthWidget, CategoriesPreview, Footer
        ├── services/        # Centralized Axios API service with latency monitoring
        ├── index.css        # Design tokens & glassmorphic styles
        ├── App.jsx          # Root component
        └── main.jsx         # React DOM mount
```

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```

> **Note on MongoDB**: If `MONGODB_URI` is not yet configured, the backend starts gracefully and informs you of the missing URI without crashing. You can add your MongoDB Atlas URI at any time.

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```
*Or install separately in each folder:*
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Run in Development Mode
To run both backend and frontend together:
```bash
npm run dev
```

Or run them individually:
```bash
# Terminal 1: Backend (http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend (http://localhost:5173)
npm run dev:frontend
```

---

## 🩺 Health Check API

- **Endpoint**: `GET http://localhost:5000/api/health`
- **Response Format**:
```json
{
  "status": "ok",
  "service": "Spotly Backend API",
  "version": "1.0.0",
  "environment": "development",
  "uptime": {
    "seconds": 42,
    "formatted": "42s"
  },
  "timestamp": "2026-09-22T09:35:00.000Z",
  "database": {
    "status": "disconnected",
    "host": null,
    "databaseName": null,
    "error": "MONGODB_URI is not set..."
  }
}
```
