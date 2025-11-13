import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

const mockLoans = [
  { id: 1, borrower: 'John Doe', amount: 5000, status: 'Approved', date: '2024-10-01' },
  { id: 2, borrower: 'Jane Smith', amount: 3000, status: 'Pending', date: '2024-09-15' },
  { id: 3, borrower: 'Alice Brown', amount: 7000, status: 'Rejected', date: '2024-08-20' },
];

const Loans = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loans, setLoans] = useState([]);
  const [totalAmount, setTotalAmount] = useState(null);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ borrower: '', amount: '', status: 'Pending', date: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const filteredLoans = loans.filter(l =>
    (l.username || l.borrower || '').toString().toLowerCase().includes(search.toLowerCase()) ||
    (l.phone_number || '').toString().includes(search) ||
    (l.amount || '').toString().includes(search) ||
    (l.issued_date || '').toString().toLowerCase().includes(search.toLowerCase())
  );
  const paginatedLoans = filteredLoans.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const pageCount = Math.max(1, Math.ceil(filteredLoans.length / rowsPerPage));

  const openAddModal = () => { setEditId(null); setFormData({ borrower: '', amount: '', status: 'Pending', date: '' }); setIsModalOpen(true); };
  const openEditModal = (id) => { const l = loans.find(x => x.id === id); setEditId(id); setFormData({ borrower: l.borrower, amount: l.amount, status: l.status, date: l.date }); setIsModalOpen(true); setOpenDropdownId(null); };
  const handleSave = () => {
    if (editId) setLoans(loans.map(l => l.id === editId ? { ...l, ...formData } : l));
    else setLoans([...loans, { ...formData, id: Date.now() }]);
    setIsModalOpen(false); setFormData({ borrower: '', amount: '', status: 'Pending', date: '' }); setEditId(null);
  };
  const handleDelete = (id) => { 
    const loan = loans.find(l => l.id === id);
    setDeleteId(id);
    setIsDeleteModalOpen(true);
    setOpenDropdownId(null);
    // optionally store name for modal
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`https://saving-api.mababa.app/api/loan/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const body = await res.json().catch(() => ({}));
      const successMsg = (body && body.message) ? body.message : 'Loan deleted';
      toast.addToast(successMsg, { type: 'success' });
      setLoans(prev => prev.filter(l => l.id !== deleteId));
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (err) {
      toast.addToast(err.message || 'Failed to delete loan', { type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatNumber = (n) => n == null ? '' : Number(n).toLocaleString();

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const fetchLoans = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('https://saving-api.mababa.app/api/loans', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (aborted) return;
        setTotalAmount(body.total_amount);
        setTotalCount(body.total_loan);
        const transformed = (body.loans || []).map(x => ({
          id: x.id,
          user_id: x.user_id,
          username: x.username,
          phone_number: x.phone_number,
          amount: x.amount,
          issued_date: x.issued_date,
          deadline: x.deadline,
          created_at: x.created_at,
          updated_at: x.updated_at
        }));
        setLoans(transformed);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load loans');
        setLoans(mockLoans.map(m => ({ id: m.id, username: m.borrower, phone_number: '', amount: m.amount, issued_date: m.date, deadline: '', created_at: m.date, status: m.status })));
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    fetchLoans();
    return () => { aborted = true; controller.abort(); };
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Loans</h2>
        <div className="flex items-center space-x-3">
          <input type="text" placeholder="Search loans..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="border px-3 py-2 rounded-lg w-64" />
          <label className="text-sm text-gray-600">Show</label>
          <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="border px-2 py-2 rounded">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <button onClick={openAddModal} className="bg-green-500 text-white px-4 py-2 rounded-lg">Add Loan</button>
        </div>
      </div>

      {loading && (
        <div className="mb-4 text-sm text-gray-600 flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
          <div>Loading loans...</div>
        </div>
      )}

      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left border-b">User</th>
              <th className="py-3 px-4 text-left border-b">Phone</th>
              <th className="py-3 px-4 text-left border-b">Amount</th>
              <th className="py-3 px-4 text-left border-b">Issued</th>
              <th className="py-3 px-4 text-left border-b">Deadline</th>
              <th className="py-3 px-4 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLoans.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{l.username}</td>
                <td className="py-3 px-4 border-b">{l.phone_number}</td>
                <td className="py-3 px-4 border-b">{formatNumber(l.amount)}</td>
                <td className="py-3 px-4 border-b">{l.issued_date ? new Date(l.issued_date).toLocaleString() : ''}</td>
                <td className="py-3 px-4 border-b">{l.deadline ? new Date(l.deadline).toLocaleString() : ''}</td>
                <td className="py-3 px-4 border-b relative" ref={openDropdownId === l.id ? dropdownRef : null}>
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === l.id ? null : l.id); }} className="p-2 rounded hover:bg-gray-100">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </button>
                  {openDropdownId === l.id && (
                    <div className="absolute right-2 top-10 w-48 bg-white border rounded-md shadow-md z-20" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditModal(l.id)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Edit</button>
                      {/* navigate to /dashboard/payment/:id with user query param */}
                      <button onClick={() => navigate(`/dashboard/payment/${l.id}?user=${l.user_id || ''}`)} className="w-full text-left px-4 py-2 hover:bg-gray-50">View payments</button>
                      <button onClick={() => handleDelete(l.id)} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedLoans.length === 0 && (<tr><td colSpan={5} className="py-6 text-center text-gray-500">No loans found</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredLoans.length)} of {filteredLoans.length}</div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span>Page {page} of {pageCount}</span>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editId ? 'Edit Loan' : 'Add Loan'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input type="text" placeholder="Borrower" value={formData.borrower} onChange={e => setFormData({ ...formData, borrower: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="border px-3 py-2 rounded" />
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="border px-3 py-2 rounded">
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Confirm delete</h3>
            </div>
            <div className="text-sm text-gray-700 mb-4">Are you sure you want to delete this loan and its associated payments? This action cannot be undone.</div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteId(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded flex items-center">
                {deleteLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
