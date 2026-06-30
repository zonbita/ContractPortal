import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { singlePdfToImg } from 'pdftoimg-js';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { Document } from '../models/Document.js';
import { logActivity } from './documentService.js';

const OCR_PROVIDER = process.env.OCR_PROVIDER || (process.env.OPENAI_API_KEY ? 'hybrid' : 'tesseract');
const OCR_LANG = process.env.OCR_LANG || 'vie+eng';
const OCR_IMAGE_WIDTH = Number(process.env.OCR_IMAGE_WIDTH || 1800);
const OCR_MAX_PDF_PAGES = Number(process.env.OCR_MAX_PDF_PAGES || 5);
const OCR_MIN_CONFIDENCE = Number(process.env.OCR_MIN_CONFIDENCE || 65);
const OCR_MIN_TEXT_LENGTH = Number(process.env.OCR_MIN_TEXT_LENGTH || 30);
const OCR_OPENAI_MODEL = process.env.OCR_OPENAI_MODEL || 'gpt-4o-mini';
const MIN_PDF_TEXT_LENGTH = 20;
const TESSERACT_OPTIONS = {
  tessedit_pageseg_mode: process.env.OCR_PSM || '6',
  preserve_interword_spaces: '1',
};

let openaiClient;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

async function extractPdfText(filepath) {
  try {
    const { PDFParse } = await import('pdf-parse');
    const buffer = await fs.readFile(filepath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text || '';
  } catch {
    return '';
  }
}

function isImageFile(file) {
  const name = file.originalName?.toLowerCase() || '';
  return file.mimeType?.startsWith('image/') || /\.(jpe?g|png|webp|tiff?)$/.test(name);
}

function isPdfFile(file) {
  return file.mimeType === 'application/pdf' || file.originalName?.toLowerCase().endsWith('.pdf');
}

function getLocalFilePath(url) {
  if (!url || url.startsWith('http')) return null;
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
  return path.join(uploadDir, path.basename(url));
}

function getReadableSource(file) {
  const localPath = getLocalFilePath(file.url);
  if (localPath) return localPath;
  if (file.url?.startsWith('http')) return file.url;
  return null;
}

function normalizeImageResults(result) {
  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

async function runTesseract(source) {
  const result = await Tesseract.recognize(source, OCR_LANG, TESSERACT_OPTIONS);
  return {
    text: result?.data?.text?.trim() || '',
    confidence: Number(result?.data?.confidence || 0),
  };
}

function toImageUrl(source) {
  if (typeof source === 'string') return source;
  return `data:image/png;base64,${Buffer.from(source).toString('base64')}`;
}

async function runOpenAIVision(source) {
  const client = getOpenAIClient();
  if (!client) return '';

  const response = await client.chat.completions.create({
    model: OCR_OPENAI_MODEL,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: [
              'Bạn là OCR engine cho tài liệu Việt Nam.',
              'Hãy trích xuất toàn bộ chữ nhìn thấy trong ảnh.',
              'Giữ xuống dòng gần giống bố cục gốc.',
              'Không giải thích, không markdown, chỉ trả về nội dung OCR.',
              'Nếu là hóa đơn/bill, cố đọc tên cửa hàng, số hóa đơn, ngày, bàn, món hàng, số lượng, đơn giá, thành tiền, tổng tiền.',
            ].join(' '),
          },
          {
            type: 'image_url',
            image_url: { url: toImageUrl(source) },
          },
        ],
      },
    ],
  });

  return response.choices?.[0]?.message?.content?.trim() || '';
}

async function preprocessImage(source) {
  if (typeof source === 'string' && source.startsWith('http')) {
    return source;
  }

  const image = sharp(source);
  const metadata = await image.metadata();
  const width = Math.max(metadata.width || 0, OCR_IMAGE_WIDTH);

  return image
    .resize({ width, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .modulate({ brightness: 1.08 })
    .sharpen({ sigma: 1.1 })
    .png()
    .toBuffer();
}

function isLowQualityOcr({ text, confidence }) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length < OCR_MIN_TEXT_LENGTH) return true;
  if (confidence > 0 && confidence < OCR_MIN_CONFIDENCE) return true;

  const suspiciousChars = normalized.match(/[^\p{L}\p{N}\s.,:;/%()\-+]/gu) || [];
  return suspiciousChars.length / normalized.length > 0.25;
}

const MONEY_REGEX = /\d{1,3}(?:[.,/]\d{3})+|\d{4,}/g;

function matchMoney(line) {
  return String(line || '').match(MONEY_REGEX) || [];
}

