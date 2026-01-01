// Portfolio Management Service - LocalStorage based
// Tracks actual stock holdings with buy price, quantity, and performance

const PORTFOLIO_KEY = 'stockPortfolio';

/**
 * Portfolio Holding Structure:
 * {
 *   id: 'unique-id',
 *   stockCode: '1155',
 *   stockName: 'MAYBANK',
 *   quantity: 100,
 *   buyPrice: 10.50,
 *   buyDate: '2025-01-01',
 *   notes: 'Optional notes'
 * }
 */

// Get all holdings
export const getPortfolio = () => {
  try {
    const data = localStorage.getItem(PORTFOLIO_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading portfolio:', error);
    return [];
  }
};

// Add new holding
export const addHolding = (holding) => {
  try {
    const portfolio = getPortfolio();
    const newHolding = {
      id: `holding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...holding,
      buyDate: holding.buyDate || new Date().toISOString().split('T')[0]
    };
    portfolio.push(newHolding);
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
    return newHolding;
  } catch (error) {
    console.error('Error adding holding:', error);
    throw error;
  }
};

// Update existing holding
export const updateHolding = (id, updates) => {
  try {
    const portfolio = getPortfolio();
    const index = portfolio.findIndex(h => h.id === id);
    if (index !== -1) {
      portfolio[index] = { ...portfolio[index], ...updates };
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
      return portfolio[index];
    }
    throw new Error('Holding not found');
  } catch (error) {
    console.error('Error updating holding:', error);
    throw error;
  }
};

// Remove holding
export const removeHolding = (id) => {
  try {
    const portfolio = getPortfolio();
    const filtered = portfolio.filter(h => h.id !== id);
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing holding:', error);
    throw error;
  }
};

// Calculate portfolio statistics
export const calculatePortfolioStats = (portfolio, currentPrices) => {
  let totalInvestment = 0;
  let totalCurrentValue = 0;
  let totalGainLoss = 0;

  const holdingsWithStats = portfolio.map(holding => {
    const currentPrice = currentPrices[holding.stockCode];
    const investedAmount = holding.quantity * holding.buyPrice;
    const currentValue = currentPrice ? holding.quantity * currentPrice.price : 0;
    const gainLoss = currentValue - investedAmount;
    const gainLossPercent = investedAmount > 0 ? (gainLoss / investedAmount) * 100 : 0;

    totalInvestment += investedAmount;
    totalCurrentValue += currentValue;
    totalGainLoss += gainLoss;

    return {
      ...holding,
      currentPrice: currentPrice ? currentPrice.price : 0,
      investedAmount,
      currentValue,
      gainLoss,
      gainLossPercent,
      change: currentPrice ? currentPrice.change : 0,
      changePercent: currentPrice ? currentPrice.changePercent : 0
    };
  });

  const totalGainLossPercent = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

  return {
    holdings: holdingsWithStats,
    totalInvestment,
    totalCurrentValue,
    totalGainLoss,
    totalGainLossPercent,
    totalHoldings: portfolio.length
  };
};

// Get unique stock codes from portfolio
export const getPortfolioStockCodes = () => {
  const portfolio = getPortfolio();
  return [...new Set(portfolio.map(h => h.stockCode))];
};

export default {
  getPortfolio,
  addHolding,
  updateHolding,
  removeHolding,
  calculatePortfolioStats,
  getPortfolioStockCodes
};
