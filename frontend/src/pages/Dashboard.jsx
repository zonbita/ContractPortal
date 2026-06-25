import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/ui/StatCard';
import AdvanceCard from '../components/ui/AdvanceCard';
import PageHeader from '../components/ui/PageHeader';
import { formatCurrency, formatDate, daysUntil } from '../utils/constants';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const upcoming = stats.upcomingExpirations || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Tổng quan quản lý hợp đồng" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Tổng hợp đồng"
          value={stats.totalContracts}
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
        <StatCard
          icon={CheckCircle}
          label="Đang hoạt động"
          value={stats.activeContracts}
          iconBg="bg-success-light"
          iconColor="text-success"
        />
        <StatCard
          icon={XCircle}
          label="Đã hết hạn"
          value={stats.expiredContracts}
          iconBg="bg-danger-light"
          iconColor="text-danger"
        />
        <StatCard
          icon={DollarSign}
          label="Tổng giá trị"
          value={formatCurrency(stats.totalContractValue)}
          iconBg="bg-warning-light"
          iconColor="text-warning"
        />
      </div>

      <AdvanceCard
        title="Sắp hết hạn"
        subtitle="Hợp đồng hết hạn trong 30 ngày tới"
        actions={
          <>
            <button type="button" onClick={fetchStats} className="rounded-md p-2 text-body hover:bg-body-bg" title="Refresh">
              <RefreshCw size={18} />
            </button>
            <Link to="/contracts" className="btn-primary px-4 py-2 text-xs">
              Xem tất cả
            </Link>
          </>
        }
      >
        {upcoming.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">Không có hợp đồng sắp hết hạn</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Số HĐ</th>
                  <th className="table-cell">Tiêu đề</th>
                  <th className="table-cell">Khách hàng</th>
                  <th className="table-cell">Hết hạn</th>
                  <th className="table-cell">Còn lại</th>
                  <th className="table-cell">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((c) => (
                  <tr key={c._id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/contracts/${c._id}`} className="link-primary font-medium">
                        {c.contractNumber}
                      </Link>
                    </td>
                    <td className="table-cell text-heading">{c.title}</td>
                    <td className="table-cell">{c.customer?.name}</td>
                    <td className="table-cell">{formatDate(c.endDate)}</td>
                    <td className="table-cell">
                      <span className={`flex items-center gap-1 font-medium ${daysUntil(c.endDate) <= 7 ? 'text-danger' : 'text-warning'}`}>
                        <Clock size={14} />
                        {daysUntil(c.endDate)} ngày
                      </span>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdvanceCard>
    </div>
  );
}
