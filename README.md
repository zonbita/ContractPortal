# Contract Portal — Document Management

Hệ thống quản lý tài liệu doanh nghiệp — hợp đồng, hóa đơn, báo giá, phiếu thu/chi, tìm kiếm toàn cục, OCR cơ bản và nhắc nhở gia hạn hợp đồng.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Express.js + MongoDB (Mongoose) |
| Frontend | React + Vite + Tailwind CSS |
| Auth | JWT |
| Storage | Local / AWS S3 / Cloudinary / MinIO |
| Reminders | node-cron + Email + In-app notifications |
| OCR | pdf-parse (async sau upload) |

## Tính năng Phase 1

### Document Core
- Model thống nhất `Document` với metadata theo loại: `contract`, `invoice`, `quotation`, `receipt`, `payment_voucher`, `appendix`, `acceptance_report`
- API `/api/documents` — CRUD generic theo type
- Adapter layer giữ tương thích `/api/contracts` (frontend cũ không bị phá)

### Quản lý hóa đơn
- CRUD hóa đơn qua Document type `invoice`
- Theo dõi thanh toán, hạn thanh toán, VAT

### Tìm kiếm
- `GET /api/documents/search?q=...&type=...`
- Global search bar trên header → `/search?q=...`

### OCR
- Trích xuất text từ PDF sau upload (async)
- Tab OCR trên trang chi tiết tài liệu
- `POST /api/documents/:id/ocr` — quét lại

### Dashboard mở rộng
- Tổng hợp đồng, đang hoạt động, hết hạn
- Hóa đơn chưa thanh toán / quá hạn
- Tổng giá trị hợp đồng

### Phase 2 (sẵn sàng)
- Báo giá, Phiếu thu/chi (UI + API)
- Activity Log, Comments, Version history trên document detail

## Chạy nhanh

```bash
npm run install:all   # Cài backend + frontend
npm run seed          # Tạo admin mặc định
npm run migrate       # Migrate contracts → documents (one-time)
npm run dev           # Chạy cả backend + frontend
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5001 |

**Admin mặc định:** `admin@contractportal.com` / `admin123`

## Cài đặt chi tiết

### Yêu cầu
- Node.js 18+
- MongoDB (local hoặc Atlas)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Migration dữ liệu

Sau khi deploy Document model, chạy một lần:

```bash
npm run migrate
```

Script `migrateContractsToDocuments.js` copy collection `contracts` và `appendices` sang `documents`, giữ `legacyId` để tra cứu.

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET/POST | `/api/documents?type=invoice` | CRUD tài liệu theo loại |
| GET | `/api/documents/search?q=...` | Tìm kiếm toàn cục |
| POST | `/api/documents/:id/ocr` | Chạy lại OCR |
| GET | `/api/documents/:id/activity` | Nhật ký hoạt động |
| GET/POST | `/api/documents/:id/comments` | Bình luận |
| POST | `/api/documents/:id/versions` | Thêm phiên bản file |
| GET/POST | `/api/contracts` | Legacy adapter (→ Document type=contract) |
| GET | `/api/dashboard/stats` | Thống kê dashboard |

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

## Phân quyền

| Role | Quyền |
|------|-------|
| Admin | Toàn quyền, quản lý users |
| Manager | CRUD tài liệu/KH, xóa |
| Staff | Tạo/sửa tài liệu, KH |
| Client | Xem tài liệu của mình |

## Cấu trúc thư mục

```
ContractPortal/
├── backend/src/
│   ├── models/          # Document, Customer, User, ActivityLog, Comment
│   ├── schemas/         # documentMetadata validators
│   ├── services/        # documentService, searchService, ocrService
│   │   └── adapters/    # contractAdapter (legacy API)
│   ├── routes/          # documentRoutes, contractRoutes
│   └── scripts/         # migrateContractsToDocuments.js
└── frontend/src/
    ├── pages/           # Invoices, Quotations, Receipts, DocumentDetail, SearchPage
    └── components/documents/
```
