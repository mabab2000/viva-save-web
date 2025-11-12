import { useState, useRef, useEffect } from 'react';

const mockPenalties = [
  { id: 1, user: 'John Doe', reason: 'Late Payment', amount: 50, date: '2024-10-05', status: 'Unpaid' },
  { id: 2, user: 'Jane Smith', reason: 'Missed Goal', amount: 30, date: '2024-09-25', status: 'Paid' },
  { id: 3, user: 'Alice Brown', reason: 'Overdraft', amount: 100, date: '2024-08-30', status: 'Unpaid' },
];

const Penalties = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [penalties, setPenalties] = useState(mockPenalties);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ user: '', reason: '', amount: '', date: '', status: 'Unpaid' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const filteredPenalties = penalties.filter(p =>
    p.user.toLowerCase().includes(search.toLowerCase()) ||
    p.reason.toLowerCase().includes(search.toLowerCase()) ||
    p.amount.toString().includes(search)
  );
  const paginatedPenalties = filteredPenalties.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const pageCount = Math.max(1, Math.ceil(filteredPenalties.length / rowsPerPage));

  const openAddModal = () => { setEditId(null); setFormData({ user: '', reason: '', amount: '', date: '', status: 'Unpaid' }); setIsModalOpen(true); };
  const openEditModal = (id) => { const p = penalties.find(x => x.id === id); setEditId(id); setFormData({ user: p.user, reason: p.reason, amount: p.amount, date: p.date, status: p.status }); setIsModalOpen(true); setOpenDropdownId(null); };
  const handleSave = () => {
    if (editId) setPenalties(penalties.map(p => p.id === editId ? { ...p, ...formData } : p));
    else setPenalties([...penalties, { ...formData, id: Date.now() }]);
    setIsModalOpen(false); setFormData({ user: '', reason: '', amount: '', date: '', status: 'Unpaid' }); setEditId(null);
  };
  const handleDelete = (id) => { if (!confirm('Delete this penalty?')) return; setPenalties(penalties.filter(p => p.id !== id)); setOpenDropdownId(null); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Penalties</h2>
        <div className="flex items-center space-x-3">
          <input type="text" placeholder="Search penalties..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="border px-3 py-2 rounded-lg w-64" />
          <label className="text-sm text-gray-600">Show</label>
          <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="border px-2 py-2 rounded">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <button onClick={openAddModal} className="bg-green-500 text-white px-4 py-2 rounded-lg">Add Penalty</button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left border-b">User</th>
              <th className="py-3 px-4 text-left border-b">Reason</th>
              <th className="py-3 px-4 text-left border-b">Amount</th>
              <th className="py-3 px-4 text-left border-b">Date</th>
              <th className="py-3 px-4 text-left border-b">Status</th>
              <th className="py-3 px-4 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPenalties.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{p.user}</td>
                <td className="py-3 px-4 border-b">{p.reason}</td>
                <td className="py-3 px-4 border-b">{p.amount}</td>
                <td className="py-3 px-4 border-b">{p.date}</td>
                <td className="py-3 px-4 border-b">{p.status}</td>
                <td className="py-3 px-4 border-b relative" ref={openDropdownId === p.id ? dropdownRef : null}>
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === p.id ? null : p.id); }} className="p-2 rounded hover:bg-gray-100">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </button>
                  {openDropdownId === p.id && (
                    <div className="absolute right-2 top-10 w-40 bg-white border rounded-md shadow-md z-20" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditModal(p.id)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedPenalties.length === 0 && (<tr><td colSpan={6} className="py-6 text-center text-gray-500">No penalties found</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredPenalties.length)} of {filteredPenalties.length}</div>
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
              <h3 className="text-lg font-semibold">{editId ? 'Edit Penalty' : 'Add Penalty'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input type="text" placeholder="User" value={formData.user} onChange={e => setFormData({ ...formData, user: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="text" placeholder="Reason" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="border px-3 py-2 rounded" />
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="border px-3 py-2 rounded" />
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="border px-3 py-2 rounded">
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Penalties;
