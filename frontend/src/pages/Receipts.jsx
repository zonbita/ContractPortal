import { useState } from 'react';
import DocumentListPage from '../components/documents/DocumentListPage';
import { useLanguage } from '../context/LanguageContext';

const TABS = [
  { type: 'receipt' },
  { type: 'payment_voucher' },
];

export default function Receipts() {
  const { documentTypeLabel, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('receipt');
  const tab = TABS.find((t) => t.type === activeTab) || TABS[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {TABS.map(({ type }) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === type
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-heading'
            }`}
          >
            {documentTypeLabel(type)}
          </button>
        ))}
      </div>
      <DocumentListPage
        key={tab.type}
        type={tab.type}
        title={language === 'vi' ? 'Phiếu thu / chi' : 'Receipts / Vouchers'}
        subtitle={documentTypeLabel(tab.type)}
        createLabel={`${language === 'vi' ? 'Tạo' : 'Create'} ${documentTypeLabel(tab.type).toLowerCase()}`}
      />
    </div>
  );
}
