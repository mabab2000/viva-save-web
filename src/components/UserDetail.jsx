import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PageSizeOptions = [10,25,50];

const SimpleTable = ({columns, rows}) => {
  return (
    <div className="overflow-x-auto bg-white border rounded-lg">
      <table className="min-w-full table-very-small">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`py-3 px-4 text-left border-b ${col.align === 'right' ? 'text-right' : ''}`}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className={`py-3 px-4 border-b ${col.align === 'right' ? 'text-right' : ''}`}>{col.render ? col.render(r) : r[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const usePaged = (items, page, rowsPerPage) => {
  const filtered = items || [];
  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  return { filtered, paged, pageCount };
};

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('saving');

  const [savingData, setSavingData] = useState([]);
  const [savingTotalAmount, setSavingTotalAmount] = useState(0);
  const [savingCount, setSavingCount] = useState(0);
  const [loanData, setLoanData] = useState([]);
  const [payUsingSavingData, setPayUsingSavingData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);

  const [loading, setLoading] = useState(true);

  // search / pagination per tab
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Fetch only savings from API; keep other tabs mocked for design preview
    setLoading(true);
    let aborted = false;
    const controller = new AbortController();

    const mockLoans = [
      { id: 'l-1', description: 'Personal loan', amount: 20000, created_at: '2025-06-15' }
    ];
    const mockPay = [
      { id: 'p-1', description: 'Pay loan using saving', amount: 15575, created_at: '2026-01-21' }
    ];
    const mockDist = [
      { id: 'd-1', description: 'Yearly distribution', amount: 1000, created_at: '2025-12-31', year: 2025 }
    ];

    const fetchSavingsAndLoans = async () => {
      try {
        const [sRes, lRes] = await Promise.all([
          fetch(`https://saving-api.mababa.app/api/savings/${userId}`, { signal: controller.signal }),
          fetch(`https://saving-api.mababa.app/api/loans/${userId}`, { signal: controller.signal })
        ]);

        const sJson = sRes.ok ? await sRes.json() : null;
        const lJson = lRes.ok ? await lRes.json() : null;
        if (aborted) return;

        if (sJson && Array.isArray(sJson.savings)) {
          setSavingData(sJson.savings.map(s => ({
            id: s.id,
            user_id: s.user_id,
            amount: Number(s.amount || 0),
            username: s.username || '',
            phone_number: s.phone_number || '',
            created_at: s.created_at || s.createdAt || ''
          })));
          setSavingTotalAmount(Number(sJson.total_amount || 0));
          setSavingCount(Number(sJson.total_saving || sJson.savings.length));
        } else {
          setSavingData([]);
          setSavingTotalAmount(0);
          setSavingCount(0);
        }

        if (lJson && Array.isArray(lJson.loans)) {
          setLoanData(lJson.loans.map(l => ({
            id: l.id,
            user_id: l.user_id,
            amount: Number(l.amount || 0),
            description: l.reason || l.notes || `Loan ${l.id}`,
            issued_date: l.issued_date || l.created_at || l.createdAt || '',
            created_at: l.created_at || l.createdAt || '' ,
            status: l.status || ''
          })));
        } else {
          // fallback to design-only mock
          setLoanData(mockLoans);
        }

        // fetch pay-using-savings for this user
        try {
          const pRes = await fetch(`https://saving-api.mababa.app/api/pay-loan-using-savings/${userId}`, { signal: controller.signal });
          const pJson = pRes.ok ? await pRes.json() : null;
          if (pJson && Array.isArray(pJson)) {
            setPayUsingSavingData(pJson.map(p => ({
              id: p.id,
              user_id: p.user_id,
              full_name: p.full_name || '',
              amount: Number(p.amount || 0),
              description: p.description || '',
              created_at: p.created_at || ''
            })));
          } else {
            setPayUsingSavingData([]);
          }
        } catch (err) {
          console.error('Failed to fetch pay-using-savings', err);
          setPayUsingSavingData([]);
        }

        // fetch distributions for this user
        try {
          const dRes = await fetch(`https://saving-api.mababa.app/api/distributions/${userId}`, { signal: controller.signal });
          const dJson = dRes.ok ? await dRes.json() : null;
          if (dJson && Array.isArray(dJson)) {
            setDistributionData(dJson.map(d => ({
              id: d.id,
              user_id: d.user_id,
              full_name: d.full_name || '',
              amount: Number(d.amount || 0),
              year: d.year || '',
              created_at: d.created_at || ''
            })));
          } else {
            setDistributionData([]);
          }
        } catch (err) {
          console.error('Failed to fetch distributions', err);
          setDistributionData([]);
        }
      } catch (err) {
        console.error(err);
        setSavingData([]);
        setSavingTotalAmount(0);
        setSavingCount(0);
        setLoanData(mockLoans);
        setPayUsingSavingData(mockPay);
        setDistributionData(mockDist);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    fetchSavingsAndLoans();
    return () => { aborted = true; controller.abort(); };
  }, [userId]);

  // select items for active tab and apply search filter
  const items = useMemo(() => {
    let base = [];
    if (activeTab === 'saving') base = savingData;
    if (activeTab === 'loan') base = loanData;
    if (activeTab === 'payUsingSaving') base = payUsingSavingData;
    if (activeTab === 'distribution') base = distributionData;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(it => (it.description || '').toLowerCase().includes(q) || String(it.amount || '').includes(q) || (it.created_at || '').toLowerCase().includes(q));
  }, [activeTab, search, savingData, loanData, payUsingSavingData, distributionData]);

  const { filtered, paged, pageCount } = usePaged(items, page, rowsPerPage);

  const fmt = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);

  const columns = useMemo(() => {
    if (activeTab === 'saving') {
      return [
        { key: 'date', title: 'Date', render: r => new Date(r.created_at).toLocaleDateString() },
        { key: 'amount', title: 'Amount', align: 'right', render: r => fmt(r.amount) }
      ];
    }

    if (activeTab === 'payUsingSaving') {
      return [
        { key: 'full_name', title: 'Full Name', render: r => r.full_name || r.username || '' },
        { key: 'description', title: 'Description' },
        { key: 'amount', title: 'Amount', align: 'right', render: r => fmt(r.amount) },
        { key: 'date', title: 'Date', render: r => new Date(r.created_at).toLocaleDateString() }
      ];
    }

    if (activeTab === 'distribution') {
      return [
        { key: 'full_name', title: 'Full Name', render: r => r.full_name || '' },
        { key: 'amount', title: 'Amount', align: 'right', render: r => fmt(r.amount) },
        { key: 'year', title: 'Year', render: r => r.year || '' }
      ];
    }

    return [
      { key: 'description', title: 'Description' },
      { key: 'amount', title: 'Amount', align: 'right', render: r => fmt(r.amount) },
      { key: 'date', title: 'Date', render: r => new Date(r.created_at).toLocaleDateString() }
    ];
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/dashboard/users')} className="text-blue-600 hover:underline">← Back to Users</button>
        <h2 className="text-2xl font-bold">User details</h2>
      </div>

      {/* Basic user info (above tabs) */}
      <div className="mb-6 p-4 bg-white border border-blue-500 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="text-lg font-semibold">{(payUsingSavingData[0] && payUsingSavingData[0].full_name) || (distributionData[0] && distributionData[0].full_name) || (savingData[0] && savingData[0].username) || '—'}</div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500">Phone</div>
            <div className="text-lg">{(savingData[0] && savingData[0].phone_number) || '—'}</div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500">Total Savings</div>
            <div className="text-lg font-semibold">{fmt(savingTotalAmount)}</div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500">Savings Count</div>
            <div className="text-lg">{savingCount || 0}</div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500">User ID</div>
            <div className="text-sm text-gray-700 break-all">{userId}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => { setActiveTab('saving'); setPage(1); }} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'saving' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Savings</button>
          <button onClick={() => { setActiveTab('loan'); setPage(1); }} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'loan' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Loans</button>
          <button onClick={() => { setActiveTab('payUsingSaving'); setPage(1); }} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'payUsingSaving' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Pay Using Saving</button>
          <button onClick={() => { setActiveTab('distribution'); setPage(1); }} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'distribution' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Distribution</button>
        </nav>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <input type="text" placeholder="Search description or amount..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="border px-3 py-2 rounded-lg w-80" />
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-600">Show</label>
          <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="border px-2 py-2 rounded">
            {PageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
              <div className="mt-3 text-gray-600">Loading user details...</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <SimpleTable columns={columns} rows={paged} />

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}</div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <span>Page {page} of {pageCount}</span>
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserDetail;
