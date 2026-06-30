import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Receipt, FileSpreadsheet, Wallet, AlarmClock, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SummaryCard from '../components/ui/SummaryCard';
import RevenueChart from '../components/ui/RevenueChart';
import DonutChart from '../components/ui/DonutChart';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate, getDocumentDetailPath } from '../utils/constants';

const TABLE_ACCENTS = {
  warning: { box: 'bg-warning/15 ring-1 ring-warning/20', title: 'text-warning' },
  danger: { box: 'bg-danger/15 ring-1 ring-danger/20', title: 'text-danger' },
  success: { box: 'bg-success/15 ring-1 ring-success/20', title: 'text-success' },
  info: { box: 'bg-info/15 ring-1 ring-info/20', title: 'text-info' },
  primary: { box: 'bg-primary/15 ring-1 ring-primary/20', title: 'text-primary' },
};

function RecentTable({ title, to, rows, locale, t, bare = false, accent }) {
  const px = bare ? 'px-3' : 'px-6';
  const a = accent ? TABLE_ACCENTS[accent] : null;
  const outer = a ? `rounded-[10px] ${a.box}` : bare ? 'rounded-[10px] border border-border/60' : 'rounded-[10px] bg-card shadow-card';
  const titleColor = a ? a.title : 'text-heading';
  return (
    <div className={`flex flex-col overflow-hidden ${outer}`}>
      <div className={`flex items-center justify-between border-b border-border/40 ${px} py-3`}>
        <h3 className={`font-semibold ${titleColor} ${bare ? 'text-lg' : 'text-lg'}`}>{title}</h3>
        <Link to={to} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {t('dashboard.viewAll')}
          <ArrowRight size={13} />
        </Link>
      </div>
      <div className="flex-1 overflow-x-auto">
        {rows.length === 0 ? (
          <p className={`${px} py-6 text-center text-sm text-muted`}>{t('dashboard.noData')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className={`${px} py-2.5 text-left font-medium`}>{t('dashboard.code')}</th>
                <th className={`${px} py-2.5 text-left font-medium`}>{t('common.customer')}</th>
                <th className={`${px} py-2.5 text-right font-medium`}>{t('dashboard.amount')}</th>
                <th className={`${px} py-2.5 text-left font-medium`}>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b border-border/50 transition hover:bg-body-bg">
                  <td className={`${px} py-2.5`}>
                    <Link to={getDocumentDetailPath(r)} className="font-medium text-primary hover:underline">
                      {r.documentNumber || '-'}
                    </Link>
                  </td>
                  <td className={`${px} py-2.5 text-body`}>{r.customer?.name || '-'}</td>
                  <td className={`${px} py-2.5 text-right font-medium text-heading`}>{formatCurrency(r.amount, locale)}</td>
                  <td className={`${px} py-2.5`}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { locale, t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const contracts = stats.contracts || {};
  const invoices = stats.invoices || {};
  const quotations = stats.quotations || {};
  const vouchers = stats.vouchers || {};
  const recent = stats.recent || {};
  const invoiceStatus = stats.invoiceStatus || {};
  const statusTotal = (invoiceStatus.paid ?? 0) + (invoiceStatus.unpaid ?? 0) + (invoiceStatus.overdue ?? 0);
  const statusPct = (n) => (statusTotal > 0 ? Math.round(((n ?? 0) / statusTotal) * 100) : 0);

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          icon={FileText}
          accent="primary"
          label={t('dashboard.cardContracts')}
          value={contracts.total ?? 0}
          caption={t('dashboard.cardContractsCaption')}
          rows={[
            { label: t('dashboard.inProgress'), value: contracts.active ?? 0, dot: 'primary' },
            { label: t('dashboard.completed'), value: contracts.completed ?? 0, dot: 'success' },
          ]}
          to="/contracts"
          viewLabel={t('dashboard.viewDetail')}
        />
        <SummaryCard
          icon={Receipt}
          accent="success"
          label={t('dashboard.cardInvoices')}
          value={invoices.total ?? 0}
          caption={t('dashboard.cardInvoicesCaption')}
          rows={[
            { label: t('dashboard.paid'), value: invoices.paid ?? 0, dot: 'success' },
            { label: t('dashboard.unpaid'), value: invoices.unpaid ?? 0, dot: 'warning' },
          ]}
          to="/invoices"
          viewLabel={t('dashboard.viewDetail')}
        />
        <SummaryCard
          icon={FileSpreadsheet}
          accent="info"
          label={t('dashboard.cardQuotations')}
          value={quotations.total ?? 0}
          caption={t('dashboard.cardQuotationsCaption')}
          rows={[
            { label: t('dashboard.accepted'), value: quotations.accepted ?? 0, dot: 'info' },
            { label: t('dashboard.notAccepted'), value: quotations.pending ?? 0, dot: 'danger' },
          ]}
          to="/quotations"
          viewLabel={t('dashboard.viewDetail')}
        />
        <SummaryCard
          icon={Wallet}
          accent="warning"
          label={t('dashboard.cardVouchers')}
          value={vouchers.total ?? 0}
          caption={t('dashboard.cardVouchersCaption')}
          rows={[
            { label: t('dashboard.receipts'), value: vouchers.receipts ?? 0, dot: 'success' },
            { label: t('dashboard.vouchers'), value: vouchers.vouchers ?? 0, dot: 'danger' },
          ]}
          to="/receipts"
          viewLabel={t('dashboard.viewDetail')}
        />
        <SummaryCard
          icon={AlarmClock}
          accent="warning"
          label={t('dashboard.cardUnpaid')}
          value={invoices.unpaid ?? 0}
          caption={t('dashboard.cardUnpaidCaption')}
          rows={[
            { label: t('dashboard.amount'), value: formatCurrency(invoices.unpaidAmount ?? 0, locale), dot: 'warning' },
            { label: t('dashboard.overdue'), value: invoices.overdue ?? 0, dot: 'danger' },
          ]}
          to="/invoices"
          viewLabel={t('dashboard.viewDetail')}
        />
        <SummaryCard
          icon={AlertTriangle}
          accent="danger"
          label={t('dashboard.cardOverdue')}
          value={invoices.overdue ?? 0}
          caption={t('dashboard.cardOverdueCaption')}
          rows={[
            { label: t('dashboard.amount'), value: formatCurrency(invoices.overdueAmount ?? 0, locale), dot: 'danger' },
            { label: t('dashboard.unpaid'), value: invoices.unpaid ?? 0, dot: 'warning' },
          ]}
          to="/invoices"
          viewLabel={t('dashboard.viewDetail')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-6">
        <div className="rounded-[10px] bg-card p-6 shadow-card lg:col-span-4">
          <h2 className="mb-2 text-[22px] font-semibold leading-tight text-heading">{t('dashboard.revenueTitle')}</h2>
          <RevenueChart
            data={stats.invoiceTrend || []}
            locale={locale}
            height={400}
            series={[
              { key: 'paid', label: t('dashboard.paid'), color: 'success', legendValue: invoiceStatus.paid ?? 0, legendPct: statusPct(invoiceStatus.paid) },
              { key: 'unpaid', label: t('dashboard.unpaid'), color: 'warning', legendValue: invoiceStatus.unpaid ?? 0, legendPct: statusPct(invoiceStatus.unpaid) },
              { key: 'overdue', label: t('dashboard.overdue'), color: 'danger', legendValue: invoiceStatus.overdue ?? 0, legendPct: statusPct(invoiceStatus.overdue) },
            ]}
          />
        </div>
        <div className="flex flex-col rounded-[10px] bg-card p-6 shadow-card lg:col-span-2">
          <h2 className="mb-4 text-[22px] font-semibold leading-tight text-heading">{t('dashboard.invoiceStatusTitle')}</h2>
          <DonutChart
            centerLabel={t('dashboard.totalLabel')}
            segments={[
              { label: t('dashboard.paid'), value: invoiceStatus.paid ?? 0, color: 'success' },
              { label: t('dashboard.unpaid'), value: invoiceStatus.unpaid ?? 0, color: 'warning' },
              { label: t('dashboard.overdue'), value: invoiceStatus.overdue ?? 0, color: 'danger' },
            ]}
          />
          <div className="mt-5 grid flex-1 auto-rows-fr gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
            <RecentTable bare accent="warning" title={t('dashboard.cardUnpaid')} to="/invoices" rows={recent.unpaid || []} locale={locale} t={t} />
            <RecentTable bare accent="danger" title={t('dashboard.cardOverdue')} to="/invoices" rows={recent.overdue || []} locale={locale} t={t} />
          </div>
        </div>
      </div>

      <div className="grid flex-1 auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-4">
        <RecentTable title={t('dashboard.recentContracts')} to="/contracts" rows={recent.contracts || []} locale={locale} t={t} />
        <RecentTable title={t('dashboard.recentInvoices')} to="/invoices" rows={recent.invoices || []} locale={locale} t={t} />
        <RecentTable title={t('dashboard.recentQuotations')} to="/quotations" rows={recent.quotations || []} locale={locale} t={t} />
        <RecentTable title={t('dashboard.recentVouchers')} to="/receipts" rows={recent.vouchers || []} locale={locale} t={t} />
      </div>
    </div>
  );
}
