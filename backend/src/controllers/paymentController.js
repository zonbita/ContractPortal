import { createPayment, deletePayment, getPaymentSummary, listPayments } from '../services/paymentService.js';

export const getPayments = async (req, res) => {
  const payments = await listPayments(req.user, req.query);
  res.json(payments);
};

export const getPaymentsSummary = async (req, res) => {
  const summary = await getPaymentSummary(req.user, req.query);
  res.json(summary);
};

export const createPaymentHandler = async (req, res) => {
  try {
    const payment = await createPayment(req.user, req.body);
    if (payment?.forbidden) return res.status(403).json({ message: 'Access denied' });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deletePaymentHandler = async (req, res) => {
  const payment = await deletePayment(req.user, req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  if (payment.forbidden) return res.status(403).json({ message: 'Access denied' });
  res.json({ message: 'Payment deleted' });
};
