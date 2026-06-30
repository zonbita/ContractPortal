import { Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import AdvanceCard from '../components/ui/AdvanceCard';
import EmptyStateIllustration from '../components/ui/EmptyStateIllustration';

export default function Trash() {
  return (
    <div className="space-y-6">
      <PageHeader title="Thùng rác" subtitle="Tài liệu đã xóa sẽ hiển thị tại đây" />

      <AdvanceCard icon={Trash2} title="Tài liệu đã xóa" subtitle="Chức năng đang được phát triển">
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <EmptyStateIllustration />
          <p className="mt-4 text-base font-medium text-heading">Thùng rác trống</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Các tài liệu bạn xóa sẽ được lưu tạm thời tại đây trước khi xóa vĩnh viễn
          </p>
        </div>
      </AdvanceCard>
    </div>
  );
}
