import React from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

function ForeignFlowCard() {
  const foreignFlow = {
    net: -45.2,
    buy: 234.5,
    sell: 279.7
  };

  const isNetPositive = foreignFlow.net >= 0;

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 py-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Foreign Fund Flow</h2>
          <div className={`p-2 rounded-lg ${isNetPositive ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
            <DollarSign className={`w-5 h-5 ${isNetPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
          </div>
        </header>

        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Net Flow (RM Million)</div>
        <div className="flex items-start mb-4">
          <div className={`text-3xl font-bold mr-2 ${isNetPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isNetPositive ? '+' : ''}{foreignFlow.net.toFixed(1)}
          </div>
          <div className={`text-sm font-medium ${isNetPositive ? 'text-green-700 bg-green-500/20' : 'text-red-700 bg-red-500/20'} px-1.5 py-0.5 rounded-full mt-1`}>
            {isNetPositive ? 'Net Buying' : 'Net Selling'}
          </div>
        </div>

        {/* Buy/Sell Breakdown */}
        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowUpCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Buy</span>
            </div>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              RM {foreignFlow.buy.toFixed(1)}M
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowDownCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sell</span>
            </div>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
              RM {foreignFlow.sell.toFixed(1)}M
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForeignFlowCard;
