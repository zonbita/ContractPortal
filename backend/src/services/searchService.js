import { Document } from '../models/Document.js';

export async function searchDocuments(user, { q, type, customer, limit = 50 }) {
  const filter = {};

  if (user.role === 'client' && user.customer) {
    filter.customer = user.customer;
  }
  if (type) filter.type = type;
  if (customer) filter.customer = customer;

  if (q) {
    filter.$or = [
      { documentNumber: { $regex: q, $options: 'i' } },
      { title: { $regex: q, $options: 'i' } },
      { ocrText: { $regex: q, $options: 'i' } },
      { searchText: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ];
  }

  return Document.find(filter)
    .populate('customer', 'name email company')
    .sort({ createdAt: -1 })
    .limit(Number(limit));
}
