import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { STATUS_OPTIONS_BY_TYPE } from '../../utils/constants';

const EMPTY = {
  documentNumber: '',
  title: '',
  customer: '',
  status: 'draft',
  // contract
  contractType: '',
  manager: '',
  department: '',
  valueBeforeTax: '',
  vat: '',
  value: '',
  currency: 'VND',
  exchangeRate: '',
  signDate: '',
  startDate: '',
  endDate: '',
  termMonths: '',
  paymentTerms: '',
  paymentMethod: '',
  paymentInstallments: '',
  specialTerms: '',
  internalNote: '',
  description: '',
  // invoice
  invoiceForm: '',
  invoiceSerial: '',
  invoiceType: '',
  createdDate: '',
  issueDate: '',
  dueDate: '',
  amount: '',
  discount: '',
  total: '',
  paid: false,
  paidAmount: '',
  supplier: '',
  // quotation
  validUntil: '',
  // receipt / payment_voucher
  direction: 'in',
  preparedBy: '',
  approvedBy: '',
  partyType: '',
  reason: '',
  note: '',
};

function Section({ title, children, cols = 2 }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      <div className={`grid gap-4 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>{children}</div>
    </div>
  );
}

function Field({ label, children, full = false }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

export default function DocumentForm({ type, customers = [], initial, onSuccess, onCancel, endpoint = '/documents' }) {
  const { statusLabel, t } = useLanguage();
  const tf = (k) => t(`documentForm.${k}`);
  const [form, setForm] = useState({
    ...EMPTY,
    status: STATUS_OPTIONS_BY_TYPE[type]?.[0]?.value || 'draft',
    direction: type === 'receipt' ? 'in' : 'out',
    ...initial,
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const num = (key) => (
    <input type="number" value={form[key]} onChange={(e) => set(key, e.target.value)} className="input-field" />
  );
  const text = (key) => (
    <input value={form[key]} onChange={(e) => set(key, e.target.value)} className="input-field" />
  );
  const dateInput = (key, required = false) => (
    <input type="date" required={required} value={form[key]} onChange={(e) => set(key, e.target.value)} className="input-field" />
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries({ ...form, type }).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) data.append(k, v);
      });
      files.forEach((f) => data.append('files', f));
      const payload = endpoint === '/contracts' ? renameForContract(data) : data;
      await api.post(endpoint, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || tf('saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = STATUS_OPTIONS_BY_TYPE[type] || [];
  const isReceipt = type === 'receipt' || type === 'payment_voucher';

  return (
    <form onSubmit={handleSubmit} className="max-h-[72vh] space-y-6 overflow-y-auto pr-1">
      {error && <div className="alert-error">{error}</div>}

      <Section title={tf('sectionGeneral')}>
        <Field label={`${tf('documentNumber')} *`}>
          <input required value={form.documentNumber} onChange={(e) => set('documentNumber', e.target.value)} className="input-field" />
        </Field>
        <Field label={`${tf('title')} *`}>
          <input required value={form.title} onChange={(e) => set('title', e.target.value)} className="input-field" />
        </Field>

        {(type === 'invoice' || type === 'quotation' || type === 'contract') && (
          <Field label={tf('customer')} full>
            <select value={form.customer} onChange={(e) => set('customer', e.target.value)} className="input-field">
              <option value="">{tf('selectCustomer')}</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </Field>
        )}

        {type === 'contract' && (
          <>
            <Field label={tf('contractType')}>{text('contractType')}</Field>
            <Field label={tf('manager')}>{text('manager')}</Field>
            <Field label={tf('department')}>{text('department')}</Field>
          </>
        )}

        {type === 'invoice' && (
          <>
            <Field label={tf('invoiceForm')}>{text('invoiceForm')}</Field>
            <Field label={tf('invoiceSerial')}>{text('invoiceSerial')}</Field>
            <Field label={tf('invoiceType')}>{text('invoiceType')}</Field>
            <Field label={tf('supplier')}>{text('supplier')}</Field>
          </>
        )}

        {type === 'quotation' && <Field label={tf('manager')}>{text('manager')}</Field>}

        {isReceipt && (
          <>
            <Field label={tf('preparedBy')}>{text('preparedBy')}</Field>
            <Field label={tf('approvedBy')}>{text('approvedBy')}</Field>
            <Field label={tf('partyType')}>
              <select value={form.partyType} onChange={(e) => set('partyType', e.target.value)} className="input-field">
                <option value="">--</option>
                <option value="customer">{tf('partyCustomer')}</option>
                <option value="supplier">{tf('partySupplier')}</option>
                <option value="employee">{tf('partyEmployee')}</option>
              </select>
            </Field>
          </>
        )}
      </Section>

      <Section title={tf('sectionValue')} cols={3}>
        {type === 'contract' && (
          <>
            <Field label={tf('valueBeforeTax')}>{num('valueBeforeTax')}</Field>
            <Field label={tf('vat')}>{num('vat')}</Field>
            <Field label={tf('value')}>{num('value')}</Field>
            <Field label={tf('currency')}>{text('currency')}</Field>
            <Field label={tf('exchangeRate')}>{num('exchangeRate')}</Field>
          </>
        )}
        {(type === 'invoice' || type === 'quotation') && (
          <>
            <Field label={`${tf('amount')} *`}>
              <input type="number" required value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input-field" />
            </Field>
            <Field label={tf('vat')}>{num('vat')}</Field>
            <Field label={tf('discount')}>{num('discount')}</Field>
            <Field label={tf('total')}>{num('total')}</Field>
            {type === 'invoice' && <Field label={tf('currency')}>{text('currency')}</Field>}
          </>
        )}
        {isReceipt && (
          <>
            <Field label={`${tf('amount')} *`}>
              <input type="number" required value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input-field" />
            </Field>
            <Field label={tf('currency')}>{text('currency')}</Field>
          </>
        )}
      </Section>

      {(type === 'contract' || type === 'invoice' || type === 'quotation') && (
        <Section title={tf('sectionTime')} cols={3}>
          {type === 'contract' && (
            <>
              <Field label={tf('signDate')}>{dateInput('signDate')}</Field>
              <Field label={`${tf('startDate')} *`}>{dateInput('startDate', true)}</Field>
              <Field label={`${tf('endDate')} *`}>{dateInput('endDate', true)}</Field>
              <Field label={tf('termMonths')}>{num('termMonths')}</Field>
            </>
          )}
          {type === 'invoice' && (
            <>
              <Field label={tf('createdDate')}>{dateInput('createdDate')}</Field>
              <Field label={tf('issueDate')}>{dateInput('issueDate')}</Field>
              <Field label={`${tf('dueDate')} *`}>{dateInput('dueDate', true)}</Field>
            </>
          )}
          {type === 'quotation' && (
            <>
              <Field label={tf('createdDate')}>{dateInput('createdDate')}</Field>
              <Field label={`${tf('validUntil')} *`}>{dateInput('validUntil', true)}</Field>
            </>
          )}
        </Section>
      )}

      {(type === 'contract' || type === 'invoice' || isReceipt) && (
        <Section title={tf('sectionPayment')}>
          {type === 'contract' && (
            <>
              <Field label={tf('paymentTerms')} full>
                <textarea value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} className="input-field" rows={2} />
              </Field>
              <Field label={tf('paymentMethod')}>{text('paymentMethod')}</Field>
              <Field label={tf('paymentInstallments')}>{num('paymentInstallments')}</Field>
            </>
          )}
          {type === 'invoice' && (
            <>
              <Field label={tf('paidAmount')}>{num('paidAmount')}</Field>
              <div className="flex items-center gap-2 pt-7">
                <input type="checkbox" checked={form.paid} onChange={(e) => set('paid', e.target.checked)} id="paid" />
                <label htmlFor="paid" className="text-sm text-body">{tf('paid')}</label>
              </div>
            </>
          )}
          {isReceipt && (
            <Field label={tf('paymentMethod')} full>
              <input value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} className="input-field" placeholder={tf('paymentMethodPlaceholder')} />
            </Field>
          )}
        </Section>
      )}

      <Section title={tf('sectionContent')}>
        {isReceipt && (
          <Field label={tf('reason')} full>
            <textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} className="input-field" rows={2} />
          </Field>
        )}
        <Field label={isReceipt ? tf('note') : tf('description')} full>
          <textarea value={isReceipt ? form.note : form.description} onChange={(e) => set(isReceipt ? 'note' : 'description', e.target.value)} className="input-field" rows={3} />
        </Field>
        {type === 'contract' && (
          <>
            <Field label={tf('specialTerms')} full>
              <textarea value={form.specialTerms} onChange={(e) => set('specialTerms', e.target.value)} className="input-field" rows={2} />
            </Field>
            <Field label={tf('internalNote')} full>
              <textarea value={form.internalNote} onChange={(e) => set('internalNote', e.target.value)} className="input-field" rows={2} />
            </Field>
          </>
        )}
        {statusOptions.length > 0 && (
          <Field label={tf('status')}>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input-field">
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{statusLabel(s.value)}</option>
              ))}
            </select>
          </Field>
        )}
      </Section>

      <div>
        <label className="input-label">{tf('files')}</label>
        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.docx,.xlsx,.doc,.xls" onChange={(e) => setFiles(Array.from(e.target.files))} className="w-full text-sm" />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">{tf('cancel')}</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? tf('saving') : tf('create')}
        </button>
      </div>
    </form>
  );
}

function renameForContract(data) {
  const out = new FormData();
  for (const [k, v] of data.entries()) {
    out.append(k === 'documentNumber' ? 'contractNumber' : k, v);
  }
  return out;
}
