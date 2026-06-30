import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileDown, RefreshCw, MessageSquare, History, GitBranch, Upload, Trash2, Pencil, Check, X, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, getDocumentListPath } from '../utils/constants';

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|tif|tiff)$/i;

function isImageFile(file) {
  return IMAGE_EXT.test(file.originalName || '');
}

function getOcrSummary(ocr) {
  const items = ocr?.items || [];
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const itemsTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalPrice = Number(ocr?.totalAmount) || itemsTotal;
  return {
    invoiceName: ocr?.invoiceName || '',
    totalQuantity,
    totalPrice,
  };
}

function findVersionForFile(versions, file) {
  if (!versions?.length || !file) return null;
  return versions.find((version) => {
    const versionFile = version.file;
    if (!versionFile) return false;
    return (
      (file._id && versionFile._id && String(file._id) === String(versionFile._id))
      || (file.url && versionFile.url && file.url === versionFile.url)
      || (file.filename && versionFile.filename && file.filename === versionFile.filename)
      || (file.storageKey && versionFile.storageKey && file.storageKey === versionFile.storageKey)
      || (file.originalName && versionFile.originalName && file.originalName === versionFile.originalName)
    );
  });
}

function buildOcrForm(ocr = {}) {
  return {
    invoiceName: ocr.invoiceName || '',
    seller: ocr.seller || '',
    totalAmount: ocr.totalAmount || '',
    items: (ocr.items || []).map((item) => ({
      name: item.name || '',
      quantity: item.quantity || '',
      unitPrice: item.unitPrice || '',
      amount: item.amount || '',
    })),
  };
}

function isSameId(a, b) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

