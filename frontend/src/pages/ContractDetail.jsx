import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileDown, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import AdvanceCard from '../components/ui/AdvanceCard';
import { CONTRACT_STATUSES, formatCurrency, formatDate } from '../utils/constants';

export default function ContractDetail() {
  const { id } = useParams();
  const { isStaff, isManager } = useAuth();
  const [contract, setContract] = useState(null);
  const [appendices, setAppendices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appendixModal, setAppendixModal] = useState(false);
  const [appendixForm, setAppendixForm] = useState({ title: '', description: '', effectiveDate: '' });
  const [appendixFiles, setAppendixFiles] = useState([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get(`/contracts/${id}`), api.get(`/contracts/${id}/appendices`)])
      .then(([contractRes, appendixRes]) => {
        setContract(contractRes.data);
        setAppendices(appendixRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const updateStatus = async (status) => {
    const res = await api.patch(`/contracts/${id}/status`, { status });
    setContract(res.data);
  };

  const handleAppendixSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(appendixForm).forEach(([key, val]) => data.append(key, val));
    appendixFiles.forEach((f) => data.append('files', f));
    await api.post(`/contracts/${id}/appendices`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    setAppendixModal(false);
    setAppendixForm({ title: '', description: '', effectiveDate: '' });
    setAppendixFiles([]);
    fetchData();
  };

  const deleteAppendix = async (appendixId) => {
    if (!confirm('Xóa phụ lục này?')) return;
    await api.delete(`/contracts/${id}/appendices/${appendixId}`);
    fetchData();
  };

  if (loading) return <LoadingSpinner />;
  if (!contract) return <p className="text-muted">Không tìm thấy hợp đồng</p>;

  return (
    <div className="space-y-6">
      <Link to="/contracts" className="link-primary inline-flex items-center gap-2 text-sm">
        <ArrowLeft size={16} />
        Quay lại danh sách
      </Link>

      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted">{contract.contractNumber}</p>
            <h1 className="text-2xl font-semibold text-heading">{contract.title}</h1>
            <p className="mt-1 text-body">Khách hàng: {contract.customer?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={contract.status} />
            {isStaff && (
              <select value={contract.status} onChange={(e) => updateStatus(e.target.value)} className="input-field py-1.5">
                {CONTRACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Ngày bắt đầu" value={formatDate(contract.startDate)} />
          <InfoItem label="Ngày kết thúc" value={formatDate(contract.endDate)} />
          <InfoItem label="Giá trị" value={formatCurrency(contract.value)} />
          <InfoItem label="Email KH" value={contract.customer?.email || '-'} />
        </div>

        {contract.description && <p className="mt-4 text-sm text-body">{contract.description}</p>}

        {contract.files?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 font-medium text-heading">Tệp hợp đồng</h3>
            <div className="space-y-2">
              {contract.files.map((f) => (
                <a key={f._id} href={f.url} target="_blank" rel="noreferrer" className="link-primary flex items-center gap-2 text-sm">
                  <FileDown size={16} />
                  {f.originalName}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <AdvanceCard
        title="Phụ lục hợp đồng"
        subtitle={`${appendices.length} phụ lục`}
        actions={isStaff && (
          <button type="button" onClick={() => setAppendixModal(true)} className="btn-primary px-3 py-1.5 text-xs">
            <Plus size={16} />
            Thêm phụ lục
          </button>
        )}
        bodyClass={appendices.length === 0 ? '' : 'divide-y divide-border'}
      >
        {appendices.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">Chưa có phụ lục</p>
        ) : (
          appendices.map((a) => (
            <div key={a._id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-heading">{a.title}</h3>
                  {a.description && <p className="mt-1 text-sm text-body">{a.description}</p>}
                  {a.effectiveDate && <p className="mt-1 text-xs text-muted">Ngày hiệu lực: {formatDate(a.effectiveDate)}</p>}
                </div>
                {isManager && (
                  <button type="button" onClick={() => deleteAppendix(a._id)} className="text-danger hover:opacity-80">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {a.files?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {a.files.map((f) => (
                    <a key={f._id} href={f.url} target="_blank" rel="noreferrer" className="link-primary flex items-center gap-2 text-sm">
                      <FileDown size={14} />
                      {f.originalName}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </AdvanceCard>

      <Modal open={appendixModal} onClose={() => setAppendixModal(false)} title="Thêm phụ lục">
        <form onSubmit={handleAppendixSubmit} className="space-y-4">
          <div>
            <label className="input-label">Tiêu đề *</label>
            <input required value={appendixForm.title} onChange={(e) => setAppendixForm({ ...appendixForm, title: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="input-label">Mô tả</label>
            <textarea value={appendixForm.description} onChange={(e) => setAppendixForm({ ...appendixForm, description: e.target.value })} className="input-field" rows={3} />
          </div>
          <div>
            <label className="input-label">Ngày hiệu lực</label>
            <input type="date" value={appendixForm.effectiveDate} onChange={(e) => setAppendixForm({ ...appendixForm, effectiveDate: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="input-label">Tệp đính kèm</label>
            <input type="file" multiple accept=".pdf,.docx,.xlsx" onChange={(e) => setAppendixFiles(Array.from(e.target.files))} className="w-full text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAppendixModal(false)} className="btn-secondary">Hủy</button>
            <button type="submit" className="btn-primary">Thêm phụ lục</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-md bg-body-bg p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium text-heading">{value}</p>
    </div>
  );
}
