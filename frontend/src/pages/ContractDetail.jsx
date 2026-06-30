import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileDown, Trash2, HandCoins, Wallet, FolderOpen } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import AdvanceCard from '../components/ui/AdvanceCard';
import StatCard from '../components/ui/StatCard';
import { CONTRACT_STATUSES, formatCurrency, formatDate, getDocumentDetailPath } from '../utils/constants';

export default function ContractDetail() {
  const { id } = useParams();
  const { isStaff, isManager } = useAuth();
  const { documentTypeLabel, locale, statusLabel, t } = useLanguage();
  const [contract, setContract] = useState(null);
  const [appendices, setAppendices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appendixModal, setAppendixModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [appendixForm, setAppendixForm] = useState({ title: '', description: '', effectiveDate: '' });
  const [appendixFiles, setAppendixFiles] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paidAt: new Date().toISOString().slice(0, 10), method: '', reference: '', note: '' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get(`/contracts/${id}`),
      api.get(`/contracts/${id}/appendices`),
      api.get('/payments', { params: { contract: id } }),
      api.get('/payments/summary', { params: { contract: id } }),
      api.get('/documents', { params: { parentDocument: id } }),
      api.get(`/documents/${id}/activity`),
    ])
      .then(([contractRes, appendixRes, paymentsRes, summaryRes, relatedRes, activityRes]) => {
        setContract(contractRes.data);
        setAppendices(appendixRes.data);
        setPayments(paymentsRes.data);
        setPaymentSummary(summaryRes.data);
        setRelatedDocs(relatedRes.data);
        setActivity(activityRes.data);
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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    await api.post('/payments', { ...paymentForm, contract: id });
    setPaymentModal(false);
    setPaymentForm({ amount: '', paidAt: new Date().toISOString().slice(0, 10), method: '', reference: '', note: '' });
    fetchData();
  };

  if (loading) return <LoadingSpinner />;
  if (!contract) return <p className="text-muted">{t('contractDetail.notFound')}</p>;

  return (
    <div className="space-y-6">
      <Link to="/contracts" className="link-primary inline-flex items-center gap-2 text-sm">
        <ArrowLeft size={16} />
        {t('contractDetail.back')}
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
                {CONTRACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{statusLabel(s.value)}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label={t('contractDetail.startDate')} value={formatDate(contract.startDate, locale)} />
          <InfoItem label={t('contractDetail.endDate')} value={formatDate(contract.endDate, locale)} />
          <InfoItem label={t('common.value')} value={formatCurrency(contract.value, locale)} />
          <InfoItem label={t('contractDetail.customerEmail')} value={contract.customer?.email || '-'} />
        </div>

        {contract.description && <p className="mt-4 text-sm text-body">{contract.description}</p>}

        {contract.files?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 font-medium text-heading">{t('contractDetail.contractFiles')}</h3>
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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HandCoins} label={t('contractDetail.totalPaid')} value={formatCurrency(paymentSummary?.totalPaid || 0, locale)} unit="VND" iconBg="bg-success-light" iconColor="text-success" />
        <StatCard icon={Wallet} label={t('contractDetail.outstanding')} value={formatCurrency(paymentSummary?.outstanding || 0, locale)} unit="VND" iconBg="bg-danger-light" iconColor="text-danger" />
        <StatCard icon={FolderOpen} label={t('contractDetail.relatedDocuments')} value={relatedDocs.length + appendices.length} unit={t('common.documents')} iconBg="bg-primary-light" iconColor="text-primary" />
        <StatCard icon={FileDown} label={t('contractDetail.contractFilesCount')} value={contract.files?.length || 0} unit={t('common.files')} iconBg="bg-info-light" iconColor="text-info" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AdvanceCard
          title={t('contractDetail.paymentTracking')}
          subtitle={`${payments.length} ${t('contractDetail.paymentCount')}`}
          actions={isStaff && (
            <button type="button" onClick={() => setPaymentModal(true)} className="btn-primary px-3 py-1.5 text-xs">
              <Plus size={16} />
              {t('contractDetail.recordPayment')}
            </button>
          )}
        >
          <div className="divide-y divide-border">
            {payments.map((payment) => (
              <div key={payment._id} className="px-6 py-4">
                <p className="font-semibold text-heading">{formatCurrency(payment.amount, locale)}</p>
                <p className="mt-1 text-sm text-body">{payment.method || t('customerDetail.unknownMethod')} {payment.reference ? `· ${payment.reference}` : ''}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(payment.paidAt, locale)} {payment.note ? `· ${payment.note}` : ''}</p>
              </div>
            ))}
            {payments.length === 0 && <p className="px-6 py-10 text-center text-muted">{t('contractDetail.noPayments')}</p>}
          </div>
        </AdvanceCard>

        <AdvanceCard title={t('contractDetail.documentCenter')} subtitle={t('contractDetail.documentCenterSubtitle')}>
          <div className="divide-y divide-border">
            {relatedDocs.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <Link to={getDocumentDetailPath(doc)} className="font-medium text-heading hover:text-primary">{doc.title}</Link>
                  <p className="mt-1 text-xs text-muted">{documentTypeLabel(doc.type)} · {doc.documentNumber}</p>
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))}
            {appendices.map((appendix) => (
              <div key={appendix._id} className="px-6 py-4">
                <p className="font-medium text-heading">{appendix.title}</p>
                <p className="mt-1 text-xs text-muted">{t('contractDetail.appendix')} · {appendix.effectiveDate ? formatDate(appendix.effectiveDate, locale) : t('contractDetail.noEffectiveDate')}</p>
              </div>
            ))}
            {relatedDocs.length === 0 && appendices.length === 0 && <p className="px-6 py-10 text-center text-muted">{t('contractDetail.noRelatedDocuments')}</p>}
          </div>
        </AdvanceCard>
      </div>

      <AdvanceCard
        title={t('contractDetail.appendicesTitle')}
        subtitle={`${appendices.length} ${t('contractDetail.appendix')}`}
        actions={isStaff && (
          <button type="button" onClick={() => setAppendixModal(true)} className="btn-primary px-3 py-1.5 text-xs">
            <Plus size={16} />
            {t('contractDetail.addAppendix')}
          </button>
        )}
        bodyClass={appendices.length === 0 ? '' : 'divide-y divide-border'}
      >
        {appendices.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">{t('contractDetail.noAppendices')}</p>
        ) : (
          appendices.map((a) => (
            <div key={a._id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-heading">{a.title}</h3>
                  {a.description && <p className="mt-1 text-sm text-body">{a.description}</p>}
                  {a.effectiveDate && <p className="mt-1 text-xs text-muted">Ngày hiệu lực: {formatDate(a.effectiveDate, locale)}</p>}
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

      <AdvanceCard title={t('contractDetail.timeline')} subtitle={`${activity.length} ${t('common.activities')}`}>
        <div className="divide-y divide-border">
          {activity.map((item) => (
            <div key={item._id} className="px-6 py-4">
              <p className="text-sm font-medium text-heading">{item.description}</p>
              <p className="mt-1 text-xs text-muted">{item.user?.name || 'System'} · {formatDate(item.createdAt, locale)}</p>
            </div>
          ))}
          {activity.length === 0 && <p className="px-6 py-10 text-center text-muted">{t('contractDetail.noTimeline')}</p>}
        </div>
      </AdvanceCard>

      <Modal open={appendixModal} onClose={() => setAppendixModal(false)} title={t('contractDetail.addAppendix')}>
        <form onSubmit={handleAppendixSubmit} className="space-y-4">
          <div>
            <label className="input-label">{t('common.title')} *</label>
            <input required value={appendixForm.title} onChange={(e) => setAppendixForm({ ...appendixForm, title: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="input-label">{t('contractDetail.description')}</label>
            <textarea value={appendixForm.description} onChange={(e) => setAppendixForm({ ...appendixForm, description: e.target.value })} className="input-field" rows={3} />
          </div>
          <div>
            <label className="input-label">{t('contractDetail.effectiveDate')}</label>
            <input type="date" value={appendixForm.effectiveDate} onChange={(e) => setAppendixForm({ ...appendixForm, effectiveDate: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="input-label">{t('contractDetail.attachments')}</label>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.docx,.xlsx" onChange={(e) => setAppendixFiles(Array.from(e.target.files))} className="w-full text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAppendixModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{t('contractDetail.addAppendix')}</button>
          </div>
        </form>
      </Modal>

      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title={t('contractDetail.paymentModalTitle')}>
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="input-label">{t('contractDetail.amount')} *</label>
              <input type="number" min="0" required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">{t('contractDetail.paidAt')} *</label>
              <input type="date" required value={paymentForm.paidAt} onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="input-label">{t('contractDetail.method')}</label>
              <input value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="input-field" placeholder={t('contractDetail.methodPlaceholder')} />
            </div>
            <div>
              <label className="input-label">{t('contractDetail.reference')}</label>
              <input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="input-label">{t('contractDetail.note')}</label>
            <textarea value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} className="input-field" rows={3} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setPaymentModal(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{t('contractDetail.savePayment')}</button>
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
