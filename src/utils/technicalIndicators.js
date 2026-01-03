// Technical Analysis Indicators
// Calculations for RSI, MACD, Moving Averages, Bollinger Bands

// Simple Moving Average (SMA)
export const calculateSMA = (data, period = 20) => {
  if (!data || data.length < period) return [];

  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
};

// Exponential Moving Average (EMA)
export const calculateEMA = (data, period = 12) => {
  if (!data || data.length === 0) return [];

  const k = 2 / (period + 1);
  const ema = [data[0]];

  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

// Relative Strength Index (RSI)
export const calculateRSI = (data, period = 14) => {
  if (!data || data.length < period + 1) return [];

  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  const rsi = [];
  for (let i = period; i <= changes.length; i++) {
    const slice = changes.slice(i - period, i);
    const gains = slice.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(slice.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;

    const rs = losses === 0 ? 100 : gains / losses;
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
};

// MACD (Moving Average Convergence Divergence)
export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!data || data.length < slowPeriod) return { macd: [], signal: [], histogram: [] };

  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  const macdLine = [];
  const startIndex = slowPeriod - fastPeriod;
  for (let i = startIndex; i < emaFast.length; i++) {
    macdLine.push(emaFast[i] - emaSlow[i - startIndex]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);

  const histogram = [];
  const signalStartIndex = macdLine.length - signalLine.length;
  for (let i = signalStartIndex; i < macdLine.length; i++) {
    histogram.push(macdLine[i] - signalLine[i - signalStartIndex]);
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
};

// Bollinger Bands
export const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  if (!data || data.length < period) return { upper: [], middle: [], lower: [] };

  const middle = calculateSMA(data, period);
  const upper = [];
  const lower = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sma = middle[i - period + 1];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const sd = Math.sqrt(variance);

    upper.push(sma + (stdDev * sd));
    lower.push(sma - (stdDev * sd));
  }

  return { upper, middle, lower };
};

// Volume Moving Average
export const calculateVolumeMA = (volumes, period = 20) => {
  return calculateSMA(volumes, period);
};

// Detect Buy/Sell Signals
export const detectSignals = (data, rsi, macd) => {
  const signals = [];

  // RSI signals
  if (rsi && rsi.length > 0) {
    const latestRSI = rsi[rsi.length - 1];
    if (latestRSI < 30) {
      signals.push({ type: 'BUY', indicator: 'RSI', reason: 'Oversold (RSI < 30)', strength: 'Strong' });
    } else if (latestRSI > 70) {
      signals.push({ type: 'SELL', indicator: 'RSI', reason: 'Overbought (RSI > 70)', strength: 'Strong' });
    }
  }

  // MACD signals (crossover)
  if (macd && macd.histogram && macd.histogram.length > 1) {
    const current = macd.histogram[macd.histogram.length - 1];
    const previous = macd.histogram[macd.histogram.length - 2];

    if (previous < 0 && current > 0) {
      signals.push({ type: 'BUY', indicator: 'MACD', reason: 'Bullish crossover', strength: 'Medium' });
    } else if (previous > 0 && current < 0) {
      signals.push({ type: 'SELL', indicator: 'MACD', reason: 'Bearish crossover', strength: 'Medium' });
    }
  }

  return signals;
};

// Calculate all indicators at once
export const calculateAllIndicators = (prices, volumes, config = {}) => {
  const {
    rsiPeriod = 14,
    macdFast = 12,
    macdSlow = 26,
    macdSignal = 9,
    smaPeriod = 20,
    emaPeriod = 12,
    bbPeriod = 20,
    bbStdDev = 2
  } = config;

  const indicators = {
    sma: calculateSMA(prices, smaPeriod),
    ema: calculateEMA(prices, emaPeriod),
    rsi: calculateRSI(prices, rsiPeriod),
    macd: calculateMACD(prices, macdFast, macdSlow, macdSignal),
    bollingerBands: calculateBollingerBands(prices, bbPeriod, bbStdDev),
    volumeMA: volumes ? calculateVolumeMA(volumes, 20) : []
  };

  // Detect signals
  indicators.signals = detectSignals(prices, indicators.rsi, indicators.macd);

  return indicators;
};

export default {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVolumeMA,
  detectSignals,
  calculateAllIndicators
};
