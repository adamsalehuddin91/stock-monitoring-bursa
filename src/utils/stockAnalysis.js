// Stock Analysis & Pattern Recognition
// Advanced technical analysis and market pattern detection

/**
 * Detect price trend from historical data
 */
export const detectTrend = (candles) => {
  if (!candles || candles.length < 20) return { trend: 'Unknown', strength: 0 };

  const recentCandles = candles.slice(-20);
  const prices = recentCandles.map(c => c.close);

  // Calculate simple linear regression
  const n = prices.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  prices.forEach((price, i) => {
    sumX += i;
    sumY += price;
    sumXY += i * price;
    sumX2 += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgPrice = sumY / n;
  const slopePercent = (slope / avgPrice) * 100;

  // Determine trend
  let trend, strength;
  if (slopePercent > 0.5) {
    trend = 'Strong Uptrend';
    strength = Math.min(100, Math.abs(slopePercent) * 20);
  } else if (slopePercent > 0.1) {
    trend = 'Uptrend';
    strength = Math.min(100, Math.abs(slopePercent) * 20);
  } else if (slopePercent < -0.5) {
    trend = 'Strong Downtrend';
    strength = Math.min(100, Math.abs(slopePercent) * 20);
  } else if (slopePercent < -0.1) {
    trend = 'Downtrend';
    strength = Math.min(100, Math.abs(slopePercent) * 20);
  } else {
    trend = 'Sideways';
    strength = 50;
  }

  return { trend, strength, slope: slopePercent };
};

/**
 * Calculate support and resistance levels
 */
export const calculateSupportResistance = (candles) => {
  if (!candles || candles.length < 20) return { support: null, resistance: null };

  const recentCandles = candles.slice(-50);
  const lows = recentCandles.map(c => c.low);
  const highs = recentCandles.map(c => c.high);

  // Find recent significant lows (support)
  const sortedLows = [...lows].sort((a, b) => a - b);
  const support = sortedLows[Math.floor(sortedLows.length * 0.1)]; // 10th percentile

  // Find recent significant highs (resistance)
  const sortedHighs = [...highs].sort((a, b) => b - a);
  const resistance = sortedHighs[Math.floor(sortedHighs.length * 0.1)]; // 90th percentile

  return { support, resistance };
};

/**
 * Detect chart patterns
 */
export const detectPatterns = (candles, technicalData) => {
  if (!candles || candles.length < 20) return [];

  const patterns = [];
  const recentCandles = candles.slice(-20);
  const prices = recentCandles.map(c => c.close);
  const volumes = recentCandles.map(c => c.volume);

  // 1. Breakout Pattern (price above recent resistance with volume surge)
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const currentVolume = volumes[volumes.length - 1];
  const currentPrice = prices[prices.length - 1];
  const recentHigh = Math.max(...prices.slice(-10));

  if (currentPrice > recentHigh * 1.02 && currentVolume > avgVolume * 1.5) {
    patterns.push({
      name: 'Breakout',
      type: 'bullish',
      description: 'Price breaking above resistance with strong volume',
      confidence: 85
    });
  }

  // 2. Volume Surge (unusual volume)
  if (currentVolume > avgVolume * 2) {
    patterns.push({
      name: 'Volume Surge',
      type: 'neutral',
      description: 'Unusual trading volume detected - potential trend change',
      confidence: 70
    });
  }

  // 3. Consolidation (low volatility)
  const priceRange = Math.max(...prices.slice(-10)) - Math.min(...prices.slice(-10));
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const volatility = (priceRange / avgPrice) * 100;

  if (volatility < 3) {
    patterns.push({
      name: 'Consolidation',
      type: 'neutral',
      description: 'Price trading in tight range - potential breakout coming',
      confidence: 75
    });
  }

  // 4. RSI Divergence (if RSI data available)
  if (technicalData && technicalData.rsi && technicalData.rsi.length > 10) {
    const rsi = technicalData.rsi;
    const recentRsi = rsi.slice(-10);
    const rsiTrend = recentRsi[recentRsi.length - 1] - recentRsi[0];
    const priceTrend = prices[prices.length - 1] - prices[prices.length - 10];

    // Bullish divergence: price down but RSI up
    if (priceTrend < 0 && rsiTrend > 5) {
      patterns.push({
        name: 'Bullish Divergence',
        type: 'bullish',
        description: 'RSI rising while price falling - potential reversal up',
        confidence: 80
      });
    }

    // Bearish divergence: price up but RSI down
    if (priceTrend > 0 && rsiTrend < -5) {
      patterns.push({
        name: 'Bearish Divergence',
        type: 'bearish',
        description: 'RSI falling while price rising - potential reversal down',
        confidence: 80
      });
    }
  }

  // 5. Gap Up/Down
  if (candles.length > 1) {
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    const gap = ((lastCandle.open - prevCandle.close) / prevCandle.close) * 100;

    if (gap > 2) {
      patterns.push({
        name: 'Gap Up',
        type: 'bullish',
        description: `Price opened ${gap.toFixed(2)}% higher - strong bullish sentiment`,
        confidence: 75
      });
    } else if (gap < -2) {
      patterns.push({
        name: 'Gap Down',
        type: 'bearish',
        description: `Price opened ${Math.abs(gap).toFixed(2)}% lower - strong bearish sentiment`,
        confidence: 75
      });
    }
  }

  return patterns;
};

/**
 * Generate trading recommendation based on multiple indicators
 */
export const generateRecommendation = (currentPrice, technicalData, patterns, supportResistance) => {
  if (!currentPrice || !technicalData) {
    return {
      action: 'HOLD',
      confidence: 0,
      reasons: ['Insufficient data for analysis']
    };
  }

  let bullishScore = 0;
  let bearishScore = 0;
  const reasons = [];

  // 1. RSI Analysis
  if (technicalData.rsi && technicalData.rsi.length > 0) {
    const rsi = technicalData.rsi[technicalData.rsi.length - 1];
    if (rsi < 30) {
      bullishScore += 30;
      reasons.push(`RSI oversold (${rsi.toFixed(1)}) - potential bounce`);
    } else if (rsi > 70) {
      bearishScore += 30;
      reasons.push(`RSI overbought (${rsi.toFixed(1)}) - potential pullback`);
    } else if (rsi >= 50 && rsi <= 60) {
      bullishScore += 10;
      reasons.push(`RSI healthy (${rsi.toFixed(1)}) - room for upside`);
    }
  }

  // 2. MACD Analysis
  if (technicalData.macd && technicalData.macd.histogram && technicalData.macd.histogram.length > 1) {
    const current = technicalData.macd.histogram[technicalData.macd.histogram.length - 1];
    const previous = technicalData.macd.histogram[technicalData.macd.histogram.length - 2];

    if (previous < 0 && current > 0) {
      bullishScore += 25;
      reasons.push('MACD bullish crossover - upward momentum');
    } else if (previous > 0 && current < 0) {
      bearishScore += 25;
      reasons.push('MACD bearish crossover - downward momentum');
    } else if (current > 0) {
      bullishScore += 10;
      reasons.push('MACD positive - bullish momentum');
    } else {
      bearishScore += 10;
      reasons.push('MACD negative - bearish momentum');
    }
  }

  // 3. Support/Resistance Analysis
  if (supportResistance && supportResistance.support && supportResistance.resistance) {
    const distanceToSupport = ((currentPrice.price - supportResistance.support) / supportResistance.support) * 100;
    const distanceToResistance = ((supportResistance.resistance - currentPrice.price) / currentPrice.price) * 100;

    if (distanceToSupport < 2) {
      bullishScore += 20;
      reasons.push('Price near support - good risk/reward for long');
    } else if (distanceToResistance < 2) {
      bearishScore += 20;
      reasons.push('Price near resistance - potential rejection');
    }
  }

  // 4. Pattern Analysis
  patterns.forEach(pattern => {
    if (pattern.type === 'bullish') {
      bullishScore += pattern.confidence * 0.2;
      reasons.push(`${pattern.name} detected - ${pattern.description}`);
    } else if (pattern.type === 'bearish') {
      bearishScore += pattern.confidence * 0.2;
      reasons.push(`${pattern.name} detected - ${pattern.description}`);
    }
  });

  // 5. Volume Trend
  if (currentPrice.volume && currentPrice.volume > 0) {
    // If we have volume data, add it to analysis
    bullishScore += 5;
    reasons.push('Active trading volume');
  }

  // Calculate final recommendation
  const totalScore = bullishScore + bearishScore;
  const bullishPercent = totalScore > 0 ? (bullishScore / totalScore) * 100 : 50;

  let action, confidence;
  if (bullishPercent >= 70) {
    action = 'BUY';
    confidence = Math.min(95, bullishPercent);
  } else if (bullishPercent <= 30) {
    action = 'SELL';
    confidence = Math.min(95, 100 - bullishPercent);
  } else {
    action = 'HOLD';
    confidence = 50 + Math.abs(50 - bullishPercent);
  }

  return {
    action,
    confidence: Math.round(confidence),
    bullishScore: Math.round(bullishScore),
    bearishScore: Math.round(bearishScore),
    reasons: reasons.slice(0, 4) // Top 4 reasons
  };
};

/**
 * Calculate key metrics from price data
 */
export const calculateMetrics = (candles, currentPrice) => {
  if (!candles || candles.length === 0) return {};

  const prices = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  // 52-week high/low (or available range)
  const high52w = Math.max(...prices);
  const low52w = Math.min(...prices);

  // Average volume
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

  // Volatility (standard deviation)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance);
  const volatilityPercent = (volatility / avgPrice) * 100;

  // Price from 52w high/low
  const currentPriceVal = currentPrice?.price || prices[prices.length - 1];
  const from52wHigh = ((currentPriceVal - high52w) / high52w) * 100;
  const from52wLow = ((currentPriceVal - low52w) / low52w) * 100;

  return {
    high52w,
    low52w,
    avgVolume,
    volatility: volatilityPercent,
    from52wHigh,
    from52wLow
  };
};

export default {
  detectTrend,
  calculateSupportResistance,
  detectPatterns,
  generateRecommendation,
  calculateMetrics
};
