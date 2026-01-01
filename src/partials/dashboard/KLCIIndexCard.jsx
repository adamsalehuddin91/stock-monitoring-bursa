import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';
import { fetchKLCIIndex } from '../../services/stockApi';

function KLCIIndexCard() {
  const [klciData, setKlciData] = useState({
    value: 0,
    change: 0,
    changePercent: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartHistory, setChartHistory] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchKLCIIndex();
      setKlciData(data);
      setChartHistory(prev => [...prev.slice(-25), data.value]);
    } catch (err) {
      console.error('Error fetching KLCI:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(timer);
  }, []);

  const isPositive = klciData.change >= 0;

  const chartData = {
    labels: chartHistory.map((_, i) => `T-${chartHistory.length - i}`),
    datasets: [
      {
        data: chartHistory,
        fill: true,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: adjustColorOpacity(isPositive ? getCssVariable('--color-green-500') : getCssVariable('--color-red-500'), 0) },
            { stop: 1, color: adjustColorOpacity(isPositive ? getCssVariable('--color-green-500') : getCssVariable('--color-red-500'), 0.2) }
          ]);
        },
        borderColor: isPositive ? getCssVariable('--color-green-500') : getCssVariable('--color-red-500'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: isPositive ? getCssVariable('--color-green-500') : getCssVariable('--color-red-500'),
        pointHoverBackgroundColor: isPositive ? getCssVariable('--color-green-500') : getCssVariable('--color-red-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };

  if (loading && chartHistory.length === 0) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
        <div className="px-5 py-5 flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">FTSE Bursa Malaysia KLCI</h2>
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
            {loading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
        </header>
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Real-time Index</div>
        <div className="flex items-start">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
            {klciData.value.toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-green-700 bg-green-500/20' : 'text-red-700 bg-red-500/20'} px-1.5 rounded-full`}>
            {isPositive ? '+' : ''}{klciData.change.toFixed(2)} ({isPositive ? '+' : ''}{klciData.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      {chartHistory.length > 0 && (
        <div className="grow max-sm:max-h-[128px] xl:max-h-[128px]">
          <LineChart data={chartData} width={389} height={128} />
        </div>
      )}
    </div>
  );
}

export default KLCIIndexCard;
