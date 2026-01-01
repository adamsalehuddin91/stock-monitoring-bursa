import React, { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { searchStocks, getAllStocks } from '../data/malaysianStocks';
import { addHolding } from '../services/portfolioService';

function AddHoldingModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Select Stock, 2: Enter Details
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const allStocks = getAllStocks();
  const filteredStocks = searchTerm
    ? searchStocks(searchTerm)
    : allStocks.slice(0, 50); // Show first 50 if no search

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedStock) {
      setError('Please select a stock');
      return;
    }

    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (!buyPrice || buyPrice <= 0) {
      setError('Please enter a valid buy price');
      return;
    }

    try {
      const holding = {
        stockCode: selectedStock.code,
        stockName: selectedStock.name,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        buyDate: buyDate,
        notes: notes
      };

      await addHolding(holding);

      // Reset form
      setStep(1);
      setSelectedStock(null);
      setQuantity('');
      setBuyPrice('');
      setBuyDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setSearchTerm('');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add holding');
    }
  };

  const handleBack = () => {
    setStep(1);
    setSelectedStock(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {step === 1 ? 'Select Stock' : 'Enter Holding Details'}
            </h2>
            {selectedStock && step === 2 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedStock.name} ({selectedStock.code})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stocks by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                  autoFocus
                />
              </div>

              {/* Stock List */}
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {filteredStocks.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No stocks found
                  </p>
                ) : (
                  filteredStocks.map((stock) => (
                    <button
                      key={stock.code}
                      onClick={() => handleStockSelect(stock)}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 text-left">
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
                      <Plus className="w-5 h-5 text-gray-400" />
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 100"
                  min="1"
                  step="1"
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>

              {/* Buy Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buy Price (RM) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="e.g., 10.50"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>

              {/* Buy Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buy Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={buyDate}
                  onChange={(e) => setBuyDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Bought on analyst recommendation"
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-2">
                  Investment Summary
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Shares:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {quantity || '0'} shares
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Price per Share:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      RM {buyPrice || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-800">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Total Investment:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      RM {((parseFloat(quantity) || 0) * (parseFloat(buyPrice) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end space-x-3">
            {step === 2 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors">
                Back
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            {step === 2 && (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                Add Holding
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AddHoldingModal;