function removeAccents(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function parseMoney(value) {
  if (!value) return 0;
  const normalized = String(value).replace(/[^\d]/g, '');
  return Number(normalized) || 0;
}

function cleanupLine(line) {
  return String(line || '').replace(/[|_`~]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function isExcludedItemLine(line) {
  const norm = removeAccents(line).toLowerCase();
  if (/(ten\s*hang|mat\s*hang|tong|thanh\s*tien|^tien|cash|thank|cam\s*on|hoa\s*don|ban\s*hang|gio\s*(vao|ra)|dt\s*:|sdt|tel|phone|duong|kdc|ninh\s*kieu|tp\.|q\.|p\.)/.test(norm)) {
    return true;
  }
  // dates (7/20/8777) and times (01:41)
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line) || /\d{1,2}:\d{2}/.test(line)) {
    return true;
  }
  return false;
}

function parseItemLine(line) {
  const normalized = cleanupLine(line);
  if (!normalized) return null;
  if (isExcludedItemLine(normalized)) return null;

  const cleaned = normalized.replace(/[*()\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  const moneyMatches = matchMoney(cleaned);
  if (!moneyMatches.length) return null;

  const amount = parseMoney(moneyMatches[moneyMatches.length - 1]);
  if (amount < 1000) return null;

  const firstDigit = cleaned.search(/\d/);
  const name = cleanupLine(cleaned.slice(0, firstDigit))
    .replace(/[;:.,_+-]+$/g, '')
    .trim();
  if (!name || removeAccents(name).replace(/[^a-z]/gi, '').length < 2) return null;

  let quantity = 1;
  const middle = cleaned.slice(firstDigit);
  const qtyMatch = middle.match(/^\s*(\d{1,3})(?!\d)/);
  if (qtyMatch && Number(qtyMatch[1]) > 0 && Number(qtyMatch[1]) < 1000 && qtyMatch[1] !== moneyMatches[0]) {
    quantity = Number(qtyMatch[1]);
  }

  let unitPrice;
  if (moneyMatches.length >= 2) {
    unitPrice = parseMoney(moneyMatches[moneyMatches.length - 2]);
  } else {
    unitPrice = quantity > 0 ? Math.round(amount / quantity) : amount;
  }

  return { name, quantity, unitPrice: unitPrice || amount, amount };
}

function extractInvoiceData(text) {
  const lines = text
    .split(/\r?\n/)
    .map(cleanupLine)
    .filter(Boolean)
    .filter((line) => !/\.(pdf|png|jpe?g|webp|tiff?)$/i.test(line))
    .filter((line) => !/^page\s+\d+/i.test(line));

  const invoiceKeywordIndex = lines.findIndex((line) => {
    const norm = removeAccents(line).toLowerCase();
    return /(hoa\s*don|invoice|bill)/.test(norm);
  });
  const invoiceName = invoiceKeywordIndex > -1 ? lines[invoiceKeywordIndex] : '';
  const seller = lines
    .slice(0, invoiceKeywordIndex > -1 ? invoiceKeywordIndex : Math.min(lines.length, 4))
    .find((line) => /[A-Za-zÀ-ỹ]{3,}/.test(line) && !/^\W+$/.test(line));

  const items = lines
    .map(parseItemLine)
    .filter(Boolean)
    .filter((item) => item.name && item.amount > 0);

  const totalLine = [...lines].reverse().find((line) => {
    const norm = removeAccents(line).toLowerCase();
    return /(tong|total|thanh\s*tien)/.test(norm) && matchMoney(line).length > 0;
  });
  const totalAmount = totalLine
    ? Math.max(0, ...matchMoney(totalLine).map(parseMoney))
    : 0;

  return {
    invoiceName: invoiceName || 'Hóa đơn',
    seller: seller || '',
    totalAmount: totalAmount || items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

function applyOcrToVersion(version, text) {
  const extracted = extractInvoiceData(text);
  version.ocrText = text
    ? `${version.file?.originalName || version.file?.filename || 'file'}\n${text}`
    : '';
  version.ocrStatus = text ? 'done' : 'skipped';

  if (!text) return extracted;

  version.ocr = {
    extractedAt: new Date(),
    ...extracted,
  };
  return extracted;
}

function syncDocumentFromLatestVersion(doc) {
  const latest = [...(doc.versions || [])].sort((a, b) => b.version - a.version)[0];
  if (!latest?.ocr || latest.ocrStatus !== 'done') return;

  doc.metadata = {
    ...(doc.metadata || {}),
    ocr: latest.ocr,
  };
  doc.ocrText = latest.ocrText || '';
  doc.ocrStatus = latest.ocrStatus || 'pending';

  if (doc.type === 'invoice') {
    if (latest.ocr.seller) doc.metadata.supplier = latest.ocr.seller;
    if (latest.ocr.totalAmount) doc.metadata.amount = latest.ocr.totalAmount;
    if (latest.ocr.invoiceName && (!doc.title || doc.title === doc.documentNumber)) {
      doc.title = latest.ocr.invoiceName;
    }
  }

  const ocrTexts = (doc.versions || [])
    .filter((version) => version.ocrText)
    .map((version) => version.ocrText);
  doc.searchText = `${doc.title} ${doc.documentNumber} ${ocrTexts.join(' ')}`.toLowerCase();
}

function applyOcrMetadata(doc, combined) {
  const extracted = extractInvoiceData(combined);
  if (!extracted.invoiceName && !extracted.seller && !extracted.items.length && !extracted.totalAmount) return;

  doc.metadata = {
    ...(doc.metadata || {}),
    ocr: {
      extractedAt: new Date(),
      ...extracted,
    },
  };

  if (doc.type === 'invoice') {
    if (extracted.seller) doc.metadata.supplier = extracted.seller;
    if (extracted.totalAmount) doc.metadata.amount = extracted.totalAmount;
    if (extracted.invoiceName && (!doc.title || doc.title === doc.documentNumber)) {
      doc.title = extracted.invoiceName;
    }
  }
}

async function runImageOcr(source, provider = OCR_PROVIDER) {
  const processed = await preprocessImage(source);

  if (provider === 'openai') {
    try {
      const text = await runOpenAIVision(processed);
      if (text) return text;
    } catch (err) {
      console.warn('[OCR:OpenAI]', err.message);
      throw err;
    }

    return (await runTesseract(processed)).text;
  }

  const traditional = await runTesseract(processed);
  if (provider === 'tesseract' || !isLowQualityOcr(traditional)) {
    return traditional.text;
  }

  try {
    const visionText = await runOpenAIVision(processed);
    if (visionText) return visionText;
  } catch (err) {
    console.warn('[OCR:OpenAI]', err.message);
  }

  return traditional.text;
}

async function extractImageText(file) {
  const source = getReadableSource(file);
  if (!source) return '';
  return runImageOcr(source);
}

async function extractScannedPdfText(filepath, provider = OCR_PROVIDER) {
  const pageImages = normalizeImageResults(
    await singlePdfToImg(filepath, {
      pages: { startPage: 1, endPage: OCR_MAX_PDF_PAGES },
      imgType: 'png',
      scale: 2,
      background: 'white',
      maxWidth: 2200,
      maxHeight: 2200,
    })
  );

  const texts = [];
  for (const [index, image] of pageImages.entries()) {
    const text = await runImageOcr(image, provider);
    if (text) texts.push(`Page ${index + 1}\n${text}`);
  }
  return texts.join('\n\n');
}

async function extractTextFromFile(file, provider = OCR_PROVIDER) {
  if (isImageFile(file)) {
    const source = getReadableSource(file);
    if (!source) return '';
    return runImageOcr(source, provider);
  }

  if (isPdfFile(file)) {
    const filepath = getLocalFilePath(file.url);
    if (!filepath) return '';

    const embeddedText = await extractPdfText(filepath);
    if (embeddedText.trim().length >= MIN_PDF_TEXT_LENGTH) {
      return embeddedText.trim();
    }

    return extractScannedPdfText(filepath, provider);
  }

  return '';
}

export async function runOcrForVersion(documentId, versionId, options = {}) {
  const doc = await Document.findById(documentId);
  if (!doc) return '';

  const version = doc.versions.id(versionId);
  if (!version?.file) {
    if (version) {
      version.ocrStatus = 'skipped';
      await doc.save();
    }
    return '';
  }

  version.ocrStatus = 'processing';
  await doc.save();

  try {
    const text = await extractTextFromFile(version.file, options.provider || OCR_PROVIDER);
    applyOcrToVersion(version, text);
    syncDocumentFromLatestVersion(doc);
    await doc.save();

    if (text) {
      await logActivity(
        doc._id,
        doc.createdBy,
        'ocr_completed',
        `OCR extraction completed for version ${version.version}`
      );
    }
    return version.ocrText;
  } catch (err) {
    version.ocrStatus = 'failed';
    await doc.save();
    throw err;
  }
}

export async function runOcrForDocument(documentId, options = {}) {
  const doc = await Document.findById(documentId);
  if (!doc) return '';

  if (doc.versions?.length) {
    const latest = [...doc.versions].sort((a, b) => b.version - a.version)[0];
    return runOcrForVersion(documentId, latest._id, options);
  }

  if (!doc.files?.length) {
    doc.ocrStatus = 'skipped';
    await doc.save();
    return '';
  }

  doc.ocrStatus = 'processing';
  await doc.save();

  try {
    const texts = [];
    for (const file of doc.files) {
      const text = await extractTextFromFile(file, options.provider || OCR_PROVIDER);
      if (text) {
        texts.push(`${file.originalName || file.filename}\n${text}`);
      }
    }
    const combined = texts.join('\n\n---\n\n');
    doc.ocrText = combined;
    doc.ocrStatus = combined ? 'done' : 'skipped';
    if (combined) applyOcrMetadata(doc, combined);
    doc.searchText = `${doc.title} ${doc.documentNumber} ${combined}`.toLowerCase();
    await doc.save();

    if (combined) {
      await logActivity(doc._id, doc.createdBy, 'ocr_completed', 'OCR extraction completed');
    }
    return combined;
  } catch (err) {
    doc.ocrStatus = 'failed';
    await doc.save();
    throw err;
  }
}
