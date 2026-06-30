import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageHeader from '../components/ui/PageHeader';
import AdvanceCard from '../components/ui/AdvanceCard';
import DocumentForm from '../components/documents/DocumentForm';
import { CONTRACT_STATUSES, formatCurrency, formatDate } from '../utils/constants';

export default function Contracts() {
  const { isStaff } = useAuth();
  const { locale, statusLabel, t } = useLanguage();
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchContracts = () => {
    setLoading(true);
    api.get('/contracts', { params: { search, status: statusFilter || undefined } })
      .then((res) => setContracts(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
    api.get('/customers').then((res) => setCustomers(res.data));
  }, [search, statusFilter]);

  const handleCreated = () => {
    setModalOpen(false);
    fetchContracts();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hợp đồng"
        subtitle="Quản lý và theo dõi hợp đồng"
        action={isStaff && (
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={18} />
            Tạo hợp đồng
          </button>
        )}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input type="text" placeholder="Tìm theo số HĐ, tiêu đề..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-48">
          <option value="">{t('common.allStatuses')}</option>
          {CONTRACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{statusLabel(s.value)}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <AdvanceCard title="Danh sách hợp đồng" subtitle={`${contracts.length} hợp đồng`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Số HĐ</th>
                  <th className="table-cell">Tiêu đề</th>
                  <th className="table-cell">Khách hàng</th>
                  <th className="table-cell">Bắt đầu</th>
                  <th className="table-cell">Kết thúc</th>
                  <th className="table-cell">Giá trị</th>
                  <th className="table-cell">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c._id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/contracts/${c._id}`} className="link-primary font-medium">{c.contractNumber}</Link>
                    </td>
                    <td className="table-cell text-heading">{c.title}</td>
                    <td className="table-cell">{c.customer?.name}</td>
                    <td className="table-cell">{formatDate(c.startDate, locale)}</td>
                    <td className="table-cell">{formatDate(c.endDate, locale)}</td>
                    <td className="table-cell">{formatCurrency(c.value, locale)}</td>
                    <td className="table-cell"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contracts.length === 0 && <p className="py-10 text-center text-muted">Chưa có hợp đồng</p>}
          </div>
        </AdvanceCard>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tạo hợp đồng mới">
        <DocumentForm
          type="contract"
          endpoint="/contracts"
          customers={customers}
          onSuccess={handleCreated}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