export default function DocumentDetail() {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const { documentTypeLabel, locale, t } = useLanguage();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [activity, setActivity] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [ocrForm, setOcrForm] = useState({ invoiceName: '', seller: '', totalAmount: '', items: [] });
  const [ocrError, setOcrError] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSaving, setOcrSaving] = useState(false);
  const [advancedOcrLoading, setAdvancedOcrLoading] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [editingVersionId, setEditingVersionId] = useState(null);
  const [editingVersionLabel, setEditingVersionLabel] = useState('');

  const fetchDoc = () => {
    setLoading(true);
    api.get(`/documents/${id}`).then((res) => setDoc(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  useEffect(() => {
    const version = doc?.versions?.find((item) => isSameId(item._id, selectedVersionId));
    setOcrForm(buildOcrForm(version?.ocr));
  }, [doc?.versions, selectedVersionId]);

  useEffect(() => {
    if (tab === 'activity') {
      api.get(`/documents/${id}/activity`).then((res) => setActivity(res.data));
    }
    if (tab === 'comments') {
      api.get(`/documents/${id}/comments`).then((res) => setComments(res.data));
    }
  }, [tab, id]);

  useEffect(() => {
    if (!selectedVersionId) return undefined;
    const version = doc?.versions?.find((item) => isSameId(item._id, selectedVersionId));
    if (!version || !['pending', 'processing'].includes(version.ocrStatus)) return undefined;

    const timer = setInterval(() => {
      api.get(`/documents/${id}`).then((res) => setDoc(res.data));
    }, 2000);

    return () => clearInterval(timer);
  }, [selectedVersionId, doc?.versions, id]);

  const runOcr = async (provider) => {
    if (!selectedVersionId) return;
    setOcrLoading(true);
    setOcrError('');
    if (provider === 'openai') setAdvancedOcrLoading(true);
    try {
      const res = await api.post(
        `/documents/${id}/versions/${selectedVersionId}/ocr`,
        provider ? { provider } : {},
      );
      const nextOcr = res.data.ocr || {};
      setDoc((current) => ({
        ...current,
        title: res.data.title || current.title,
        metadata: res.data.metadata || current.metadata,
        versions: current.versions.map((version) => (
          isSameId(version._id, selectedVersionId)
            ? { ...version, ...res.data.version, ocrText: res.data.ocrText, ocrStatus: res.data.status, ocr: nextOcr }
            : version
        )),
      }));
      setOcrForm(buildOcrForm(nextOcr));
    } catch (err) {
      const message = err.response?.data?.message || t('documentDetail.ocrFailed');
      setOcrError(message);
    } finally {
      setOcrLoading(false);
      setAdvancedOcrLoading(false);
    }
  };

  const setOcrField = (field, value) => {
    setOcrForm((prev) => ({ ...prev, [field]: value }));
  };

  const setOcrItem = (index, field, value) => {
    setOcrForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addOcrItem = () => {
    setOcrForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '', unitPrice: '', amount: '' }],
    }));
  };

  const removeOcrItem = (index) => {
    setOcrForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const saveOcrMetadata = async () => {
    if (!selectedVersionId) return;
    setOcrSaving(true);
    setOcrError('');
    try {
      const payload = {
        invoiceName: ocrForm.invoiceName,
        seller: ocrForm.seller,
        totalAmount: Number(ocrForm.totalAmount) || 0,
        items: ocrForm.items
          .filter((item) => item.name || item.quantity || item.unitPrice || item.amount)
          .map((item) => ({
            name: item.name,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            amount: Number(item.amount) || 0,
          })),
      };
      const res = await api.patch(`/documents/${id}/versions/${selectedVersionId}/ocr-metadata`, { ocr: payload });
      setDoc(res.data);
    } catch (err) {
      setOcrError(err.response?.data?.message || t('documentDetail.saveOcrFailed'));
    } finally {
      setOcrSaving(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await api.post(`/documents/${id}/comments`, { text: commentText });
    setCommentText('');
    const res = await api.get(`/documents/${id}/comments`);
    setComments(res.data);
  };

  const uploadVersion = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVersionLoading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post(`/documents/${id}/versions`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = res.data;
      setDoc(updated);
      const latest = updated.versions?.[updated.versions.length - 1];
      if (latest?._id) setSelectedVersionId(latest._id);
    } finally {
      setVersionLoading(false);
      e.target.value = '';
    }
  };

  const deleteVersion = async (versionId, e) => {
    e?.stopPropagation();
    if (!confirm(t('documentDetail.confirmDeleteVersion'))) return;
    const res = await api.delete(`/documents/${id}/versions/${versionId}`);
    setDoc(res.data);
    if (isSameId(selectedVersionId, versionId)) setSelectedVersionId(null);
  };

  const viewVersion = (versionId) => {
    if (!versionId) return;
    setTab('versions');
    setSelectedVersionId(versionId);
    setOcrError('');
  };

  const startEditVersion = (version, e) => {
    e?.stopPropagation();
    setEditingVersionId(version._id);
    setEditingVersionLabel(version.label || '');
  };

  const cancelEditVersion = (e) => {
    e?.stopPropagation();
    setEditingVersionId(null);
    setEditingVersionLabel('');
  };

  const saveVersionLabel = async (versionId, e) => {
    e?.stopPropagation();
    const res = await api.patch(`/documents/${id}/versions/${versionId}`, { label: editingVersionLabel.trim() });
    setDoc(res.data);
    setEditingVersionId(null);
    setEditingVersionLabel('');
  };

  if (loading) return <LoadingSpinner />;
  if (!doc) return <p className="text-muted">{t('documentDetail.notFound')}</p>;

  const meta = doc.metadata || {};
  const backPath = getDocumentListPath(doc.type);
  const selectedVersion = doc.versions?.find((v) => isSameId(v._id, selectedVersionId)) || null;
  const selectedVersionOcr = selectedVersion?.ocr || {};

  return (
    <div className="space-y-6">
      <Link to={backPath} className="link-primary inline-flex items-center gap-2 text-sm">
        <ArrowLeft size={16} />
        {t('documentDetail.back')}
      </Link>

      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted">{documentTypeLabel(doc.type)} · {doc.documentNumber}</p>
            <h1 className="text-2xl font-semibold text-heading">{doc.title}</h1>
            {doc.customer && <p className="mt-1 text-body">{t('documentDetail.customer')}: {doc.customer.name}</p>}
          </div>
          <StatusBadge status={doc.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-b border-border">
          {['info', 'versions', 'activity', 'comments'].map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => {
                setTab(tabKey);
                if (tabKey !== 'versions') setSelectedVersionId(null);
              }}
              className={`px-4 py-2 text-sm font-medium capitalize ${tab === tabKey ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
            >
              {tabKey === 'info' && t('documentDetail.tabInfo')}
              {tabKey === 'versions' && t('documentDetail.tabVersions')}
              {tabKey === 'activity' && t('documentDetail.tabActivity')}
              {tabKey === 'comments' && t('documentDetail.tabComments')}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {doc.type === 'invoice' && (
                  <>
                    <InfoItem label={t('contractDetail.totalInvoicesAmount')} value={formatCurrency(meta.amount, locale)} />
                    <InfoItem label="VAT" value={formatCurrency(meta.vat, locale)} />
                    <InfoItem label={t('table.dueDate')} value={formatDate(meta.dueDate, locale)} />
                    <InfoItem label={t('table.paid')} value={meta.paid ? t('statuses.paid') : t('statuses.pending')} />
                  </>
                )}
                {doc.type === 'quotation' && (
                  <>
                    <InfoItem label={t('common.value')} value={formatCurrency(meta.amount, locale)} />
                    <InfoItem label={t('table.validUntil')} value={formatDate(meta.validUntil, locale)} />
                  </>
                )}
                {(doc.type === 'receipt' || doc.type === 'payment_voucher') && (
                  <>
                    <InfoItem label={t('table.amount')} value={formatCurrency(meta.amount, locale)} />
                    <InfoItem label={t('table.paymentMethod')} value={meta.paymentMethod || '-'} />
                  </>
                )}
              </div>
              {doc.description && <p className="text-sm text-body">{doc.description}</p>}
              {doc.files?.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-heading">{t('contractDetail.attachments')}</h3>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="table-header">
                          <tr>
                            <th className="table-cell">{t('common.files')}</th>
                            <th className="table-cell">{t('contractDetail.versionName')}</th>
                            <th className="table-cell">{t('contractDetail.ocrTotalQuantity')}</th>
                            <th className="table-cell">{t('contractDetail.ocrTotalPrice')}</th>
                            <th className="table-cell"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {doc.files.map((f) => {
                            const version = findVersionForFile(doc.versions, f);
                            const showOcr = version && isImageFile(f) && version.ocrStatus === 'done';
                            const summary = showOcr ? getOcrSummary(version.ocr) : null;
                            return (
                              <tr key={f._id} className="table-row">
                                <td className="table-cell">
                                  <a href={f.url} target="_blank" rel="noreferrer" className="link-primary inline-flex items-center gap-2">
                                    <FileDown size={16} />
                                    {f.originalName}
                                  </a>
                                </td>
                                <td className="table-cell text-body">{version ? (version.label || `${t('documentDetail.version')} ${version.version}`) : '-'}</td>
                                <td className="table-cell text-body">
                                  {summary ? (summary.totalQuantity > 0 ? summary.totalQuantity : '-') : '-'}
                                </td>
                                <td className="table-cell text-body">
                                  {summary?.totalPrice > 0 ? formatCurrency(summary.totalPrice, locale) : '-'}
                                </td>
                                <td className="table-cell">
                                  {version && (
                                    <button
                                      type="button"
                                      onClick={() => viewVersion(version._id)}
                                      className="link-primary inline-flex items-center gap-1 text-sm"
                                      title={t('documentDetail.viewVersion')}
                                    >
                                      <Eye size={16} />
                                      {t('documentDetail.view')}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'versions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {isStaff && (
                  <label className="btn-secondary inline-flex cursor-pointer items-center gap-2 text-xs">
                    <Upload size={14} className={versionLoading ? 'animate-pulse' : ''} />
                    {versionLoading ? t('documentDetail.uploading') : t('documentDetail.addVersion')}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.docx,.xlsx"
                      className="hidden"
                      onChange={uploadVersion}
                      disabled={versionLoading}
                    />
                  </label>
                )}
                {doc.versions?.length > 0 && (
                  <select
                    value={selectedVersionId || ''}
                    onChange={(e) => {
                      setSelectedVersionId(e.target.value || null);
                      setOcrError('');
                    }}
                    className="input-field w-auto min-w-56 py-2 text-sm"
                  >
                    <option value="">{t('documentDetail.selectVersion')}</option>
                    {doc.versions.map((v) => (
                      <option key={v._id} value={v._id}>
                        {(v.label || `${t('documentDetail.version')} ${v.version}`)}{v.file?.originalName ? ` 📄 ${v.file.originalName}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {!doc.versions?.length && (
                <p className="text-muted">{t('documentDetail.noVersions')}</p>
              )}

              {selectedVersion && (
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-body-bg p-3">
                  <GitBranch size={16} className="text-primary" />
                  <div className="flex-1">
                    {editingVersionId === selectedVersion._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editingVersionLabel}
                          onChange={(e) => setEditingVersionLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveVersionLabel(selectedVersion._id, e);
                            if (e.key === 'Escape') cancelEditVersion(e);
                          }}
                          autoFocus
                          placeholder={`${t('documentDetail.version')} ${selectedVersion.version}`}
                          className="input-field py-1 text-sm"
                        />
                        <button type="button" onClick={(e) => saveVersionLabel(selectedVersion._id, e)} className="text-primary transition hover:opacity-80" title={t('documentDetail.saveName')}>
                          <Check size={16} />
                        </button>
                        <button type="button" onClick={(e) => cancelEditVersion(e)} className="text-muted transition hover:opacity-80" title={t('documentDetail.cancel')}>
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-heading">
                        {selectedVersion.label || `${t('documentDetail.version')} ${selectedVersion.version}`}
                      </p>
                    )}
                    <p className="text-xs text-muted">
                      {selectedVersion.uploadedBy?.name || t('documentDetail.unknown')} · {formatDate(selectedVersion.uploadedAt, locale)}
                    </p>
                  </div>
                  {selectedVersion.file?.url && (
                    <a href={selectedVersion.file.url} target="_blank" rel="noreferrer" className="link-primary text-sm">
                      {selectedVersion.file.originalName}
                    </a>
                  )}
                  {isStaff && editingVersionId !== selectedVersion._id && (
                    <button type="button" onClick={(e) => startEditVersion(selectedVersion, e)} className="text-muted transition hover:text-primary" title={t('documentDetail.renameVersion')}>
                      <Pencil size={16} />
                    </button>
                  )}
                  {isStaff && (
                    <button type="button" onClick={(e) => deleteVersion(selectedVersion._id, e)} className="text-danger transition hover:opacity-80" title={t('documentDetail.deleteVersion')}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}

              {selectedVersion && (
                <OcrPanel
                  ocrData={selectedVersionOcr}
                  ocrForm={ocrForm}
                  ocrError={ocrError}
                  ocrLoading={ocrLoading}
                  ocrSaving={ocrSaving}
                  advancedOcrLoading={advancedOcrLoading}
                  isStaff={isStaff}
                  version={selectedVersion}
                  onRunOcr={runOcr}
                  onClose={() => setSelectedVersionId(null)}
                  onAddItem={addOcrItem}
                  onSave={saveOcrMetadata}
                  onSetField={setOcrField}
                  onSetItem={setOcrItem}
                  onRemoveItem={removeOcrItem}
                />
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-3">
              {activity.length === 0 ? (
                <p className="text-muted">{t('documentDetail.noActivity')}</p>
              ) : (
                activity.map((log) => (
                  <div key={log._id} className="flex gap-3 rounded-md border border-border p-3">
                    <History size={16} className="mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm text-heading">{log.description}</p>
                      <p className="text-xs text-muted">{log.user?.name} · {formatDate(log.createdAt, locale)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'comments' && (
            <div className="space-y-4">
              {isStaff && (
                <form onSubmit={submitComment} className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('documentDetail.commentPlaceholder')}
                    className="input-field flex-1"
                  />
                  <button type="submit" className="btn-primary">
                    <MessageSquare size={16} />
                  </button>
                </form>
              )}
              {comments.map((c) => (
                <div key={c._id} className="rounded-md border border-border p-3">
                  <p className="text-sm text-heading">{c.text}</p>
                  <p className="mt-1 text-xs text-muted">{c.user?.name} · {formatDate(c.createdAt, locale)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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

function OcrPanel({
  ocrData,
  ocrForm,
  ocrError,
  ocrLoading,
  ocrSaving,
  advancedOcrLoading,
  isStaff,
  version,
  onRunOcr,
  onClose,
  onAddItem,
  onSave,
  onSetField,
  onSetItem,
  onRemoveItem,
}) {
  const { t } = useLanguage();
  const hasStructuredOcr = Boolean(
    ocrData.invoiceName || ocrData.seller || ocrData.totalAmount || ocrData.items?.length > 0,
  );0

  return (
    <div className="mt-2 rounded-xl border border-border p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-heading">
            OCR · {version.label || `${t('documentDetail.version')} ${version.version}`}
            {version.file?.originalName ? ` · ${version.file.originalName}` : ''}
          </p>
          <p className="text-sm text-muted">{t('documentDetail.status')}: {version.ocrStatus || 'pending'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">
            {t('documentDetail.close')}
          </button>
          {isStaff && (
            <>
              <button type="button" onClick={() => onRunOcr('tesseract')} disabled={ocrLoading} className="btn-secondary text-xs">
                <RefreshCw size={14} className={ocrLoading && !advancedOcrLoading ? 'animate-spin' : ''} />
                {t('documentDetail.scanLocal')}
              </button>
              <button type="button" onClick={() => onRunOcr('openai')} disabled={ocrLoading} className="btn-primary px-3 py-2 text-xs">
                <RefreshCw size={14} className={advancedOcrLoading ? 'animate-spin' : ''} />
                {t('documentDetail.scanAdvanced')}
              </button>
            </>
          )}
        </div>
      </div>
      {ocrError && <div className="alert-error mb-4">{ocrError}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {version.file?.url && isImageFile(version.file) && (
          <div className="overflow-hidden rounded-md border border-border bg-body-bg">
            <img src={version.file.url} alt={version.file.originalName} className="max-h-[70vh] w-full object-contain" />
          </div>
        )}
        <pre className="min-h-48 max-h-[70vh] resize-y overflow-auto rounded-md bg-body-bg p-4 text-sm whitespace-pre-wrap text-body">
          {version.ocrText || t('documentDetail.noOcrText')}
        </pre>
      </div>
      {(version.ocrStatus === 'done' || hasStructuredOcr) && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-end gap-2">
            {isStaff && (
              <>
                <button type="button" onClick={onAddItem} className="btn-secondary px-3 py-2 text-xs">{t('documentDetail.addItem')}</button>
                <button type="button" onClick={onSave} disabled={ocrSaving} className="btn-primary px-3 py-2 text-xs">
                  {ocrSaving ? t('documentDetail.saving') : t('documentDetail.saveOcr')}
                </button>
              </>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <EditableOcrField label={t('documentDetail.invoiceName')} value={ocrForm.invoiceName} onChange={(value) => onSetField('invoiceName', value)} disabled={!isStaff} />
            <EditableOcrField label={t('documentDetail.seller')} value={ocrForm.seller} onChange={(value) => onSetField('seller', value)} disabled={!isStaff} />
            <EditableOcrField label={t('documentDetail.totalOcr')} type="number" value={ocrForm.totalAmount} onChange={(value) => onSetField('totalAmount', value)} disabled={!isStaff} />
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-body-bg px-4 py-3">
              <h3 className="font-medium text-heading">{t('documentDetail.itemsTitle')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell">{t('documentDetail.itemName')}</th>
                    <th className="table-cell">{t('documentDetail.qty')}</th>
                    <th className="table-cell">{t('documentDetail.unitPrice')}</th>
                    <th className="table-cell">{t('documentDetail.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrForm.items.map((item, idx) => (
                    <tr key={`${item.name}-${idx}`} className="table-row">
                      <td className="table-cell">
                        <input value={item.name} onChange={(e) => onSetItem(idx, 'name', e.target.value)} disabled={!isStaff} className="input-field min-w-40 py-1.5" />
                      </td>
                      <td className="table-cell">
                        <input type="number" value={item.quantity} onChange={(e) => onSetItem(idx, 'quantity', e.target.value)} disabled={!isStaff} className="input-field w-24 py-1.5" />
                      </td>
                      <td className="table-cell">
                        <input type="number" value={item.unitPrice} onChange={(e) => onSetItem(idx, 'unitPrice', e.target.value)} disabled={!isStaff} className="input-field w-32 py-1.5" />
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <input type="number" value={item.amount} onChange={(e) => onSetItem(idx, 'amount', e.target.value)} disabled={!isStaff} className="input-field w-32 py-1.5" />
                          {isStaff && (
                            <button type="button" onClick={() => onRemoveItem(idx)} className="text-danger hover:opacity-80">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!ocrForm.items.length && <p className="py-8 text-center text-muted">{t('documentDetail.noItems')}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableOcrField({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <div className="rounded-md bg-body-bg p-3">
      <label className="text-xs text-muted">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent font-medium text-heading outline-none disabled:cursor-default"
      />
    </div>
  );
}
