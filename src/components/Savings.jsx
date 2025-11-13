import { useState, useRef, useEffect } from 'react';
import { useToast } from './Toast';

const mockSavings = [
  { id: 1, user: 'John Doe', goal: 'Emergency Fund', amount: 8500, target: 10000, date: '2024-10-01', status: 'Active' },
  { id: 2, user: 'Jane Smith', goal: 'Vacation Fund', amount: 2300, target: 5000, date: '2024-09-15', status: 'Active' },
  { id: 3, user: 'Alice Brown', goal: 'New Car', amount: 15000, target: 25000, date: '2024-08-20', status: 'Completed' },
];

const Savings = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [savings, setSavings] = useState([]);
  const [totalAmount, setTotalAmount] = useState(null);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ user: '', amount: '', date: '', status: 'Active' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const formatNumber = (n) => {
    if (n == null) return '';
    return Number(n).toLocaleString();
  };

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const filteredSavings = savings.filter(s =>
    (s.username || s.user || '').toString().toLowerCase().includes(search.toLowerCase()) ||
    (s.phone_number || '').toString().includes(search) ||
    (s.amount || '').toString().includes(search) ||
    (s.created_at || '').toString().toLowerCase().includes(search.toLowerCase())
  );
  const paginatedSavings = filteredSavings.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const pageCount = Math.max(1, Math.ceil(filteredSavings.length / rowsPerPage));

  const openAddModal = () => {
    setEditId(null);
    setFormData({ user: '', amount: '', date: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const openEditModal = (id) => {
    const s = savings.find(x => x.id === id);
    setEditId(id);
    // Allow editing amount and created_at (show datetime-local friendly value)
    const toLocalInput = (iso) => iso ? new Date(iso).toISOString().slice(0,16) : '';
    setFormData({ amount: s.amount, date: toLocalInput(s.created_at || s.date) });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSave = async () => {
    // If editing a server-side saving (id looks UUID-ish), call PUT /api/saving/{id}
    const isServerItem = editId && typeof editId === 'string' && !editId.startsWith('local-');
    const amountValue = Number(formData.amount) || 0;
    if (isServerItem) {
      try {
        setSaveLoading(true);
        const nowIso = new Date().toISOString();
        const createdAtToSend = formData.date ? new Date(formData.date).toISOString() : nowIso;
        // send amount and created_at (as provided or now)
        const res = await fetch(`https://saving-api.mababa.app/api/saving/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amountValue, created_at: createdAtToSend })
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = (body && (body.detail || body.message)) || `Update failed: ${res.status}`;
          throw new Error(msg);
        }
        // update local UI with returned item if provided, otherwise apply optimistic update
        if (body && body.id) {
          setSavings(prev => prev.map(s => s.id === editId ? { ...s, amount: body.amount ?? amountValue, username: body.username ?? s.username, phone_number: body.phone_number ?? s.phone_number, created_at: body.created_at ?? s.created_at } : s));
        } else {
          setSavings(prev => prev.map(s => s.id === editId ? { ...s, amount: amountValue, created_at: createdAtToSend } : s));
        }
        toast.addToast((body && body.message) ? body.message : 'Saving updated', { type: 'success' });
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ user: '', amount: '', date: '', status: 'Active' });
      } catch (err) {
        console.error(err);
        toast.addToast(err.message || 'Failed to update saving', { type: 'error' });
      } finally {
        setSaveLoading(false);
      }
      return;
    }

    // fallback/local save/add
    if (editId) {
      // Local fallback for editing: update amount and (optionally) created_at if provided
      const updatedDate = formData.date ? new Date(formData.date).toISOString() : null;
      setSavings(savings.map(s => s.id === editId ? { ...s, amount: amountValue, created_at: updatedDate || s.created_at } : s));
    } else {
      const newItem = {
        id: Date.now().toString(),
        user_id: null,
        username: formData.user,
        phone_number: '',
        amount: amountValue,
        created_at: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
      };
      setSavings([newItem, ...savings]);
    }
    setIsModalOpen(false);
    setFormData({ user: '', amount: '', date: '', status: 'Active' });
    setEditId(null);
  };

  const handleDelete = (id) => {
    // open confirmation modal
    setOpenDropdownId(null);
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    if (!id) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`https://saving-api.mababa.app/api/saving/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed: ${res.status} ${txt}`);
      }
      const body = await res.json().catch(() => null);
      // remove from UI
      setSavings(prev => prev.filter(s => s.id !== id));
      const msg = (body && body.message) ? body.message : 'Saving deleted successfully';
      toast.addToast(msg, { type: 'success' });
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Failed to delete saving';
      toast.addToast(msg, { type: 'error' });
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  // fetch savings from API
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const fetchSavings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('https://saving-api.mababa.app/api/savings', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (aborted) return;
        // body: { total_amount, total_saving, savings: [...] }
        setTotalAmount(body.total_amount);
        setTotalCount(body.total_saving);
        const transformed = (body.savings || []).map(s => ({
          id: s.id,
          user_id: s.user_id,
          username: s.username,
          phone_number: s.phone_number,
          amount: s.amount,
          created_at: s.created_at
        }));
        setSavings(transformed);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load savings');
        // map legacy mock to current shape
        setSavings(mockSavings.map(m => ({
          id: m.id,
          username: m.user,
          phone_number: '',
          amount: m.amount,
          created_at: m.date
        })));
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    fetchSavings();
    return () => { aborted = true; controller.abort(); };
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Savings</h2>
          <div className="text-sm text-gray-600 mt-1">
            {totalCount != null && <span className="mr-4">Entries: {totalCount}</span>}
            {totalAmount != null && <span>Total: {formatNumber(totalAmount)}</span>}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <input type="text" placeholder="Search savings..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="border px-3 py-2 rounded-lg w-64" />
          <label className="text-sm text-gray-600">Show</label>
          <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="border px-2 py-2 rounded">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          {/* Add Goal removed - creation is not available from this view */}
        </div>
      </div>

      {loading && (
        <div className="mb-4 text-sm text-gray-600 flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
          <div>Loading savings...</div>
        </div>
      )}

      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left border-b">User</th>
              <th className="py-3 px-4 text-left border-b">Phone</th>
              <th className="py-3 px-4 text-left border-b">Amount</th>
              <th className="py-3 px-4 text-left border-b">Date</th>
              <th className="py-3 px-4 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSavings.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{s.username}</td>
                <td className="py-3 px-4 border-b">{s.phone_number}</td>
                <td className="py-3 px-4 border-b">{formatNumber(s.amount)}</td>
                <td className="py-3 px-4 border-b">{s.created_at ? new Date(s.created_at).toLocaleString() : ''}</td>
                <td className="py-3 px-4 border-b relative" ref={openDropdownId === s.id ? dropdownRef : null}>
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === s.id ? null : s.id); }} className="p-2 rounded hover:bg-gray-100">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </button>
                  {openDropdownId === s.id && (
                    <div className="absolute right-2 top-10 w-40 bg-white border rounded-md shadow-md z-20" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditModal(s.id)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedSavings.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-500">No savings found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredSavings.length)} of {filteredSavings.length}</div>
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
              <h3 className="text-lg font-semibold">{editId ? 'Edit Saving' : 'Add Saving'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="border px-3 py-2 rounded" />
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date</label>
                <input type="datetime-local" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="border px-3 py-2 rounded w-full" />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} disabled={saveLoading} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center space-x-2">
                {saveLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>}
                <span>{saveLoading ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Confirm delete</h3>
              <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this saving entry? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setShowDeleteModal(false); setDeleteTargetId(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-4 py-2 bg-red-600 text-white rounded flex items-center space-x-2">
                {deleteLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>}
                <span>{deleteLoading ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Savings;