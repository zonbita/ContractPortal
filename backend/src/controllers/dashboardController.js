import { Contract } from '../models/Contract.js';

function getUpcomingWindow() {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  return { now, in30Days };
}

export const getDashboardStats = async (req, res) => {
  const filter = req.user.role === 'client' && req.user.customer
    ? { customer: req.user.customer }
    : {};

  const [total, active, expired, upcoming, valueAgg] = await Promise.all([
    Contract.countDocuments(filter),
    Contract.countDocuments({ ...filter, status: 'active' }),
    Contract.countDocuments({ ...filter, status: 'expired' }),
    getUpcomingExpirations(filter),
    Contract.aggregate([
      { $match: filter },
      { $group: { _id: null, totalValue: { $sum: '$value' } } },
    ]),
  ]);

  res.json({
    totalContracts: total,
    activeContracts: active,
    expiredContracts: expired,
    upcomingExpirations: upcoming,
    totalContractValue: valueAgg[0]?.totalValue || 0,
  });
};

async function getUpcomingExpirations(filter) {
  const { now, in30Days } = getUpcomingWindow();
  return Contract.find({
    ...filter,
    status: { $in: ['active', 'pending'] },
    endDate: { $gte: now, $lte: in30Days },
  })
    .populate('customer', 'name company')
    .sort({ endDate: 1 })
    .limit(10);
}

export const getUpcomingExpirationsList = async (req, res) => {
  const filter = req.user.role === 'client' && req.user.customer
    ? { customer: req.user.customer }
    : {};
  const upcoming = await getUpcomingExpirations(filter);
  res.json(upcoming);
};
