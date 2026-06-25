import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Họ tên', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'password', label: 'Mật khẩu', type: 'password', required: true },
    { key: 'confirmPassword', label: 'Xác nhận mật khẩu', type: 'password', required: true },
  ];

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Đăng ký để bắt đầu sử dụng">
      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, label, type, required }) => (
          <div key={key}>
            <label className="input-label">{label}</label>
            <input
              type={type}
              required={required}
              minLength={type === 'password' ? 6 : undefined}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="input-field"
            />
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Đã có tài khoản?{' '}
        <Link to="/login" className="link-primary font-medium">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
