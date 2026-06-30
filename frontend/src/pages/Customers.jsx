import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import PageHeader from '../components/ui/PageHeader';
import AdvanceCard from '../components/ui/AdvanceCard';

const emptyForm = { name: '', email: '', phone: '', company: '', address: '', taxCode: '' };

export default function Customers() {
  const { isStaff, isManager } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCustomers = () => {
    setLoading(true);
    api.get('/customers', { params: { search } }).then((res) => setCustomers(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || '',
      taxCode: customer.taxCode || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/customers/${editing._id}`, form);
    else await api.post('/customers', form);
    setModalOpen(false);
    fetchCustomers();
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa khách hàng này?')) return;
    await api.delete(`/customers/${id}`);
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khách hàng"
        subtitle="Quản lý thông tin khách hàng"
        action={isStaff && (
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus size={18} />
            Thêm khách hàng
          </button>
        )}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          type="text"
          placeholder="Tìm theo tên, email, công ty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdvanceCard title="Danh sách khách hàng" subtitle={`${customers.length} khách hàng`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Tên</th>
                  <th className="table-cell">Email</th>
                  <th className="table-cell">Điện thoại</th>
                  <th className="table-cell">Công ty</th>
                  <th className="table-cell">Mã số thuế</th>
                  {isStaff && <th className="table-cell">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} className="table-row">
                    <td className="table-cell font-medium">
                      <Link to={`/customers/${c._id}`} className="link-primary">{c.name}</Link>
                    </td>
                    <td className="table-cell">{c.email}</td>
                    <td className="table-cell">{c.phone || '-'}</td>
                    <td className="table-cell">{c.company || '-'}</td>
                    <td className="table-cell">{c.taxCode || '-'}</td>
                    {isStaff && (
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => openEdit(c)} className="text-primary hover:text-primary-dark">
                            <Pencil size={16} />
                          </button>
                          {isManager && (
                            <button type="button" onClick={() => handleDelete(c._id)} className="text-danger hover:opacity-80">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && <p className="py-10 text-center text-muted">Chưa có khách hàng</p>}
          </div>
        </AdvanceCard>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Sửa khách hàng' : 'Thêm khách hàng'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'Tên', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'phone', label: 'Điện thoại' },
            { key: 'company', label: 'Công ty' },
            { key: 'address', label: 'Địa chỉ' },
            { key: 'taxCode', label: 'Mã số thuế' },
          ].map(({ key, label, type, required }) => (
            <div key={key}>
              <label className="input-label">{label}</label>
              <input
                type={type || 'text'}
                required={required}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input-field"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Hủy</button>
            <button type="submit" className="btn-primary">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
