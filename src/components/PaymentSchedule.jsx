import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PaymentSchedule = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loan, setLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loanStatus, setLoanStatus] = useState(null);

  // Interest rate constant
  const MONTHLY_INTEREST_RATE = 0.05; // 5%

  const calculatePaymentSchedule = (loanAmount, issuedDate, deadline, totalPaid = 0) => {
    const issued = new Date(issuedDate);
    const due = new Date(deadline);
    
    // Calculate payment range in months
    const monthsDiff = (due.getFullYear() - issued.getFullYear()) * 12 + (due.getMonth() - issued.getMonth());
    const paymentRange = Math.max(1, monthsDiff);
    
    // Monthly principal payment
    const monthlyPrincipal = loanAmount / paymentRange;
    
    const paymentSchedule = [];
    let remainingBalance = loanAmount;
    let remainingPaid = totalPaid;
    
    // Helper: get last day (Date object) for the month that is `offset` months after the issued month
    const getLastDayOfMonth = (baseDate, offset) => {
      const baseMonth = baseDate.getMonth();
      const baseYear = baseDate.getFullYear();
      const targetMonthIndex = baseMonth + offset; // may exceed 11
      const year = baseYear + Math.floor(targetMonthIndex / 12);
      const month = ((targetMonthIndex % 12) + 12) % 12;
      // new Date(year, month + 1, 0) -> last day of `month`
      return new Date(year, month + 1, 0);
    };

    for (let month = 1; month <= paymentRange; month++) {
      // Calculate payment date for this installment as the last day of the target month
      const paymentDateObj = getLastDayOfMonth(issued, month);
      const paymentDate = paymentDateObj;
      
      // Interest is calculated on remaining balance
      const interest = remainingBalance * MONTHLY_INTEREST_RATE;
      
      // Total monthly payment (principal + interest)
      const totalPayment = monthlyPrincipal + interest;
      
      // Determine payment status and paid amount based on remaining paid amount
      let status = 'Pending';
      let paidAmount = 0;
      
      if (remainingPaid >= totalPayment) {
        status = 'Paid';
        paidAmount = totalPayment;
        remainingPaid -= totalPayment;
      } else if (remainingPaid > 0) {
        status = 'Progress';
        paidAmount = remainingPaid;
        remainingPaid = 0;
      }
      
      paymentSchedule.push({
        month,
        paymentDate: paymentDate.toLocaleDateString(),
        principal: monthlyPrincipal,
        interest,
        totalPayment,
        paidAmount,
        remainingBalance: Math.max(0, remainingBalance),
        status
      });
      
      // Update remaining balance after adding to schedule
      remainingBalance -= monthlyPrincipal;
    }
    
    return paymentSchedule;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const exportToPDF = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF();
      
      // Add logo (if available)
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
          logoImg.onload = () => {
            doc.addImage(logoImg, 'PNG', 165, 10, 25, 25);
            resolve();
          };
          logoImg.onerror = () => resolve();
          logoImg.src = '/logo.png';
        });
      } catch (logoError) {
        console.log('Logo not added:', logoError);
      }
      
      // Add loan details on the left side
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const leftX = 20;
      doc.text(`Borrower: ${loan.username}`, leftX, 15);
      doc.text(`Loan Amount: ${formatCurrency(loan.amount)}`, leftX, 20);
      doc.text(`Issued: ${new Date(loan.issued_date).toLocaleDateString()}`, leftX, 25);
      doc.text(`Deadline: ${new Date(loan.deadline).toLocaleDateString()}`, leftX, 30);
      doc.text(`Payment Range: ${schedule.length} months`, leftX, 35);
      
    
      
      // Add title directly above table with no margin (centered)
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      const pageWidth = doc.internal.pageSize.width;
      const title = 'Loan Payment Schedule';
      const titleWidth = doc.getTextWidth(title);
      const titleX = (pageWidth - titleWidth) / 2;
      doc.text(title, titleX, 50);
      
      // Prepare data for table
      const tableData = schedule.map((payment) => [
        payment.month.toString(),
        payment.paymentDate,
        formatCurrency(payment.principal),
        formatCurrency(payment.interest),
        formatCurrency(payment.totalPayment),
        formatCurrency(payment.paidAmount),
        formatCurrency(payment.remainingBalance),
        payment.status || 'Pending'
      ]);
      
      const tableHead = [['Month', 'Payment Date', 'Principal', 'Interest (5%)', 'Total Payment', 'Paid Amount', 'Remaining Balance', 'Status']];
      
      // Calculate totals
      const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
      const totalAmount = schedule.reduce((sum, payment) => sum + payment.totalPayment, 0);
      const totalPaidAmount = schedule.reduce((sum, payment) => sum + payment.paidAmount, 0);
      
      // Add totals row
      tableData.push([
        'TOTAL',
        '',
        formatCurrency(loan.amount),
        formatCurrency(totalInterest),
        formatCurrency(totalAmount),
        formatCurrency(totalPaidAmount),
        '',
        ''
      ]);

      autoTable(doc, {
        head: tableHead,
        body: tableData,
        startY: 52,
        styles: {
          fontSize: 8,
          textColor: [0, 0, 0],
          cellPadding: 2,
          lineWidth: 0.1,
          halign: 'center'
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          cellPadding: 2,
          halign: 'center'
        },
        bodyStyles: {
          halign: 'center'
        },
        columnStyles: {
          2: { halign: 'right' }, // Principal
          3: { halign: 'right' }, // Interest
          4: { halign: 'right' }, // Total Payment
          5: { halign: 'right' }, // Paid Amount
          6: { halign: 'right' }, // Remaining Balance
          7: { halign: 'center' } // Status
        },
        margin: { top: 52, right: 14, bottom: 20, left: 14 },
        tableWidth: 'auto',
        willDrawPage: (data) => {
          if (data.pageNumber > 1) {
            data.settings.margin.top = 12;
            data.settings.startY = 14;
          }
        },
        didDrawPage: (data) => {
          const pageHeight = doc.internal.pageSize.height;
          const pageWidthInner = doc.internal.pageSize.width;
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(0, 0, 0);
          const footerText = `This report generated by Saving management system on ${new Date().toLocaleDateString()}`;
          const footerWidth = doc.getTextWidth(footerText);
          const footerX = (pageWidthInner - footerWidth) / 2;
          const footerY = pageHeight - 10;
          doc.text(footerText, footerX, footerY);
        }
      });

      // Add Payment Instructions section
      const finalY = doc.lastAutoTable.finalY + 5;
      
      // Add a styled box for instructions
      doc.setFillColor(240, 240, 240);
      doc.rect(15, finalY - 2, 180, 28, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, finalY - 2, 180, 28, 'S');
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Payment Instructions', 20, finalY + 5);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const monthlyPrincipal = schedule[0]?.principal || 0;
      const instructions = [
        `• Monthly principal payment: ${formatCurrency(monthlyPrincipal)}`,
        '• Interest is calculated at 5% of the remaining loan balance each month',
        '• Make payments on or before the specified payment date to avoid additional charges'
      ];
      
      instructions.forEach((instruction, index) => {
        doc.text(instruction, 20, finalY + 12 + (index * 5));
      });
      
      doc.save(`payment-schedule-${loan.username}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.addToast('PDF exported successfully!', { type: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.addToast(`Failed to export PDF: ${error.message}`, { type: 'error' });
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        // Fetch all loans and find the specific one by ID
        const res = await fetch('https://viva-api-366k.onrender.com/api/loans');
        
        if (!res.ok) {
          throw new Error(`Failed to fetch loans: ${res.status}`);
        }
        
        const loansData = await res.json();
        const foundLoan = loansData.loans?.find(loan => loan.id === loanId);
        
        if (!foundLoan) {
          throw new Error('Loan not found');
        }
        
        setLoan(foundLoan);
        
        // Fetch loan status to get payment information
        try {
          const statusRes = await fetch(`https://viva-api-366k.onrender.com/api/loan/${loanId}/status`);
          let totalPaid = 0;
          let fetchedStatus = null;
          
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            fetchedStatus = statusData;
            setLoanStatus(statusData);
            totalPaid = statusData.total_amount_paid || 0;
          } else {
            console.warn('Could not fetch loan status, using default values');
          }
          
          // Calculate payment schedule with payment status
          const calculatedSchedule = calculatePaymentSchedule(
            foundLoan.amount,
            foundLoan.issued_date,
            foundLoan.deadline,
            totalPaid
          );

          // If the loan is closed, mark any non-paid entries as Closed
          if (fetchedStatus && fetchedStatus.status === 'closed') {
            const finalSchedule = calculatedSchedule.map((entry) => (
              entry.status === 'Paid' ? entry : { ...entry, status: 'Closed' }
            ));
            setSchedule(finalSchedule);
          } else {
            setSchedule(calculatedSchedule);
          }
        } catch (statusError) {
          console.warn('Error fetching loan status:', statusError);
          // Calculate schedule without payment status if status fetch fails
          const calculatedSchedule = calculatePaymentSchedule(
            foundLoan.amount,
            foundLoan.issued_date,
            foundLoan.deadline,
            0
          );
          
          setSchedule(calculatedSchedule);
        }
      } catch (err) {
        setError(err.message);
        toast.addToast(err.message, { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (loanId) {
      fetchLoanDetails();
    }
  }, [loanId, toast]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
            <div className="mt-3 text-gray-600">Loading payment schedule...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button 
            onClick={() => navigate('/dashboard/loans')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Loans
          </button>
        </div>
        <div className="text-red-600">
          {error || 'Loan not found'}
        </div>
      </div>
    );
  }

  const totalAmount = schedule.reduce((sum, payment) => sum + payment.totalPayment, 0);
  const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard/loans')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back to Loans
              </button>
              <h1 className="text-xl font-bold">Payment Schedule</h1>
            </div>
            <button 
              onClick={exportToPDF}
              disabled={pdfLoading}
              className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                pdfLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title="Download PDF"
            >
              {pdfLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <span>PDF</span>
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <h3 className="font-medium text-gray-700 text-sm">Borrower</h3>
              <p className="text-base font-medium">{loan.username}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 text-sm">Loan Amount</h3>
              <p className="text-base font-bold text-green-600">{formatCurrency(loan.amount)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 text-sm">Payment Range</h3>
              <p className="text-base">{schedule.length} months</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <div>
              <strong>Issued Date:</strong> {new Date(loan.issued_date).toLocaleDateString()}
            </div>
            <div>
              <strong>Deadline:</strong> {new Date(loan.deadline).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>


      {/* Payment Schedule Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="text-base font-semibold">Monthly Payment Schedule</h2>
          <p className="text-xs text-gray-600 mt-1">
            Interest Rate: 5% monthly
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-very-small">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-3 text-left border-b font-medium text-sm">Month</th>
                <th className="py-2 px-3 text-left border-b font-medium text-sm">Payment Date</th>
                <th className="py-2 px-3 text-right border-b font-medium text-sm">Principal</th>
                <th className="py-2 px-3 text-right border-b font-medium text-sm">Interest (5%)</th>
                <th className="py-2 px-3 text-right border-b font-medium text-sm">Total Payment</th>
                <th className="py-2 px-3 text-right border-b font-medium text-sm">Paid Amount</th>
                <th className="py-2 px-3 text-right border-b font-medium text-sm">Remaining Balance</th>
                <th className="py-2 px-3 text-center border-b font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((payment, index) => (
                <tr key={payment.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-3 border-b font-medium text-sm">{payment.month}</td>
                  <td className={payment.status === 'Closed' ? 'py-2 px-3 border-b text-sm text-red-600' : 'py-2 px-3 border-b text-sm'}>{payment.paymentDate}</td>
                  <td className="py-2 px-3 border-b text-right font-medium text-sm">
                    {formatCurrency(payment.principal)}
                  </td>
                  <td className="py-2 px-3 border-b text-right text-yellow-600 text-sm">
                    {formatCurrency(payment.interest)}
                  </td>
                  <td className="py-2 px-3 border-b text-right font-bold text-sm">
                    {formatCurrency(payment.totalPayment)}
                  </td>
                  <td className="py-2 px-3 border-b text-right font-bold text-sm" style={{
                    color: payment.status === 'Paid' ? '#059669' : payment.status === 'Progress' ? '#2563eb' : payment.status === 'Closed' ? '#dc2626' : '#6b7280'
                  }}>
                    {formatCurrency(payment.paidAmount)}
                  </td>
                  <td className="py-2 px-3 border-b text-right text-gray-600 text-sm">
                    {formatCurrency(payment.remainingBalance)}
                  </td>
                  <td className="py-2 px-3 border-b text-center">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      payment.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : payment.status === 'Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : payment.status === 'Closed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={2} className="py-2 px-3 border-b text-sm">TOTALS</td>
                <td className="py-2 px-3 border-b text-right text-sm">{formatCurrency(loan.amount)}</td>
                <td className="py-2 px-3 border-b text-right text-yellow-600 text-sm">
                  {formatCurrency(totalInterest)}
                </td>
                <td className="py-2 px-3 border-b text-right text-sm">{formatCurrency(totalAmount)}</td>
                <td className="py-2 px-3 border-b text-right text-green-600 text-sm">
                  {formatCurrency(schedule.reduce((sum, payment) => sum + payment.paidAmount, 0))}
                </td>
                <td colSpan={2} className="py-2 px-3 border-b"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="mt-4 bg-blue-50 rounded-lg p-3">
        <h3 className="font-medium text-blue-800 mb-2 text-sm">Payment Instructions</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• Monthly principal payment: <strong>{formatCurrency(schedule[0]?.principal || 0)}</strong></p>
          <p>• Interest is calculated at 5% of the remaining loan balance each month</p>
          <p>• Make payments on or before the specified payment date to avoid additional charges</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSchedule;