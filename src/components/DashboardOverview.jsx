import React, { useEffect, useRef, useState } from 'react';

const DashboardOverview = () => {
  const [savingsGoals] = useState([
    { id: 1, name: 'Emergency Fund', current: 8500, target: 10000, color: 'bg-green-500' }
  ]);

  const [recentTransactions] = useState([
    { id: 1, type: 'deposit', amount: 500, description: 'Salary Savings', date: '2024-11-01', category: 'Income' }
  ]);

  // live stats received from websocket
  const [liveStats, setLiveStats] = useState({
    total_savings: null,
    total_loans: null,
    total_penalties: null,
    user_count: null,
    sum_latest_saving: null,
    sum_latest_loan_payments: null,
    generated_at: null
  });

  const wsRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timer: null });
  const mountedRef = useRef(true);

  // stats will be derived from liveStats (websocket) below

  // Format numbers without currency symbol and without decimal places
  const formatNumber = (amount) => {
    if (amount === null || amount === undefined) return '—';
    // show as integer with thousands separators, drop any .00
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  // stats cards derived from liveStats with sensible fallbacks
  const statsCards = [
    { label: 'Total Savings', value: formatNumber(liveStats.total_savings ?? 12450), changeType: 'positive' },
    { label: 'Total Loans', value: formatNumber(liveStats.total_loans ?? 1200), changeType: 'positive' },
    { label: 'Total Penalties', value: formatNumber(liveStats.total_penalties ?? 0), changeType: 'neutral' },
    { label: 'Members', value: (liveStats.user_count ?? 4).toString(), changeType: 'neutral' }
  ];

  const WS_URL = 'wss://saving-api.mababa.app/ws/stats';

  const connect = () => {
    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        reconnectRef.current.attempts = 0;
      };

      wsRef.current.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          setLiveStats(prev => ({ ...prev, ...data }));
        } catch (err) {
          // ignore malformed messages
        }
      };

      wsRef.current.onclose = () => {
        if (!mountedRef.current) return;
        scheduleReconnect();
      };

      wsRef.current.onerror = () => {
        try { wsRef.current.close(); } catch (e) {}
      };
    } catch (err) {
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    const attempts = reconnectRef.current.attempts + 1;
    reconnectRef.current.attempts = attempts;
    const delay = Math.min(30000, 1000 * Math.pow(2, attempts));
    if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
    reconnectRef.current.timer = setTimeout(() => {
      if (!mountedRef.current) return;
      connect();
    }, delay);
  };

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
      try { if (wsRef.current) wsRef.current.close(); } catch (e) {}
    };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
     

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-sm font-medium ${
                stat.changeType === 'positive'
                  ? 'bg-green-100 text-green-800'
                  : stat.changeType === 'negative'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Savings Goals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent saving</h2>
            <button className="text-savings-blue hover:text-savings-purple font-medium text-sm">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Show the websocket-provided latest saving sum as the recent saving */}
            {liveStats.sum_latest_saving ? (
              <div className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Latest saving</h3>
                  <span className="text-2xl text-gray-600">{formatNumber(liveStats.sum_latest_saving)}</span>
                </div>
                <div className="text-sm text-gray-600">Updated: {liveStats.generated_at ? new Date(liveStats.generated_at).toLocaleString() : ''}</div>
              </div>
            ) : (
              savingsGoals.map((goal) => (
                <div key={goal.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{goal.name}</h3>
                    <span className="text-sm text-gray-600">
                      {formatNumber(goal.current)} / {formatNumber(goal.target)}
                    </span>
                  </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${goal.color} transition-all duration-300`}
                    style={{ width: `${getProgressPercentage(goal.current, goal.target)}%` }}
                  ></div>
                </div>
                  <div className="text-sm text-gray-600">
                    {getProgressPercentage(goal.current, goal.target).toFixed(1)}% complete
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Monthly loan</h2>
            <button className="text-savings-blue hover:text-savings-purple font-medium text-sm">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {/* If WS provides latest loan payments sum, show it prominently */}
            {liveStats.sum_latest_loan_payments ? (
              <div className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Latest loan payments</h3>
                  <span className="text-2xl font-bold text-gray-900">{formatNumber(liveStats.sum_latest_loan_payments)}</span>
                </div>
              
                {liveStats.generated_at && (<div className="text-xs text-gray-500 mt-2">Updated: {new Date(liveStats.generated_at).toLocaleString()}</div>)}
              </div>
            ) : null}

           
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default DashboardOverview;