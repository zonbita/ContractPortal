import DocumentListPage from '../components/documents/DocumentListPage';
import { useLanguage } from '../context/LanguageContext';

export default function Quotations() {
  const { documentTypeLabel, language } = useLanguage();

  return (
    <DocumentListPage
      type="quotation"
      title={documentTypeLabel('quotation')}
      subtitle={language === 'vi' ? 'Quản lý báo giá gửi khách hàng' : 'Manage quotations sent to customers'}
      createLabel={language === 'vi' ? 'Tạo báo giá' : 'Create quotation'}
    />
  );
}
