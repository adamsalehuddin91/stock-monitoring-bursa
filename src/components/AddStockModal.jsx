import React, { useState } from 'react';
import { X, Search, Plus, TrendingUp } from 'lucide-react';
import { searchStocks, getAllStocks } from '../data/malaysianStocks';

function AddStockModal({ isOpen, onClose, onAddStock, currentWatchlist }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  const allStocks = getAllStocks();

  // Filter stocks
  const filteredStocks = searchTerm
    ? searchStocks(searchTerm)
    : selectedCategory === 'all'
    ? allStocks
    : allStocks.filter(stock => stock.category.toLowerCase() === selectedCategory.toLowerCase());

  // Remove already added stocks
  const availableStocks = filteredStocks.filter(
    stock => !currentWatchlist.includes(stock.code)
  );

  const handleAddStock = (stockCode) => {
    onAddStock(stockCode);
    setSearchTerm('');
  };

  const categories = [
    { id: 'all', name: 'All Stocks', icon: '📊' },
    { id: 'blue chip', name: 'Blue Chips', icon: '💎' },
    { id: 'growth', name: 'Growth', icon: '🚀' },
    { id: 'tech', name: 'Technology', icon: '💻' },
    { id: 'property', name: 'Property', icon: '🏢' },
    { id: 'consumer', name: 'Consumer', icon: '🛒' },
    { id: 'agriculture', name: 'Agriculture', icon: '🌾' },
    { id: 'industrial', name: 'Industrial', icon: '🏭' },
    { id: 'healthcare', name: 'Healthcare', icon: '⚕️' },
    { id: 'oil & gas', name: 'Oil & Gas', icon: '⛽' },
    { id: 'automotive', name: 'Automotive', icon: '🚗' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'reit', name: 'REITs', icon: '🏬' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Add Stocks to Watchlist</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Browse {allStocks.length}+ Malaysian stocks • {availableStocks.length} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by stock code, name, or sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Stock List */}
        <div className="flex-1 overflow-y-auto p-6">
          {availableStocks.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No stocks found matching your search' : 'All stocks already in watchlist'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableStocks.map((stock) => (
                <div
                  key={stock.code}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stock.code}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        {stock.category}
                      </span>
                    </div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{stock.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{stock.sector}</div>
                  </div>
                  <button
                    onClick={() => handleAddStock(stock.code)}
                    className="ml-4 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    title="Add to watchlist">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 <strong>Tip:</strong> Add high-growth stocks for better profit potential
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors">
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AddStockModal;
