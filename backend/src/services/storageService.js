import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const uuid = () => crypto.randomUUID();
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';
import * as Minio from 'minio';

const provider = () => process.env.STORAGE_PROVIDER || 'local';

const getLocalDir = () => path.resolve(process.env.UPLOAD_DIR || 'uploads');

async function uploadLocal(file) {
  const dir = getLocalDir();
  await fs.mkdir(dir, { recursive: true });
  const filename = `${uuid()}${path.extname(file.originalname)}`;
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, file.buffer);
  return {
    filename,
    url: `/uploads/${filename}`,
    storageKey: filename,
  };
}

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadS3(file) {
  const key = `contracts/${uuid()}${path.extname(file.originalname)}`;
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );
  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { filename: path.basename(key), url, storageKey: key };
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function uploadCloudinary(file) {
  configureCloudinary();
  const base64 = file.buffer.toString('base64');
  const dataUri = `data:${file.mimetype};base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'contracts',
    resource_type: 'raw',
  });
  return {
    filename: result.public_id,
    url: result.secure_url,
    storageKey: result.public_id,
  };
}

function getMinioClient() {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
}

async function uploadMinio(file) {
  const client = getMinioClient();
  const bucket = process.env.MINIO_BUCKET || 'contracts';
  const key = `${uuid()}${path.extname(file.originalname)}`;
  await client.putObject(bucket, key, file.buffer, file.size, {
    'Content-Type': file.mimetype,
  });
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const url = `${protocol}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${key}`;
  return { filename: key, url, storageKey: key };
}

const uploadHandlers = {
  local: uploadLocal,
  s3: uploadS3,
  cloudinary: uploadCloudinary,
  minio: uploadMinio,
};

export async function uploadFile(file) {
  const handler = uploadHandlers[provider()];
  if (!handler) {
    throw new Error(`Unknown storage provider: ${provider()}`);
  }
  const result = await handler(file);
  return {
    ...result,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

export async function uploadFiles(files) {
  return Promise.all(files.map(uploadFile));
}
