import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/ui/PageHeader';
import AdvanceCard from '../components/ui/AdvanceCard';
import { formatDate } from '../utils/constants';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications').then((res) => setNotifications(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    fetchNotifications();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo"
        subtitle="Nhắc nhở gia hạn và cập nhật hợp đồng"
        action={notifications.some((n) => !n.isRead) && (
          <button type="button" onClick={markAllRead} className="btn-secondary">
            <CheckCheck size={16} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      />

      <AdvanceCard title="Hoạt động gần đây" subtitle={`${notifications.length} thông báo`} bodyClass="p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <Bell className="mx-auto mb-3 text-border" size={40} />
            Không có thông báo
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`rounded-md border p-4 transition ${!n.isRead ? 'border-primary/30 bg-primary-light/30' : 'border-border bg-white'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-heading">{n.title}</h3>
                  <p className="mt-1 text-sm text-body">{n.message}</p>
                  <p className="mt-2 text-xs text-muted">{formatDate(n.createdAt)}</p>
                  {n.contract && (
                    <Link to={`/contracts/${n.contract._id}`} className="link-primary mt-2 inline-block text-sm">
                      Xem hợp đồng {n.contract.contractNumber}
                    </Link>
                  )}
                </div>
                {!n.isRead && (
                  <button type="button" onClick={() => markRead(n._id)} className="btn-primary shrink-0 px-3 py-1 text-xs">
                    Đã đọc
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </AdvanceCard>
    </div>
  );
}
