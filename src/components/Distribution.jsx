import { useState, useEffect, useMemo } from 'react';

const Distribution = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  
  // Pay using saving data
  const [payUsingSavingData, setPayUsingSavingData] = useState([]);
  const [payUsingSavingSearch, setPayUsingSavingSearch] = useState('');
  const [payUsingSavingPage, setPayUsingSavingPage] = useState(1);
  const [payUsingSavingRowsPerPage, setPayUsingSavingRowsPerPage] = useState(10);
  const [payUsingSavingLoading, setPayUsingSavingLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('distribution');

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setPayUsingSavingLoading(true);
      try {
        // Fetch distributions
        const res = await fetch('https://viva-api-366k.onrender.com/api/distributions', { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch distributions');
        const data = await res.json();
        if (aborted) return;
        // normalize
        const normalized = Array.isArray(data) ? data.map(d => ({
          id: d.id,
          user_id: d.user_id,
          name: d.full_name || d.name || '',
          amount: typeof d.amount === 'string' ? Number(d.amount) : d.amount,
          year: typeof d.year === 'string' ? Number(d.year) : d.year
        })) : [];
        setItems(normalized);
      } catch (err) {
        console.warn('Failed to load distributions, falling back to empty list', err);
        setItems([]);
      } finally {
        if (!aborted) setLoading(false);
      }

      try {
        // Fetch pay using saving data
        const payRes = await fetch('https://viva-api-366k.onrender.com/api/pay-loan-using-savings', { signal: controller.signal });
        if (!payRes.ok) throw new Error('Failed to fetch pay using saving data');
        const payData = await payRes.json();
        if (aborted) return;
        // normalize
        const normalizedPay = Array.isArray(payData) ? payData.map(p => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name || '',
          amount: typeof p.amount === 'string' ? Number(p.amount) : p.amount,
          description: p.description || '',
          created_at: p.created_at || ''
        })) : [];
        setPayUsingSavingData(normalizedPay);
      } catch (err) {
        console.warn('Failed to load pay using saving data, falling back to empty list', err);
        setPayUsingSavingData([]);
      } finally {
        if (!aborted) setPayUsingSavingLoading(false);
      }
    };

    fetchData();
    return () => { aborted = true; controller.abort(); };
  }, []);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setOpenDropdownId(null);
        setOpenPayUsingSavingDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // compute unique years and grouped rows
  const { years, rows } = useMemo(() => {
    const yearsSet = new Set();
    const groups = new Map();
    items.forEach(it => {
      yearsSet.add(it.year);
      const key = it.user_id || it.name;
      if (!groups.has(key)) groups.set(key, { id: key, name: it.name, totals: {}, records: [] });
      const g = groups.get(key);
      g.totals[it.year] = (g.totals[it.year] || 0) + (Number(it.amount) || 0);
      g.records.push(it);
    });

    const yearsArr = Array.from(yearsSet).sort((a, b) => a - b);
    return { years: yearsArr, rows: Array.from(groups.values()) };
  }, [items]);

  // filtering by name or amount
  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    if (r.name.toLowerCase().includes(q)) return true;
    // check amounts
    return years.some(y => String(r.totals[y] || '').includes(q));
  });

  // Totals per year for the (filtered) distribution rows
  const distributionTotals = useMemo(() => {
    const totals = {};
    years.forEach(y => {
      totals[y] = filtered.reduce((s, r) => s + (Number(r.totals[y] || 0)), 0);
    });
    return totals;
  }, [filtered, years]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Pay using saving filtering and pagination
  const payUsingSavingFiltered = payUsingSavingData.filter(p => {
    const q = payUsingSavingSearch.trim().toLowerCase();
    if (!q) return true;
    return p.full_name.toLowerCase().includes(q) || 
           String(p.amount || '').includes(q) || 
           p.description.toLowerCase().includes(q);
  });

  const payUsingSavingPageCount = Math.max(1, Math.ceil(payUsingSavingFiltered.length / payUsingSavingRowsPerPage));
  const payUsingSavingPaged = payUsingSavingFiltered.slice((payUsingSavingPage - 1) * payUsingSavingRowsPerPage, payUsingSavingPage * payUsingSavingRowsPerPage);

  const payUsingSavingTotal = useMemo(() => payUsingSavingFiltered.reduce((s, r) => s + (Number(r.amount || 0)), 0), [payUsingSavingFiltered]);

  const fmt = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);

  // Manage modal state for individual user distributions
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageUser, setManageUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  // Pay using saving edit/delete modal states
  const [showPayUsingSavingEditModal, setShowPayUsingSavingEditModal] = useState(false);
  const [editPayUsingSavingRecord, setEditPayUsingSavingRecord] = useState(null);
  const [editPayUsingSavingAmount, setEditPayUsingSavingAmount] = useState('');
  const [editPayUsingSavingDescription, setEditPayUsingSavingDescription] = useState('');
  const [editPayUsingSavingLoading, setEditPayUsingSavingLoading] = useState(false);
  const [deletePayUsingSavingLoadingId, setDeletePayUsingSavingLoadingId] = useState(null);

  // Dropdown states
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openPayUsingSavingDropdownId, setOpenPayUsingSavingDropdownId] = useState(null);

  const openManage = (row) => {
    setManageUser(row);
    setShowManageModal(true);
  };

  const openEdit = (record) => {
    setEditRecord(record);
    setEditAmount(String(record.amount || ''));
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!editRecord) return;
    const amount = Number(editAmount);
    if (!amount || amount < 0) return;
    setEditLoading(true);
    try {
      const res = await fetch(`https://viva-api-366k.onrender.com/api/distribution/${editRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, created_at: new Date().toISOString() })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && (body.detail || body.message)) || `Failed: ${res.status}`);

      // update items state replacing the record
      setItems(prev => prev.map(it => it.id === editRecord.id ? ({ ...it, amount: Number(body.amount || amount), year: body.year || it.year }) : it));
      setShowEditModal(false);
      setEditRecord(null);
      setEditAmount('');
      setManageUser(prev => ({ ...prev, totals: { ...prev.totals, [body.year || editRecord.year]: (prev.totals[body.year || editRecord.year] || 0) - editRecord.amount + (body.amount || amount) } }));
    } catch (err) {
      console.error(err);
      try { window.toast && window.toast('Failed to update distribution'); } catch (e) {}
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async (recordId) => {
    if (!recordId) return;
    setDeleteLoadingId(recordId);
    try {
      const res = await fetch(`https://viva-api-366k.onrender.com/api/distribution/${recordId}`, { method: 'DELETE', headers: { 'accept': 'application/json' } });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && body.message) || `Failed: ${res.status}`);

      // remove from items
      setItems(prev => prev.filter(it => it.id !== recordId));
      // also update manageUser totals if open
      if (manageUser) {
        setManageUser(prev => {
          const newTotals = { ...prev.totals };
          const rec = prev.records.find(r => r.id === recordId);
          if (rec) newTotals[rec.year] = Math.max(0, (newTotals[rec.year] || 0) - rec.amount);
          return { ...prev, totals: newTotals, records: prev.records.filter(r => r.id !== recordId) };
        });
      }
    } catch (err) {
      console.error(err);
      try { window.toast && window.toast('Failed to delete distribution'); } catch (e) {}
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Pay using saving edit/delete functions
  const openPayUsingSavingEdit = (record) => {
    setEditPayUsingSavingRecord(record);
    setEditPayUsingSavingAmount(String(record.amount || ''));
    setEditPayUsingSavingDescription(record.description || '');
    setShowPayUsingSavingEditModal(true);
  };

  const confirmPayUsingSavingEdit = async () => {
    if (!editPayUsingSavingRecord) return;
    const amount = Number(editPayUsingSavingAmount);
    if (!amount || amount < 0) return;
    setEditPayUsingSavingLoading(true);
    try {
      const res = await fetch(`https://viva-api-366k.onrender.com/api/pay-loan-using-saving/${editPayUsingSavingRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          description: editPayUsingSavingDescription,
          created_at: new Date().toISOString() 
        })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && (body.detail || body.message)) || `Failed: ${res.status}`);

      // update payUsingSavingData state
      setPayUsingSavingData(prev => prev.map(it => it.id === editPayUsingSavingRecord.id ? ({
        ...it, 
        amount: Number(body.amount || amount),
        description: body.description || editPayUsingSavingDescription
      }) : it));
      
      setShowPayUsingSavingEditModal(false);
      setEditPayUsingSavingRecord(null);
      setEditPayUsingSavingAmount('');
      setEditPayUsingSavingDescription('');
      try { window.toast && window.toast('Payment updated successfully'); } catch (e) {}
    } catch (err) {
      console.error(err);
      try { window.toast && window.toast('Failed to update payment'); } catch (e) {}
    } finally {
      setEditPayUsingSavingLoading(false);
    }
  };

  const confirmPayUsingSavingDelete = async (recordId) => {
    if (!recordId) return;
    setDeletePayUsingSavingLoadingId(recordId);
    try {
      const res = await fetch(`https://viva-api-366k.onrender.com/api/pay-loan-using-saving/${recordId}`, { 
        method: 'DELETE', 
        headers: { 'accept': 'application/json' } 
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && body.message) || `Failed: ${res.status}`);

      // remove from payUsingSavingData
      setPayUsingSavingData(prev => prev.filter(it => it.id !== recordId));
      try { window.toast && window.toast('Payment deleted successfully'); } catch (e) {}
    } catch (err) {
      console.error(err);
      try { window.toast && window.toast('Failed to delete payment'); } catch (e) {}
    } finally {
      setDeletePayUsingSavingLoadingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Distribution Management</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'distribution'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Distribution
          </button>
          <button
            onClick={() => setActiveTab('payUsingSaving')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payUsingSaving'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pay Using Saving
          </button>
        </nav>
      </div>

      {/* Distribution Tab Content */}
      {activeTab === 'distribution' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search name or amount..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="border px-3 py-2 rounded-lg w-64"
              />
              <label className="text-sm text-gray-600">Show</label>
              <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="border px-2 py-2 rounded">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
                <div className="mt-3 text-gray-600">Loading distribution...</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border rounded-lg">
              <table className="min-w-full table-very-small">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left border-b">Name</th>
                    {years.map(y => (
                      <th key={y} className="py-3 px-4 text-right border-b">{y}</th>
                    ))}
                    <th className="py-3 px-4 text-right border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">{row.name}</td>
                      {years.map(y => (
                        <td key={y} className="py-3 px-4 border-b text-right">{(row.totals[y] || 0) ? fmt(row.totals[y]) : '—'}</td>
                      ))}
                      <td className="py-3 px-4 border-b text-right">
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === row.id ? null : row.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {openDropdownId === row.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border">
                              <button
                                onClick={() => {
                                  openManage(row);
                                  setOpenDropdownId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Manage
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={years.length + 2} className="py-6 text-center text-gray-500">No records found</td>
                    </tr>
                  )}

                  {filtered.length > 0 && (
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4 border-t">Total</td>
                      {years.map(y => (
                        <td key={y} className="py-3 px-4 border-t text-right">{fmt(distributionTotals[y] || 0)}</td>
                      ))}
                      <td className="py-3 px-4 border-t text-right">&nbsp;</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}</div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <span>Page {page} of {pageCount}</span>
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Using Saving Tab Content */}
      {activeTab === 'payUsingSaving' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search name, amount or description..."
                value={payUsingSavingSearch}
                onChange={e => { setPayUsingSavingSearch(e.target.value); setPayUsingSavingPage(1); }}
                className="border px-3 py-2 rounded-lg w-80"
              />
              <label className="text-sm text-gray-600">Show</label>
              <select value={payUsingSavingRowsPerPage} onChange={e => { setPayUsingSavingRowsPerPage(Number(e.target.value)); setPayUsingSavingPage(1); }} className="border px-2 py-2 rounded">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {payUsingSavingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
                <div className="mt-3 text-gray-600">Loading pay using saving records...</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border rounded-lg">
              <table className="min-w-full table-very-small">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left border-b">Name</th>
                    <th className="py-3 px-4 text-right border-b">Amount</th>
                    <th className="py-3 px-4 text-left border-b">Description</th>
                    <th className="py-3 px-4 text-left border-b">Date</th>
                    <th className="py-3 px-4 text-right border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payUsingSavingPaged.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">{record.full_name}</td>
                      <td className="py-3 px-4 border-b text-right font-medium">{fmt(record.amount)}</td>
                      <td className="py-3 px-4 border-b">{record.description}</td>
                      <td className="py-3 px-4 border-b">{new Date(record.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 border-b text-right">
                        <div className="relative">
                          <button
                            onClick={() => setOpenPayUsingSavingDropdownId(openPayUsingSavingDropdownId === record.id ? null : record.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            disabled={deletePayUsingSavingLoadingId === record.id}
                          >
                            {deletePayUsingSavingLoadingId === record.id ? (
                              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                            ) : (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            )}
                          </button>
                          {openPayUsingSavingDropdownId === record.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border">
                              <button
                                onClick={() => {
                                  openPayUsingSavingEdit(record);
                                  setOpenPayUsingSavingDropdownId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  confirmPayUsingSavingDelete(record.id);
                                  setOpenPayUsingSavingDropdownId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {payUsingSavingPaged.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">No pay using saving records found</td>
                    </tr>
                  )}

                  {payUsingSavingFiltered.length > 0 && (
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4 border-t">Total</td>
                      <td className="py-3 px-4 border-t text-right">{fmt(payUsingSavingTotal)}</td>
                      <td className="py-3 px-4 border-t">&nbsp;</td>
                      <td className="py-3 px-4 border-t">&nbsp;</td>
                      <td className="py-3 px-4 border-t text-right">&nbsp;</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {(payUsingSavingPage - 1) * payUsingSavingRowsPerPage + 1} - {Math.min(payUsingSavingPage * payUsingSavingRowsPerPage, payUsingSavingFiltered.length)} of {payUsingSavingFiltered.length}
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPayUsingSavingPage(p => Math.max(1, p - 1))} 
                disabled={payUsingSavingPage === 1} 
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span>Page {payUsingSavingPage} of {payUsingSavingPageCount}</span>
              <button 
                onClick={() => setPayUsingSavingPage(p => Math.min(payUsingSavingPageCount, p + 1))} 
                disabled={payUsingSavingPage === payUsingSavingPageCount} 
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage modal - shows individual records for a user */}
      {showManageModal && manageUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manage Distributions - {manageUser.name}</h3>
              <button onClick={() => setShowManageModal(false)} className="text-gray-500">Close</button>
            </div>
            <div className="overflow-y-auto max-h-80">
              <table className="min-w-full table-very-small">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left border-b">Year</th>
                    <th className="py-2 px-3 text-right border-b">Amount</th>
                    <th className="py-2 px-3 text-right border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manageUser.records.map(rec => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 border-b">{rec.year}</td>
                      <td className="py-2 px-3 border-b text-right">{fmt(rec.amount)}</td>
                      <td className="py-2 px-3 border-b text-right space-x-2">
                        <button onClick={() => openEdit(rec)} className="px-2 py-1 bg-yellow-100 rounded text-sm">Edit</button>
                        <button onClick={() => confirmDelete(rec.id)} disabled={deleteLoadingId === rec.id} className="px-2 py-1 bg-red-100 rounded text-sm">
                          {deleteLoadingId === rec.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal for a specific distribution record */}
      {showEditModal && editRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Edit Distribution</h3>
              <p className="text-sm text-gray-600 mt-2">User: <strong>{editRecord.full_name || editRecord.name || ''}</strong></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-full border px-3 py-2 rounded-lg" />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setShowEditModal(false); setEditRecord(null); setEditAmount(''); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={confirmEdit} disabled={editLoading} className="px-4 py-2 bg-yellow-600 text-white rounded">
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal for pay using saving record */}
      {showPayUsingSavingEditModal && editPayUsingSavingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Edit Pay Using Saving</h3>
              <p className="text-sm text-gray-600 mt-2">User: <strong>{editPayUsingSavingRecord.full_name}</strong></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input 
                type="number" 
                value={editPayUsingSavingAmount} 
                onChange={e => setEditPayUsingSavingAmount(e.target.value)} 
                className="w-full border px-3 py-2 rounded-lg" 
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                value={editPayUsingSavingDescription} 
                onChange={e => setEditPayUsingSavingDescription(e.target.value)} 
                className="w-full border px-3 py-2 rounded-lg h-24 resize-none" 
                placeholder="Enter description..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => { 
                  setShowPayUsingSavingEditModal(false); 
                  setEditPayUsingSavingRecord(null); 
                  setEditPayUsingSavingAmount(''); 
                  setEditPayUsingSavingDescription('');
                }} 
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmPayUsingSavingEdit} 
                disabled={editPayUsingSavingLoading} 
                className="px-4 py-2 bg-yellow-600 text-white rounded"
              >
                {editPayUsingSavingLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Distribution;
