import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

const MONTHLY_INTEREST_RATE = 0.05; // 5% flat on original principal

const formatNumber = (n) =>
  n == null ? '0' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB') : '';

const buildAnalysis = (loanAmount, issuedDate, deadline, totalPaid = 0) => {
  const issued = new Date(issuedDate);
  const due = new Date(deadline);

  const durationMonths = Math.max(
    1,
    (due.getFullYear() - issued.getFullYear()) * 12 + (due.getMonth() - issued.getMonth())
  );

  // Flat interest: 5% of original principal every month, unchanged by partial payments
  const monthlyInterest = loanAmount * MONTHLY_INTEREST_RATE;
  const totalInterest = monthlyInterest * durationMonths;
  const totalDue = loanAmount + totalInterest;
  const amountPaid = Math.min(totalPaid, totalDue);
  const remaining = Math.max(0, totalDue - amountPaid);
  const isSettled = amountPaid >= totalDue;

  const months = [];
  for (let m = 1; m <= durationMonths; m++) {
    // Last day of the m-th month after issuance
    const dueDate = new Date(issued.getFullYear(), issued.getMonth() + m + 1, 0);
    const cumulativeInterest = monthlyInterest * m;
    const cumulativeDue = loanAmount + cumulativeInterest;

    let status;
    if (amountPaid >= cumulativeDue) {
      status = 'Covered';
    } else if (amountPaid > 0 && m === durationMonths) {
      status = 'Partial';
    } else if (dueDate < new Date() && !isSettled) {
      status = 'Overdue';
    } else {
      status = 'Pending';
    }

    months.push({ month: m, dueDate, monthlyInterest, cumulativeInterest, cumulativeDue, status });
  }

  return { durationMonths, monthlyInterest, totalInterest, totalDue, amountPaid, remaining, isSettled, months };
};

