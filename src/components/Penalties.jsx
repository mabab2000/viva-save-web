import { useState, useRef, useEffect } from 'react';

const Penalties = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [penalties, setPenalties] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPaid, setTotalPaid] = useState(null);
  const [totalUnpaid, setTotalUnpaid] = useState(null);

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
    ((p.user && p.user.toString().toLowerCase().includes(search.toLowerCase())) ||
    (p.user_id && p.user_id.toString().toLowerCase().includes(search.toLowerCase())) ||
    (p.reason && p.reason.toLowerCase().includes(search.toLowerCase())) ||
    (p.amount && p.amount.toString().includes(search)))
  );
  const paginatedPenalties = filteredPenalties.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const pageCount = Math.max(1, Math.ceil(filteredPenalties.length / rowsPerPage));

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('https://saving-api.mababa.app/api/penalties', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (aborted) return;
        setTotalPaid(body.total_paid ?? null);
        setTotalUnpaid(body.total_unpaid ?? null);
        const list = Array.isArray(body.penalties) ? body.penalties : [];

        // try to fetch users to resolve user_id -> username
        try {
          const ures = await fetch('https://saving-api.mababa.app/api/users');
          if (ures.ok) {
            const usersBody = await ures.json();
            const map = {};
            (usersBody || []).forEach(u => {
              map[u.id] = u.username || u.name || (u.email || '').split('@')[0];
            });
            setUserNames(map);
            setPenalties(list.map(p => ({
              id: p.id,
              user_id: p.user_id,
              user: p.username || map[p.user_id] || p.user || p.user_id,
              reason: p.reason,
              amount: p.amount,
              status: p.status,
              created_at: p.created_at,
              updated_at: p.updated_at
            })));
          } else {
            setPenalties(list.map(p => ({
              id: p.id,
              user_id: p.user_id,
              user: p.username || p.user || p.user_id,
              reason: p.reason,
              amount: p.amount,
              status: p.status,
              created_at: p.created_at,
              updated_at: p.updated_at
            })));
          }
        } catch (uErr) {
          // if users fetch fails, still set penalties using whatever username available
          setPenalties(list.map(p => ({
            id: p.id,
            user_id: p.user_id,
            user: p.username || p.user || p.user_id,
            reason: p.reason,
            amount: p.amount,
            status: p.status,
            created_at: p.created_at,
            updated_at: p.updated_at
          })));
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load penalties');
        setPenalties([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => { aborted = true; controller.abort(); };
  }, []);

  const handleDelete = (id) => {
    if (!confirm('Delete this penalty?')) return;
    // Optimistically remove locally — server-side delete not implemented here
    setPenalties(prev => prev.filter(p => p.id !== id));
    setOpenDropdownId(null);
  };

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
        </div>
      </div>

      {loading && (
        <div className="mb-4 text-sm text-gray-600 flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
          <div>Loading penalties...</div>
        </div>
      )}
      {error && <div className="mb-4 text-sm text-red-600">Error loading penalties: {error}</div>}

      {(totalPaid != null || totalUnpaid != null) && (
        <div className="mb-4 flex items-center space-x-6">
          <div className="text-sm text-gray-700">Total paid: <span className="font-semibold">{totalPaid != null ? Number(totalPaid).toLocaleString() : '—'}</span></div>
          <div className="text-sm text-gray-700">Total unpaid: <span className="font-semibold">{totalUnpaid != null ? Number(totalUnpaid).toLocaleString() : '—'}</span></div>
        </div>
      )}

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
                <td className="py-3 px-4 border-b">{p.user || p.user_id}</td>
                <td className="py-3 px-4 border-b">{p.reason}</td>
                <td className="py-3 px-4 border-b">{p.amount}</td>
                <td className="py-3 px-4 border-b">{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</td>
                <td className="py-3 px-4 border-b">{p.status}</td>
                <td className="py-3 px-4 border-b relative" ref={openDropdownId === p.id ? dropdownRef : null}>
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === p.id ? null : p.id); }} className="p-2 rounded hover:bg-gray-100">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </button>
                  {openDropdownId === p.id && (
                    <div className="absolute right-2 top-10 w-40 bg-white border rounded-md shadow-md z-20" onClick={(e) => e.stopPropagation()}>
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

      {/* add/edit modal removed - penalties page is now read-only except delete */}
    </div>
  );
};

export default Penalties;
