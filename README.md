<<<<<<< HEAD
# Campus Notifications Frontend

This Next.js application implements the frontend assessment for the campus notifications platform.

## Features

- Responsive React interface using Material UI.
- Priority inbox showing the top `n` unread notifications.
- All notifications page with filtering by type and pagination.
- Notification read-state persistence in browser local storage.
- Server-side proxy for the evaluation notifications API.
- Logging integration using the existing `logging_middleware` package.

## Setup

1. Install dependencies:

   ```bash
   cd notification_app_fe
   npm install
   ```

2. Copy `.env.example` to `.env.local` or `.env` and provide a valid `ACCESS_TOKEN`.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open the app at `http://localhost:3000`.

## Notes

- The app proxies notification requests through `/api/notifications` to avoid CORS issues and to log request activity.
- The priority inbox sorts unread notifications by type and recency with placement notifications ranked highest.

=======
# 2330222
>>>>>>> 6c28e102e3705f616f8e8cf5baffed5c53e3d38e