const PaymentSchedule = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loan, setLoan] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loanId) return;
    let aborted = false;
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://viva-api-366k.onrender.com/api/loans', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const found = (data.loans || []).find((l) => l.id === loanId);
        if (!found) throw new Error('Loan not found');

        const totalPaid = found.total_amount_paid || 0;

        setLoan(found);
        setAnalysis(buildAnalysis(found.amount, found.issued_date, found.deadline, totalPaid));
      } catch (err) {
        if (err.name === 'AbortError' || aborted) return;
        setError(err.message);
        toast.addToast(err.message, { type: 'error' });
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => { aborted = true; controller.abort(); };
  }, [loanId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <p className="mt-3 text-gray-600">Loading loan analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !loan || !analysis) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/dashboard/loans')} className="text-blue-600 hover:underline mb-3 block">
          ← Back to Loans
        </button>
        <p className="text-red-600">{error || 'Loan not found'}</p>
      </div>
    );
  }

  const { durationMonths, monthlyInterest, totalInterest, totalDue, amountPaid, remaining, isSettled, months } = analysis;
  const progressPct = Math.min(100, Math.round((amountPaid / totalDue) * 100));

  return (
    <div className="p-5 space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/dashboard/loans')} className="text-blue-600 hover:underline text-sm">
            ← Back to Loans
          </button>
          <span className="text-gray-400">|</span>
          <h1 className="text-xl font-bold text-gray-800">Loan Analysis</h1>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            isSettled
              ? 'bg-green-100 text-green-700'
              : loan.status === 'active'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isSettled ? 'Settled' : (loan.status || 'Active').toUpperCase()}
        </span>
      </div>

      {/* Borrower Info */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Borrower Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Borrower</p>
            <p className="font-semibold text-gray-800">{loan.username}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-semibold text-gray-800">{loan.phone_number || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Issued Date</p>
            <p className="font-semibold text-gray-800">{formatDate(loan.issued_date)}</p>
          </div>
          <div>
            <p className="text-gray-500">Deadline</p>
            <p className="font-semibold text-gray-800">{formatDate(loan.deadline)}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Principal</p>
          <p className="text-lg font-bold text-gray-800">{formatNumber(loan.amount)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Duration</p>
          <p className="text-lg font-bold text-blue-600">{durationMonths} mo</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <p className="text-xs text-yellow-700 mb-1">Monthly Interest</p>
          <p className="text-lg font-bold text-yellow-700">{formatNumber(monthlyInterest)}</p>
          <p className="text-xs text-yellow-600">5% of principal</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 text-center">
          <p className="text-xs text-orange-700 mb-1">Total Interest</p>
          <p className="text-lg font-bold text-orange-600">{formatNumber(totalInterest)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
          <p className="text-xs text-blue-700 mb-1">Total Due</p>
          <p className="text-lg font-bold text-blue-700">{formatNumber(totalDue)}</p>
        </div>
        <div
          className={`rounded-xl border p-4 text-center ${
            isSettled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <p className={`text-xs mb-1 ${isSettled ? 'text-green-700' : 'text-red-600'}`}>Remaining</p>
          <p className={`text-lg font-bold ${isSettled ? 'text-green-700' : 'text-red-600'}`}>
            {formatNumber(remaining)}
          </p>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-700">Payment Progress</h2>
          <span className="text-sm font-bold text-gray-700">{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all ${isSettled ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>
            Paid: <strong className="text-green-600">{formatNumber(amountPaid)}</strong>
          </span>
          <span>
            Total Due: <strong>{formatNumber(totalDue)}</strong>
          </span>
        </div>
      </div>

      {/* Monthly Interest Accrual Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b">
          <h2 className="text-base font-semibold text-gray-700">Monthly Interest Accrual</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Fixed interest of 5% on principal ({formatNumber(loan.amount)}) ={' '}
            <strong>{formatNumber(monthlyInterest)}</strong> / month — unchanged by partial payments
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                <th className="py-2 px-4 text-left border-b">Month</th>
                <th className="py-2 px-4 text-left border-b">Due Date</th>
                <th className="py-2 px-4 text-right border-b">Monthly Interest</th>
                <th className="py-2 px-4 text-right border-b">Cumulative Interest</th>
                <th className="py-2 px-4 text-right border-b">Total Due (Cumul.)</th>
                <th className="py-2 px-4 text-center border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {months.map((row, idx) => (
                <tr key={row.month} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4 border-b font-medium">Month {row.month}</td>
                  <td className="py-2 px-4 border-b text-gray-600">{formatDate(row.dueDate)}</td>
                  <td className="py-2 px-4 border-b text-right text-yellow-700 font-semibold">
                    {formatNumber(row.monthlyInterest)}
                  </td>
                  <td className="py-2 px-4 border-b text-right text-orange-600 font-semibold">
                    {formatNumber(row.cumulativeInterest)}
                  </td>
                  <td className="py-2 px-4 border-b text-right font-bold text-blue-700">
                    {formatNumber(row.cumulativeDue)}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                        row.status === 'Covered'
                          ? 'bg-green-100 text-green-700'
                          : row.status === 'Partial'
                          ? 'bg-blue-100 text-blue-700'
                          : row.status === 'Overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold text-sm">
                <td colSpan={2} className="py-2 px-4 border-t">
                  TOTAL
                </td>
                <td className="py-2 px-4 border-t text-right text-yellow-700">{formatNumber(totalInterest)}</td>
                <td className="py-2 px-4 border-t text-right text-orange-600">{formatNumber(totalInterest)}</td>
                <td className="py-2 px-4 border-t text-right text-blue-700">{formatNumber(totalDue)}</td>
                <td className="py-2 px-4 border-t" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Payment Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Principal</p>
            <p className="font-bold text-gray-800">{formatNumber(loan.amount)}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-600">Expected Interest</p>
            <p className="font-bold text-yellow-700">{formatNumber(totalInterest)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600">Amount Paid</p>
            <p className="font-bold text-green-700">{formatNumber(amountPaid)}</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${isSettled ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`text-xs ${isSettled ? 'text-green-600' : 'text-red-500'}`}>
              {isSettled ? 'Fully Settled' : 'Still Owed'}
            </p>
            <p className={`font-bold ${isSettled ? 'text-green-700' : 'text-red-600'}`}>
              {isSettled ? '—' : formatNumber(remaining)}
            </p>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
          <p>
            • Interest rate: <strong>5% flat per month</strong> on the original principal.
          </p>
          <p>
            • Expected total interest:{' '}
            <strong>
              {formatNumber(loan.amount)} × 5% × {durationMonths} months = {formatNumber(totalInterest)}
            </strong>
          </p>
          <p>
            • Interest does <strong>not decrease</strong> with partial payments — the full interest applies until the
            loan is completely settled.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSchedule;

