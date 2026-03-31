# 🎓 Placement Portal

A production-grade full-stack college placement management portal built with the MERN stack. Designed to streamline the entire placement process — from student onboarding to final selections.

🔗 **Live Demo:** [placement-portal-red.vercel.app](https://placement-portal-red.vercel.app)

---

## 🔐 Demo Credentials

### Admin Login
| Field    | Value                          |
|----------|-------------------------------|
| Email    | kumarjhanitesh09@gmail.com    |
| Password | Admin@123                     |

### Student Login
> Register a new account using any **@gmail.com** email address.

---

## ✨ Features

### 👨‍🎓 Student Side
- Register with university email + OTP verification
- Browse job listings with real-time eligibility check
- Apply to companies (server-side eligibility engine)
- Track application status with round-by-round progress stepper
- Withdraw application (if status is "applied" and deadline not passed)
- Upload resume (PDF) and profile photo
- Manage profile — CGPA, skills, 10th/12th marks, backlogs
- Change password from profile
- Forgot password via OTP email
- Contact placement cell with FAQ section
- View offer letter download

### 👨‍💼 Admin Side
- Dashboard with placement statistics, charts, and top companies
- Create and manage job postings with full eligibility criteria
  - Min CGPA, 10th/12th marks, branch, backlogs, year
- View and manage all applicants per company
- Update application status individually
- **Bulk update from company Excel** — auto-detect roll numbers, dry-run preview, partial updates
- Export applicants to Excel with resume links
- **Bulk import students via Excel** — auto-create accounts, send activation emails
- Verify / debar / reinstate students
- View and edit full student profile
- Lock student profile (prevents editing of academic data)
- Send bulk email notifications by branch
- Audit logs for all bulk operations

### 🔐 Security & Auth
- JWT access + refresh token rotation
- Role-based access control (Student / Admin)
- Hybrid onboarding system
  - Admin import → activation email → student sets password
  - Self signup → OTP verification → admin approves
- Crypto-secure activation tokens (SHA-256)
- Profile locking to protect academic data integrity
- Student debarring system with email notification
- Account status system (pending_activation / pending_verification / active)

### ⚡ Performance
- Server-side caching with Node-Cache (99% faster on repeat requests)
- MongoDB compound indexes on all critical collections
- Pagination on all major endpoints
- Query optimization with .lean() and Promise.all()
- API response times reduced from ~470ms to under 5ms on cached endpoints

---

## 🛠️ Tech Stack

| Layer      | Technology                              |
|------------|----------------------------------------|
| Frontend   | React.js, Vite, Tailwind CSS           |
| Backend    | Node.js, Express.js                    |
| Database   | MongoDB Atlas                          |
| Auth       | JWT (Access + Refresh Tokens)          |
| Email      | Brevo SMTP                             |
| Storage    | Cloudinary                             |
| Caching    | Node-Cache                             |
| Deployment | Vercel (Frontend), Render (Backend)    |
| Analytics  | Vercel Analytics                       |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account
- Brevo account (for email)

### Clone the repository
```bash
git clone https://github.com/niteshhh001/Placement_Portal.git
cd Placement_Portal
```

### Backend Setup
```bash
cd Backend
npm install
```

Create `Backend/.env`:
```
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_email
SMTP_PASS=your_brevo_smtp_key
EMAIL_FROM=your_email
CLIENT_URL=http://localhost:5173
UNIVERSITY_DOMAIN=gmail.com
```

Seed admin account:
```bash
node utils/seedAdmin.js
```

Start backend:
```bash
npm run dev
```

### Frontend Setup
```bash
cd Frontend
npm install
```

Create `Frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_UNIVERSITY_DOMAIN=gmail.com
```

Start frontend:
```bash
npm run dev
```

---

## 📁 Project Structure
```
Placement_Portal/
├── Backend/
│   ├── controllers/        # Business logic
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Auth, validation, error handling
│   ├── utils/              # Cache, email, cron, seed
│   └── server.js
│
└── Frontend/
    └── src/
        ├── pages/
        │   ├── admin/      # Admin pages
        │   └── student/    # Student pages
        ├── components/     # Shared components
        ├── context/        # Auth, Theme context
        ├── api/            # Axios instance
        └── auth/           # Protected routes
```

---

## 📊 API Endpoints

### Auth
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/student/register  | Register + send OTP      |
| POST   | /api/auth/student/verify-otp| Verify OTP + create acc  |
| POST   | /api/auth/login             | Login (student + admin)  |
| POST   | /api/auth/refresh           | Refresh access token     |
| POST   | /api/auth/forgot-password   | Send reset OTP           |
| POST   | /api/auth/reset-password    | Reset password           |
| POST   | /api/auth/activate          | Activate imported account|
| POST   | /api/auth/resend-activation | Resend activation email  |

### Student
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | /api/student/profile      | Get own profile      |
| PATCH  | /api/student/profile      | Update profile       |
| POST   | /api/student/resume       | Upload resume        |
| POST   | /api/student/photo        | Upload photo         |
| POST   | /api/student/contact      | Contact placement cell|
| POST   | /api/student/change-password | Change password   |

### Jobs
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/jobs             | Get all jobs + eligibility|
| GET    | /api/jobs/:id         | Get job details          |
| POST   | /api/jobs/:id/apply   | Apply to job             |

### Applications
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/applications/me  | Get my applications      |
| DELETE | /api/applications/:id | Withdraw application     |

### Admin
| Method | Endpoint                           | Description              |
|--------|------------------------------------|--------------------------|
| GET    | /api/admin/stats                   | Dashboard statistics     |
| POST   | /api/admin/jobs                    | Create job               |
| PATCH  | /api/admin/jobs/:id                | Update job               |
| DELETE | /api/admin/jobs/:id                | Close job                |
| GET    | /api/admin/jobs/:id/applicants     | Get applicants           |
| GET    | /api/admin/jobs/:id/export         | Export to Excel          |
| POST   | /api/admin/jobs/:id/bulk-update    | Bulk update from Excel   |
| GET    | /api/admin/students                | Get all students         |
| POST   | /api/admin/students/import         | Bulk import students     |
| GET    | /api/admin/students/:id            | Get student profile      |
| PATCH  | /api/admin/students/:id/profile    | Edit student profile     |
| PATCH  | /api/admin/students/:id/verify     | Verify student           |
| PATCH  | /api/admin/students/:id/block      | Debar student            |
| PATCH  | /api/admin/students/:id/unblock    | Reinstate student        |
| PATCH  | /api/admin/students/:id/lock       | Lock/unlock profile      |
| POST   | /api/admin/notify                  | Send bulk notifications  |
| GET    | /api/admin/audit-logs              | Get audit logs           |
| GET    | /api/admin/cache/stats             | Cache performance stats  |

---

## 🌐 Deployment

| Service  | Platform | URL                                              |
|----------|----------|--------------------------------------------------|
| Frontend | Vercel   | https://placement-portal-red.vercel.app          |
| Backend  | Render   | https://placement-portal-f7dv.onrender.com       |
| Database | MongoDB Atlas | Cloud hosted                                |

---

## 📧 Email Notifications

The portal sends automated emails for:
- OTP verification on registration
- Forgot password OTP
- New job posted (all students)
- Application shortlisted / selected / rejected
- Account verified / debarred / reinstated
- Admin notified on new student registration
- Bulk import activation emails
- Contact form confirmation

---

## 👨‍💻 Author

**Nitesh Kumar Jha**
- Portfolio: [my-port-folio-nitesh.vercel.app](https://my-port-folio-nitesh.vercel.app)
- GitHub: [@niteshhh001](https://github.com/niteshhh001)
- LinkedIn: [nitesh-kumar-jha](http://www.linkedin.com/in/nitesh-kumar-jha-55b484263)

---

## 📄 License

This project is licensed under the MIT License.
