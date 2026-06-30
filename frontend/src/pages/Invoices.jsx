import DocumentListPage from '../components/documents/DocumentListPage';
import { useLanguage } from '../context/LanguageContext';

export default function Invoices() {
  const { documentTypeLabel, language } = useLanguage();

  return (
    <DocumentListPage
      type="invoice"
      title={documentTypeLabel('invoice')}
      subtitle={language === 'vi' ? 'Quản lý hóa đơn và theo dõi thanh toán' : 'Manage invoices and track payments'}
      createLabel={language === 'vi' ? 'Tạo hóa đơn' : 'Create invoice'}
    />
  );
}
