import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageHeader from '../components/ui/PageHeader';
import AdvanceCard from '../components/ui/AdvanceCard';
import { CONTRACT_STATUSES, formatCurrency, formatDate } from '../utils/constants';

const emptyForm = {
  contractNumber: '', title: '', customer: '', startDate: '', endDate: '', value: '', status: 'draft', description: '',
};

export default function Contracts() {
  const { isStaff } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);

  const fetchContracts = () => {
    setLoading(true);
    api.get('/contracts', { params: { search, status: statusFilter || undefined } })
      .then((res) => setContracts(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
    api.get('/customers').then((res) => setCustomers(res.data));
  }, [search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(key, val));
    files.forEach((f) => data.append('files', f));
    await api.post('/contracts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    setModalOpen(false);
    setForm(emptyForm);
    setFiles([]);
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
          <option value="">Tất cả trạng thái</option>
          {CONTRACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                    <td className="table-cell">{formatDate(c.startDate)}</td>
                    <td className="table-cell">{formatDate(c.endDate)}</td>
                    <td className="table-cell">{formatCurrency(c.value)}</td>
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
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="input-label">Số hợp đồng *</label>
              <input required value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">Khách hàng *</label>
              <select required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input-field">
                <option value="">Chọn khách hàng</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Tiêu đề *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="input-label">Ngày bắt đầu *</label>
              <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">Ngày kết thúc *</label>
              <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">Giá trị (VND)</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="input-label">Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
              {CONTRACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} />
          </div>
          <div>
            <label className="input-label">Tệp đính kèm (PDF, DOCX, XLSX)</label>
            <input type="file" multiple accept=".pdf,.docx,.xlsx,.doc,.xls" onChange={(e) => setFiles(Array.from(e.target.files))} className="w-full text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Hủy</button>
            <button type="submit" className="btn-primary">Tạo hợp đồng</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
