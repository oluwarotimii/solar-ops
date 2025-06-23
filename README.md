# Solar Field Operations Management Platform 🇳🇬

A comprehensive platform for managing solar field operations in Nigeria, including job management, technician tracking, maintenance scheduling, and performance tracking with real-time GPS monitoring.

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+ 
- Neon PostgreSQL database
- Nigerian phone number for SMS notifications (optional)

### Installation

1. **Clone and install dependencies**
   \`\`\`bash
   git clone <repository-url>
   cd solar-ops-platform
   npm install
   \`\`\`

2. **Environment Setup**
   Create `.env.local` file:
   \`\`\`bash
   # Database (Required)
   DATABASE_URL=postgresql://username:password@host:5432/database

   # Authentication (Required)
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   
   # Cron Jobs (Required)
   CRON_SECRET=your-cron-secret-key

   # Push Notifications (Optional)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   VAPID_EMAIL=mailto:your-email@domain.com

   # SMS Notifications (Optional - Nigerian providers)
   SMS_API_KEY=your-sms-provider-api-key
   SMS_SENDER_ID=YourCompany
   \`\`\`

3. **Database Setup**
   \`\`\`bash
   npm run setup-db
   npm run test-db
   \`\`\`

4. **Start Development**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Access Application**
   - Web: http://localhost:3000
   - Login with demo accounts (see below)

## 👥 Demo Accounts

All demo accounts use password: **`demo123`**

| Role | Email | Access Level |
|------|-------|-------------|
| **Super Admin** | `superadmin@demo.com` | Full system access |
| **Admin** | `admin@demo.com` | User management, job creation |
| **Supervisor** | `supervisor@demo.com` | Job management, tracking |
| **Technician** | `tech1@demo.com` | Emeka Okafor - View jobs, check-in/out |
| **Technician** | `tech2@demo.com` | Adebayo Adeyemi - View jobs, check-in/out |
| **Technician** | `tech3@demo.com` | Fatima Aliyu - View jobs, check-in/out |
| **Technician** | `tech4@demo.com` | Chinedu Okwu - View jobs, check-in/out |

## 📱 Mobile App API Routes

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "tech1@demo.com",
  "password": "demo123"
}

Response:
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "tech1@demo.com",
    "firstName": "Emeka",
    "lastName": "Okafor",
    "role": "Technician"
  }
}
