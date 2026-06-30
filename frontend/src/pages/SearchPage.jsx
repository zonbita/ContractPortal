import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/ui/PageHeader';
import AdvanceCard from '../components/ui/AdvanceCard';
import StatusBadge from '../components/StatusBadge';
import { DOCUMENT_TYPES, getDocumentDetailPath } from '../utils/constants';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || '';

  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState(initialType);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (query, docType) => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/documents/search', {
        params: { q: query.trim(), type: docType || undefined },
      });
      setResults(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQ.trim()) {
      runSearch(initialQ, initialType);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    const params = { q: q.trim() };
    if (type) params.type = type;
    setSearchParams(params);
    await runSearch(q, type);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tìm kiếm tài liệu" subtitle="Tìm theo số, tiêu đề, OCR, tags" />

      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm..."
            className="input-field pl-10"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input-field sm:w-48">
          <option value="">Tất cả loại</option>
          {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary">Tìm kiếm</button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : searched && (
        <AdvanceCard title="Kết quả" subtitle={`${results.length} tài liệu`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Loại</th>
                  <th className="table-cell">Số</th>
                  <th className="table-cell">Tiêu đề</th>
                  <th className="table-cell">Khách hàng</th>
                  <th className="table-cell">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {results.map((doc) => (
                  <tr key={doc._id} className="table-row">
                    <td className="table-cell">{DOCUMENT_TYPES[doc.type]}</td>
                    <td className="table-cell">
                      <Link to={getDocumentDetailPath(doc)} className="link-primary font-medium">
                        {doc.documentNumber}
                      </Link>
                    </td>
                    <td className="table-cell">{doc.title}</td>
                    <td className="table-cell">{doc.customer?.name || '-'}</td>
                    <td className="table-cell"><StatusBadge status={doc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length === 0 && (
              <p className="py-10 text-center text-muted">Không tìm thấy kết quả</p>
            )}
          </div>
        </AdvanceCard>
      )}
    </div>
  );
}
