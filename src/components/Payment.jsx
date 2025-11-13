import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './Toast';

const mockPayments = [
  { id: 1, date: '2024-10-01T10:15:00Z', amount: 1500 },
  { id: 2, date: '2024-09-05T14:30:00Z', amount: 1200 },
  { id: 3, date: '2024-08-20T09:00:00Z', amount: 1000 },
];

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newAmount, setNewAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const [totalAmount, setTotalAmount] = useState(null);
  const [totalCount, setTotalCount] = useState(null);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const userIdFromQuery = query.get('user') || null;

  // reusable loader so we can refresh after creating a payment
  const loadPayments = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const opts = signal ? { signal } : {};
      const res = await fetch(`https://saving-api.mababa.app/api/loan-payments/${id}`, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setTotalAmount(body.total_amount ?? null);
      setTotalCount(body.total_payments ?? null);
      const list = Array.isArray(body.payments) ? body.payments : [];
      setPayments(list.map(p => ({ id: p.id, date: p.created_at || p.updated_at || p.timestamp, amount: p.amount })));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to load payments');
      setPayments(mockPayments);
      toast.addToast('Using fallback payment data (could not fetch from server).', { type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    loadPayments(controller.signal).catch(() => {});
    return () => { aborted = true; controller.abort(); };
  }, [id]);

  const handleAddPayment = async () => {
    if (!userIdFromQuery) {
      toast.addToast('Missing user id; cannot add payment', { type: 'error' });
      return;
    }
    const amt = Number(newAmount);
    if (!amt || amt <= 0) {
      toast.addToast('Enter a valid amount', { type: 'error' });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('https://saving-api.mababa.app/api/loan-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userIdFromQuery, loan_id: id, amount: amt })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const body = await res.json().catch(() => ({}));
      const msg = body && body.message ? body.message : 'Payment added';
      toast.addToast(msg, { type: 'success' });
      setNewAmount('');
      // refresh list & totals
      await loadPayments();
    } catch (err) {
      toast.addToast(err.message || 'Failed to add payment', { type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const formatNumber = (n) => n == null ? '' : Number(n).toLocaleString();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Payments</h2>
          <div className="text-sm text-gray-600">Loan ID: {id}</div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded">Back</button>
          <div className="flex items-center space-x-2">
            <input type="number" placeholder="Amount" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="border px-3 py-2 rounded" />
            <button onClick={handleAddPayment} disabled={adding} className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50">{adding ? 'Adding...' : 'Add Payment'}</button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mb-4 text-sm text-gray-600 flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
          <div>Loading payments...</div>
        </div>
      )}

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      {(totalAmount != null || totalCount != null) && (
        <div className="mb-4 flex items-center space-x-6">
          <div className="text-sm text-gray-700">Total payments: <span className="font-semibold">{totalCount ?? '—'}</span></div>
          <div className="text-sm text-gray-700">Total amount: <span className="font-semibold">{totalAmount != null ? Number(totalAmount).toLocaleString() : '—'}</span></div>
        </div>
      )}

      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left border-b">Date</th>
              <th className="py-3 px-4 text-left border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{p.date ? new Date(p.date).toLocaleString() : ''}</td>
                <td className="py-3 px-4 border-b">{formatNumber(p.amount)}</td>
              </tr>
            ))}
            {payments.length === 0 && (<tr><td colSpan={2} className="py-6 text-center text-gray-500">No payments found</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
