import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Clock, DollarSign, FileText, HandCoins, Mail, Phone, Wallet } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import AdvanceCard from '../components/ui/AdvanceCard';
import StatCard from '../components/ui/StatCard';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../utils/constants';

export default function CustomerDetail() {
  const { id } = useParams();
  const { locale, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/customers/${id}/overview`).then((res) => setData(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-muted">{t('customerDetail.notFound')}</p>;

  const { customer, contracts, paymentSummary, recentPayments, activity } = data;

  return (
    <div className="space-y-6">
      <Link to="/customers" className="link-primary inline-flex items-center gap-2 text-sm">
        <ArrowLeft size={16} />
        {t('customerDetail.back')}
      </Link>

      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-muted">{t('customerDetail.profile')}</p>
            <h1 className="text-2xl font-semibold text-heading">{customer.name}</h1>
            {customer.company && (
              <p className="mt-1 flex items-center gap-2 text-body">
                <Building2 size={16} />
                {customer.company}
              </p>
            )}
          </div>
          <div className="grid gap-2 text-sm text-body sm:grid-cols-2 lg:min-w-96">
            <InfoLine icon={Mail} value={customer.email} />
            <InfoLine icon={Phone} value={customer.phone || '-'} />
            <InfoLine icon={Building2} value={customer.taxCode || t('customerDetail.missingTaxCode')} />
            <InfoLine icon={Clock} value={formatDate(customer.createdAt, locale)} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label={t('customerDetail.contractCount')} value={paymentSummary.contractCount} unit={t('common.contracts')} iconBg="bg-primary-light" iconColor="text-primary" />
        <StatCard icon={DollarSign} label={t('dashboard.totalContractValue')} value={formatCurrency(paymentSummary.totalContractValue, locale)} unit="VND" iconBg="bg-warning-light" iconColor="text-warning" />
        <StatCard icon={HandCoins} label={t('dashboard.totalPaid')} value={formatCurrency(paymentSummary.totalPaid, locale)} unit="VND" iconBg="bg-success-light" iconColor="text-success" />
        <StatCard icon={Wallet} label={t('dashboard.outstanding')} value={formatCurrency(paymentSummary.outstanding, locale)} unit="VND" iconBg="bg-danger-light" iconColor="text-danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <AdvanceCard title={t('customerDetail.contractsTitle')} subtitle={`${contracts.length} ${t('common.contracts')}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">{t('dashboard.contractNumber')}</th>
                  <th className="table-cell">{t('common.title')}</th>
                  <th className="table-cell">{t('common.value')}</th>
                  <th className="table-cell">{t('dashboard.endDate')}</th>
                  <th className="table-cell">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract._id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/contracts/${contract._id}`} className="link-primary font-medium">{contract.contractNumber}</Link>
                    </td>
                    <td className="table-cell text-heading">{contract.title}</td>
                    <td className="table-cell">{formatCurrency(contract.value, locale)}</td>
                    <td className="table-cell">{formatDate(contract.endDate, locale)}</td>
                    <td className="table-cell"><StatusBadge status={contract.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contracts.length === 0 && <p className="py-10 text-center text-muted">{t('customerDetail.noContracts')}</p>}
          </div>
        </AdvanceCard>

        <AdvanceCard title={t('customerDetail.recentPayments')} subtitle={`${recentPayments.length} ${t('common.transactions')}`}>
          <div className="divide-y divide-border">
            {recentPayments.map((payment) => (
              <div key={payment._id} className="px-6 py-4">
                <p className="font-medium text-heading">{formatCurrency(payment.amount, locale)}</p>
                <p className="mt-1 text-sm text-body">{payment.contract?.documentNumber} - {payment.contract?.title}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(payment.paidAt, locale)} · {payment.method || t('customerDetail.unknownMethod')}</p>
              </div>
            ))}
            {recentPayments.length === 0 && <p className="px-6 py-10 text-center text-muted">{t('customerDetail.noPayments')}</p>}
          </div>
        </AdvanceCard>
      </div>

      <AdvanceCard title={t('customerDetail.activityTitle')} subtitle={`${activity.length} ${t('common.activities')}`}>
        <div className="divide-y divide-border">
          {activity.map((item) => (
            <div key={item._id} className="px-6 py-4">
              <p className="text-sm font-medium text-heading">{item.description}</p>
              <p className="mt-1 text-xs text-muted">
                {item.document?.documentNumber || 'Document'} · {item.user?.name || 'System'} · {formatDate(item.createdAt, locale)}
              </p>
            </div>
          ))}
          {activity.length === 0 && <p className="px-6 py-10 text-center text-muted">{t('customerDetail.noActivity')}</p>}
        </div>
      </AdvanceCard>
    </div>
  );
}

function InfoLine({ icon: Icon, value }) {
  return (
    <span className="flex items-center gap-2 rounded-xl bg-body-bg px-3 py-2">
      <Icon size={15} className="text-primary" />
      <span className="truncate">{value}</span>
    </span>
  );
}
