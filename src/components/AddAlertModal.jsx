import React, { useState } from 'react';
import { X, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getAllStocks } from '../data/malaysianStocks';
import { saveCustomAlert } from '../services/alertService';

function AddAlertModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedStock, setSelectedStock] = useState(null);
  const [alertType, setAlertType] = useState('price_above');
  const [targetPrice, setTargetPrice] = useState('');
  const [targetPercent, setTargetPercent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const allStocks = getAllStocks();
  const filteredStocks = searchTerm
    ? allStocks.filter(stock =>
        stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.code.includes(searchTerm)
      )
    : allStocks.slice(0, 20);

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setStep(2);
  };

  const handleSubmit = () => {
    const alert = {
      stockCode: selectedStock.code,
      stockName: selectedStock.name,
      type: alertType,
      targetPrice: parseFloat(targetPrice) || 0,
      targetPercent: parseFloat(targetPercent) || 0
    };

    saveCustomAlert(alert);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setSelectedStock(null);
    setAlertType('price_above');
    setTargetPrice('');
    setTargetPercent('');
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create Alert</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {step === 1 ? 'Select a stock' : 'Set alert conditions'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {step === 1 ? (
            /* Step 1: Select Stock */
            <div>
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStocks.map((stock) => (
                  <button
                    key={stock.code}
                    onClick={() => handleSelectStock(stock)}
                    className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{stock.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{stock.code} • {stock.sector}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Step 2: Set Alert Conditions */
            <div>
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Setting alert for: <span className="font-semibold">{selectedStock.name} ({selectedStock.code})</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alert Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAlertType('price_above')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        alertType === 'price_above'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}>
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Price Above</p>
                    </button>

                    <button
                      onClick={() => setAlertType('price_below')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        alertType === 'price_below'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}>
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 mb-2" />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Price Below</p>
                    </button>

                    <button
                      onClick={() => setAlertType('percent_gain')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        alertType === 'percent_gain'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}>
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">% Gain Above</p>
                    </button>

                    <button
                      onClick={() => setAlertType('percent_loss')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        alertType === 'percent_loss'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}>
                      <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400 mb-2" />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">% Loss Above</p>
                    </button>
                  </div>
                </div>

                {(alertType === 'price_above' || alertType === 'price_below') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Price (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="e.g. 5.50"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {(alertType === 'percent_gain' || alertType === 'percent_loss') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetPercent}
                      onChange={(e) => setTargetPercent(e.target.value)}
                      placeholder="e.g. 5.0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Back
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            {step === 2 && (
              <button
                onClick={handleSubmit}
                disabled={
                  (alertType.includes('price') && !targetPrice) ||
                  (alertType.includes('percent') && !targetPercent)
                }
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Create Alert
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddAlertModal;
