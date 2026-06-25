# Contract Portal

Hệ thống quản lý hợp đồng MVP — lưu trữ hợp đồng, theo dõi trạng thái, ngày hết hạn, khách hàng, phụ lục và nhắc nhở gia hạn.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Express.js + MongoDB (Mongoose) |
| Frontend | React + Vite + Tailwind CSS |
| Auth | JWT |
| Storage | Local / AWS S3 / Cloudinary / MinIO |
| Reminders | node-cron + Email + In-app notifications |

## Tính năng MVP v1

### Authentication
- Đăng ký / Đăng nhập / Quên mật khẩu
- JWT token
- Roles: **Admin**, **Manager**, **Staff**, **Client**

### Quản lý khách hàng
- Name, Email, Phone, Company, Address, Tax Code

### Quản lý hợp đồng
- Contract Number, Title, Customer, Start/End Date, Value, Status
- Trạng thái: Draft, Pending, Active, Expired, Terminated
- Upload file: PDF, DOCX, XLSX

### Phụ lục hợp đồng
- Thêm/sửa/xóa phụ lục kèm file đính kèm

### Nhắc nhở hết hạn
- Cron job chạy hàng ngày lúc 8:00 AM
- Gửi nhắc nhở trước **30, 15, 7, 1** ngày
- Kênh: Email + Notification trong app + Dashboard

### Dashboard
- Total Contracts
- Active Contracts
- Expired Contracts
- Upcoming Expiration (30 ngày)
- Total Contract Value

## Cài đặt

### Yêu cầu
- Node.js 18+
- MongoDB (local hoặc Atlas)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed        # Tạo admin mặc định
npm run dev         # http://localhost:5000
```

**Admin mặc định:** `admin@contractportal.com` / `admin123`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

## Cấu hình Storage

Trong `backend/.env`, đặt `STORAGE_PROVIDER`:

| Provider | Giá trị | Biến môi trường |
|----------|---------|----------------|
| Local | `local` | `UPLOAD_DIR=uploads` |
| AWS S3 | `s3` | `AWS_*` |
| Cloudinary | `cloudinary` | `CLOUDINARY_*` |
| MinIO | `minio` | `MINIO_*` |

## Cấu hình Email (SMTP)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app_password
EMAIL_FROM=Contract Portal <noreply@contractportal.com>
```

Nếu chưa cấu hình SMTP, hệ thống vẫn chạy và ghi log thay vì gửi email.

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/forgot-password` | Quên mật khẩu |
| GET | `/api/customers` | Danh sách KH |
| POST | `/api/contracts` | Tạo hợp đồng (+ files) |
| GET | `/api/dashboard/stats` | Thống kê dashboard |
| GET | `/api/notifications` | Thông báo |

## Phân quyền

| Role | Quyền |
|------|-------|
| Admin | Toàn quyền, quản lý users |
| Manager | CRUD hợp đồng/KH, xóa |
| Staff | Tạo/sửa hợp đồng, KH |
| Client | Xem hợp đồng của mình |

## Cấu trúc thư mục

```
ContractPortal/
├── backend/
│   └── src/
│       ├── models/       # User, Customer, Contract, Appendix, Notification
│       ├── controllers/
│       ├── routes/
│       ├── services/     # Storage, Email, Reminder
│       └── jobs/         # Cron reminder
└── frontend/
    └── src/
        ├── pages/        # Dashboard, Contracts, Customers...
        ├── components/
        └── context/      # Auth
```
