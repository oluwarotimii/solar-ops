# SolarOps

Solar Field Operations Management Platform

## PWA (Progressive Web App) Setup

This application is configured as a PWA. To update the app icons:

1. Replace `public/icon.png` with your new icon (should be at least 512x512 pixels)
2. Run `npm run generate-icons` to automatically generate all required icon sizes

The PWA should now properly install as a standalone app with the correct icons on both mobile and desktop platforms.

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`
DATABASE_URL="your-neon-database-url-here"
JWT_SECRET="your-secure-jwt-secret-at-least-32-characters"
\`\`\`

### 2. Database Setup

Run these SQL scripts in your database SQL editor (in order):

1. **Create Tables**: Run `database/01-create-tables.sql`
2. **Insert Default Data**: Run `database/02-insert-default-data.sql`

### 3. Start the Application

\`\`\`bash
npm install
npm run dev
\`\`\`

### 4. First Login

Visit `http://localhost:3000/login` and use:
- **Email**: admin@solar.com  
- **Password**: admin123

**⚠️ Change this password immediately after first login!**

## 🔧 Features

- ✅ Job Management with multi-technician assignments
- ✅ Real-time GPS tracking with OpenStreetMap
- ✅ Earnings management with percentage-based calculations
- ✅ Maintenance scheduling and reminders
- ✅ Push notifications
- ✅ Nigerian localization (Naira currency, WAT timezone)
- ✅ Complete REST API for mobile apps

## 📱 API Endpoints

All API endpoints are documented in the original README. Key endpoints:

- `POST /api/auth/login` - Authentication
- `GET /api/jobs` - Job management
- `POST /api/tracking/gps` - GPS tracking
- `GET /api/tracking/technicians` - Live technician locations

## 🇳🇬 Nigerian Context

- Currency: Nigerian Naira (₦)
- Timezone: West Africa Time (WAT)
- Phone format: +234-XXX-XXX-XXXX
- Locations: Lagos, Abuja, Port Harcourt, etc.

## 🔐 Security

- JWT-based authentication
- Role-based access control
- Secure password hashing
- Input validation and sanitization

## 📞 Support
+2349033349548

Built for Nigerian Solar Field Operations with ❤️
