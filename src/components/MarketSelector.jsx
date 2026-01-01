import React from 'react';
import { Globe } from 'lucide-react';

function MarketSelector({ selectedMarket, onMarketChange }) {
  const markets = [
    { id: 'BURSA', name: 'Malaysia', flag: '🇲🇾', emoji: '📊' },
    { id: 'US', name: 'US Markets', flag: '🇺🇸', emoji: '🗽' },
    { id: 'GLOBAL', name: 'All Markets', flag: '🌍', emoji: '🌐' }
  ];

  return (
    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
      {markets.map((market) => (
        <button
          key={market.id}
          onClick={() => onMarketChange(market.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedMarket === market.id
              ? 'bg-blue-500 text-white shadow-md scale-105'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span className="text-lg">{market.flag}</span>
          <span>{market.name}</span>
          {selectedMarket === market.id && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default MarketSelector;
