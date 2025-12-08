import { useEffect, useState } from 'react';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MonthlySavingsCard = ({ year }) => {
  const [monthly, setMonthly] = useState(Array(12).fill(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentYear = new Date().getFullYear();
  const START_YEAR = 2024;
  const yearOptions = [];
  for (let y = START_YEAR; y <= currentYear; y++) yearOptions.push(y);
  // selectedYear: 'all' or string year
  const [selectedYear, setSelectedYear] = useState(year ? String(year) : String(currentYear));

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
        const items = (body.savings || []);

        const targetYear = selectedYear === 'all' ? null : Number(selectedYear);
        const agg = Array(12).fill(0);

        items.forEach(s => {
          const d = s.created_at ? new Date(s.created_at) : null;
          if (!d || isNaN(d)) return;
          if (targetYear && d.getFullYear() !== targetYear) return;
          const m = d.getMonth();
          const amt = Number(s.amount) || 0;
          agg[m] += amt;
        });

        if (!aborted) setMonthly(agg);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load monthly savings');
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    fetchSavings();
    return () => { aborted = true; controller.abort(); };
  }, [selectedYear]);

  const max = Math.max(...monthly, 1);

  const format = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-blue-600 p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Monthly Savings {selectedYear === 'all' ? '(All years)' : `(${selectedYear})`}</h3>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">Jan — Dec</div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Select year"
          >
            <option value="all">All years</option>
            {yearOptions.slice().reverse().map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg className="w-full" viewBox="0 0 600 260" preserveAspectRatio="xMidYMin meet" aria-label="Monthly savings bar chart">
            {/* background grid lines */}
            <g className="text-xs text-gray-300">
              {[0,0.25,0.5,0.75,1].map((p,i) => {
                const y = 20 + (1 - p) * 180;
                return <line key={i} x1={40} x2={560} y1={y} y2={y} stroke="#eee" strokeWidth={1} />;
              })}
            </g>

            {/* Bars */}
            <g>
              {monthly.map((amt, idx) => {
                const svgWidth = 600;
                const svgHeight = 220;
                const padding = 40;
                const plotWidth = svgWidth - padding * 2; // 520
                const barSpace = plotWidth / 12;
                const barWidth = Math.max(12, barSpace * 0.6);
                const x = padding + idx * barSpace + (barSpace - barWidth) / 2;
                const height = (amt / max) * (svgHeight - 60);
                const y = svgHeight - 20 - height;

                return (
                  <g key={idx}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(0, height)}
                      rx={4}
                      fill="#2563eb"
                    >
                      <title>{`${MONTH_NAMES[idx]}: ${format(amt)}`}</title>
                    </rect>
                    <text x={x + barWidth / 2} y={y - 6} fontSize={10} fill="#374151" textAnchor="middle">{amt > 0 ? format(amt) : ''}</text>
                    <text x={x + barWidth / 2} y={svgHeight - 4} fontSize={11} fill="#6b7280" textAnchor="middle">{MONTH_NAMES[idx]}</text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};

export default MonthlySavingsCard;
