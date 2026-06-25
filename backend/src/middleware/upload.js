import multer from 'multer';
import path from 'path';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
];

const ALLOWED_EXT = ['.pdf', '.docx', '.xlsx', '.doc', '.xls'];

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_TYPES.includes(file.mimetype) || ALLOWED_EXT.includes(ext)) {
    cb(null, true);
    return;
  }
  cb(new Error('Only PDF, DOCX, and XLSX files are allowed'), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});
