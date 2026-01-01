import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function USMarketsCard() {
  const markets = {
    dowJones: { value: 38520.78, change: -125.34, changePercent: -0.32 },
    sp500: { value: 5042.15, change: 15.67, changePercent: 0.31 }
  };

  return (
    <>
      {/* Dow Jones Card */}
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
        <div className="px-5 py-5">
          <header className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">US Dow Jones</h2>
            <div className={`p-2 rounded-lg ${markets.dowJones.change >= 0 ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
              {markets.dowJones.change >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </header>
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Previous Close</div>
          <div className="flex items-start">
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
              {markets.dowJones.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`mt-2 inline-flex text-sm font-medium ${markets.dowJones.change >= 0 ? 'text-green-700 bg-green-500/20' : 'text-red-700 bg-red-500/20'} px-2 py-1 rounded-full`}>
            {markets.dowJones.change >= 0 ? '+' : ''}{markets.dowJones.change.toFixed(2)} ({markets.dowJones.change >= 0 ? '+' : ''}{markets.dowJones.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* S&P 500 Card */}
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
        <div className="px-5 py-5">
          <header className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">US S&P 500</h2>
            <div className={`p-2 rounded-lg ${markets.sp500.change >= 0 ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
              {markets.sp500.change >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </header>
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Previous Close</div>
          <div className="flex items-start">
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
              {markets.sp500.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`mt-2 inline-flex text-sm font-medium ${markets.sp500.change >= 0 ? 'text-green-700 bg-green-500/20' : 'text-red-700 bg-red-500/20'} px-2 py-1 rounded-full`}>
            {markets.sp500.change >= 0 ? '+' : ''}{markets.sp500.change.toFixed(2)} ({markets.sp500.change >= 0 ? '+' : ''}{markets.sp500.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
    </>
  );
}

export default USMarketsCard;
