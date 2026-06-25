import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { RoleBadge } from '../components/StatusBadge';
import PageHeader from '../components/ui/PageHeader';
import AdvanceCard from '../components/ui/AdvanceCard';
import { ROLE_OPTIONS, formatDate } from '../utils/constants';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/auth/users')
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải danh sách user'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const handleRoleChange = async (userId, role) => {
    setMessage('');
    setError('');
    setUpdatingId(userId);
    try {
      const res = await api.put(`/auth/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data : u)));
      setMessage('Đã cập nhật role thành công');
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật role thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Quản trị User" subtitle="Quản lý tài khoản và phân quyền người dùng" />

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input type="text" placeholder="Tìm theo tên, email, role..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <AdvanceCard title="Danh sách người dùng" subtitle={`${filteredUsers.length} tài khoản`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Họ tên</th>
                  <th className="table-cell">Email</th>
                  <th className="table-cell">Role</th>
                  <th className="table-cell">Trạng thái</th>
                  <th className="table-cell">Ngày tạo</th>
                  <th className="table-cell">Đổi role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = u._id === currentUser?._id;
                  return (
                    <tr key={u._id} className="table-row">
                      <td className="table-cell font-medium text-heading">
                        {u.name}
                        {isSelf && <span className="ml-2 text-xs text-primary">(Bạn)</span>}
                      </td>
                      <td className="table-cell">{u.email}</td>
                      <td className="table-cell"><RoleBadge role={u.role} /></td>
                      <td className="table-cell">
                        <span className={u.isActive ? 'text-success' : 'text-danger'}>
                          {u.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      <td className="table-cell">{formatDate(u.createdAt)}</td>
                      <td className="table-cell">
                        {isSelf ? (
                          <span className="text-xs text-muted">Không thể đổi role của mình</span>
                        ) : (
                          <select value={u.role} disabled={updatingId === u._id}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)} className="input-field py-1.5">
                            {ROLE_OPTIONS.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="py-10 text-center text-muted">Không tìm thấy user</p>}
          </div>
        </AdvanceCard>
      )}
    </div>
  );
}
