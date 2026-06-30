import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { Contract } from '../models/Contract.js';
import { Appendix } from '../models/Appendix.js';
import { Document } from '../models/Document.js';
import { buildSearchText } from '../schemas/documentMetadata.js';

async function migrateContracts() {
  const contracts = await Contract.find();
  let migrated = 0;

  for (const c of contracts) {
    const exists = await Document.findOne({ legacyId: c._id, type: 'contract' });
    if (exists) continue;

    const doc = await Document.create({
      type: 'contract',
      title: c.title,
      documentNumber: c.contractNumber,
      customer: c.customer,
      status: c.status,
      description: c.description || '',
      metadata: {
        startDate: c.startDate,
        endDate: c.endDate,
        value: c.value || 0,
        remindersSent: c.remindersSent || [],
        description: c.description || '',
      },
      files: c.files || [],
      legacyId: c._id,
      createdBy: c.createdBy,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
    doc.searchText = buildSearchText(doc);
    await doc.save();
    migrated += 1;
  }

  return migrated;
}

async function migrateAppendices() {
  const appendices = await Appendix.find();
  let migrated = 0;

  for (const a of appendices) {
    const parentDoc = await Document.findOne({ legacyId: a.contract, type: 'contract' });
    if (!parentDoc) continue;

    const exists = await Document.findOne({ legacyId: a._id, type: 'appendix' });
    if (exists) continue;

    const doc = await Document.create({
      type: 'appendix',
      title: a.title,
      documentNumber: `PL-${a._id.toString().slice(-6).toUpperCase()}`,
      parentDocument: parentDoc._id,
      customer: parentDoc.customer,
      status: 'active',
      description: a.description || '',
      metadata: {
        effectiveDate: a.effectiveDate,
        description: a.description || '',
      },
      files: a.files || [],
      legacyId: a._id,
      createdBy: a.createdBy,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    });
    doc.searchText = buildSearchText(doc);
    await doc.save();
    migrated += 1;
  }

  return migrated;
}

async function migrate() {
  await connectDB();
  const contracts = await migrateContracts();
  const appendices = await migrateAppendices();
  console.log(`Migrated ${contracts} contracts and ${appendices} appendices to documents`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
