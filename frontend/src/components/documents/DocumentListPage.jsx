import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../LoadingSpinner';
import StatusBadge from '../StatusBadge';
import Modal from '../Modal';
import PageHeader from '../ui/PageHeader';
import AdvanceCard from '../ui/AdvanceCard';
import DocumentForm from './DocumentForm';
import {
  STATUS_OPTIONS_BY_TYPE,
  formatCurrency,
  formatDate,
  getDocumentDetailPath,
} from '../../utils/constants';

const COLUMN_CONFIG = {
  invoice: [
    { key: 'documentNumber', label: 'Số HĐ' },
    { key: 'title', label: 'Tiêu đề' },
    { key: 'customer', label: 'Khách hàng' },
    { key: 'amount', label: 'Số tiền' },
    { key: 'dueDate', label: 'Hạn thanh toán' },
    { key: 'paid', label: 'Thanh toán' },
    { key: 'status', label: 'Trạng thái' },
  ],
  quotation: [
    { key: 'documentNumber', label: 'Số BG' },
    { key: 'title', label: 'Tiêu đề' },
    { key: 'customer', label: 'Khách hàng' },
    { key: 'amount', label: 'Giá trị' },
    { key: 'validUntil', label: 'Hiệu lực đến' },
    { key: 'status', label: 'Trạng thái' },
  ],
  receipt: [
    { key: 'documentNumber', label: 'Số phiếu' },
    { key: 'title', label: 'Tiêu đề' },
    { key: 'amount', label: 'Số tiền' },
    { key: 'paymentMethod', label: 'Phương thức' },
    { key: 'status', label: 'Trạng thái' },
  ],
  payment_voucher: [
    { key: 'documentNumber', label: 'Số phiếu' },
    { key: 'title', label: 'Tiêu đề' },
    { key: 'amount', label: 'Số tiền' },
    { key: 'paymentMethod', label: 'Phương thức' },
    { key: 'status', label: 'Trạng thái' },
  ],
};

function renderCell(doc, key, { locale, t }) {
  const meta = doc.metadata || {};
  switch (key) {
    case 'documentNumber':
      return (
        <Link to={getDocumentDetailPath(doc)} className="link-primary font-medium">
          {doc.documentNumber}
        </Link>
      );
    case 'title':
      return doc.title;
    case 'customer':
      return doc.customer?.name || '-';
    case 'amount':
      return formatCurrency(meta.amount, locale);
    case 'dueDate':
      return formatDate(meta.dueDate, locale);
    case 'validUntil':
      return formatDate(meta.validUntil, locale);
    case 'paid':
      return meta.paid ? (
        <span className="text-success">{t('statuses.paid')}</span>
      ) : (
        <span className="text-warning">{t('statuses.pending')}</span>
      );
    case 'paymentMethod':
      return meta.paymentMethod || '-';
    case 'status':
      return <StatusBadge status={doc.status} />;
    default:
      return '-';
  }
}

export default function DocumentListPage({ type, title, subtitle, createLabel }) {
  const { isStaff } = useAuth();
  const { documentTypeLabel, locale, statusLabel, t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDocuments = () => {
    setLoading(true);
    api
      .get('/documents', { params: { type, search, status: statusFilter || undefined } })
      .then((res) => setDocuments(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
    api.get('/customers').then((res) => setCustomers(res.data)).catch(() => {});
  }, [type, search, statusFilter]);

  const columns = COLUMN_CONFIG[type] || COLUMN_CONFIG.invoice;
  const statusOptions = STATUS_OPTIONS_BY_TYPE[type] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle || documentTypeLabel(type)}
        action={isStaff && (
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={18} />
            {createLabel}
          </button>
        )}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        {statusOptions.length > 0 && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-48">
            <option value="">{t('common.allStatuses')}</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{statusLabel(s.value)}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdvanceCard title={`${t('common.list')} ${documentTypeLabel(type)}`} subtitle={`${documents.length} ${documentTypeLabel(type)}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="table-cell">{t(`table.${col.key}`) || col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id} className="table-row">
                    {columns.map((col) => (
                      <td key={col.key} className="table-cell">{renderCell(doc, col.key, { locale, t })}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {documents.length === 0 && (
              <p className="py-10 text-center text-muted">Chưa có tài liệu</p>
            )}
          </div>
        </AdvanceCard>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={createLabel}>
        <DocumentForm
          type={type}
          customers={customers}
          onSuccess={() => { setModalOpen(false); fetchDocuments(); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
