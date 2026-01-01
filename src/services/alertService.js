// Alert Service - Generate real-time alerts from stock data
import { fetchMultipleStocks, fetchKLCIIndex } from './stockApi';
import { fetchFinancialNews } from './newsService';

// Thresholds for alerts
const THRESHOLDS = {
  PRICE_BREAKOUT: 2.0, // 2% change triggers breakout alert
  VOLUME_SURGE: 2.0,   // 2x average volume triggers surge alert
  LARGE_CHANGE: 5.0,    // 5% change is significant
  SMALL_CHANGE: 1.0    // 1% change is notable
};

// LocalStorage keys
const CUSTOM_ALERTS_KEY = 'customAlerts';
const ALERT_HISTORY_KEY = 'alertHistory';

// Get custom alerts from localStorage
export const getCustomAlerts = () => {
  try {
    const saved = localStorage.getItem(CUSTOM_ALERTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Save custom alert
export const saveCustomAlert = (alert) => {
  const alerts = getCustomAlerts();
  const newAlert = {
    id: Date.now().toString(),
    ...alert,
    created: Date.now(),
    enabled: true
  };
  alerts.push(newAlert);
  localStorage.setItem(CUSTOM_ALERTS_KEY, JSON.stringify(alerts));
  return newAlert;
};

// Delete custom alert
export const deleteCustomAlert = (id) => {
  const alerts = getCustomAlerts().filter(a => a.id !== id);
  localStorage.setItem(CUSTOM_ALERTS_KEY, JSON.stringify(alerts));
};

// Toggle custom alert
export const toggleCustomAlert = (id) => {
  const alerts = getCustomAlerts().map(a =>
    a.id === id ? { ...a, enabled: !a.enabled } : a
  );
  localStorage.setItem(CUSTOM_ALERTS_KEY, JSON.stringify(alerts));
};

// Check custom price alerts
const checkCustomAlerts = async (stocks) => {
  const customAlerts = getCustomAlerts().filter(a => a.enabled);
  const triggeredAlerts = [];

  stocks.forEach(stock => {
    customAlerts.forEach(alert => {
      if (alert.stockCode !== stock.code) return;

      let triggered = false;
      let message = '';

      switch (alert.type) {
        case 'price_above':
          if (stock.price >= alert.targetPrice) {
            triggered = true;
            message = `Price reached RM${stock.price.toFixed(2)} (target: RM${alert.targetPrice})`;
          }
          break;
        case 'price_below':
          if (stock.price <= alert.targetPrice) {
            triggered = true;
            message = `Price dropped to RM${stock.price.toFixed(2)} (target: RM${alert.targetPrice})`;
          }
          break;
        case 'percent_gain':
          if (stock.changePercent >= alert.targetPercent) {
            triggered = true;
            message = `Stock gained ${stock.changePercent.toFixed(2)}% today (target: ${alert.targetPercent}%)`;
          }
          break;
        case 'percent_loss':
          if (stock.changePercent <= -alert.targetPercent) {
            triggered = true;
            message = `Stock dropped ${Math.abs(stock.changePercent).toFixed(2)}% today (target: ${alert.targetPercent}%)`;
          }
          break;
      }

      if (triggered) {
        triggeredAlerts.push({
          id: `custom-${Date.now()}-${Math.random()}`,
          type: 'announcement',
          title: `${stock.name} Alert Triggered`,
          message: message,
          time: 'Just now',
          read: false,
          priority: 'high',
          stockCode: stock.code,
          timestamp: Date.now(),
          customAlertId: alert.id
        });
      }
    });
  });

  return triggeredAlerts;
};

// Generate alerts from stock data
export const generateAlerts = async (watchlistCodes) => {
  try {
    const stocks = await fetchMultipleStocks(watchlistCodes);
    const alerts = [];
    let alertId = Date.now();

    // Check custom alerts first
    const customTriggered = await checkCustomAlerts(stocks);
    alerts.push(...customTriggered);

    stocks.forEach(stock => {
      // Price breakout alerts
      if (Math.abs(stock.changePercent) >= THRESHOLDS.PRICE_BREAKOUT) {
        const isPositive = stock.changePercent > 0;
        alerts.push({
          id: alertId++,
          type: 'breakout',
          title: `${stock.name} Price ${isPositive ? 'Breakout' : 'Breakdown'}`,
          message: `Stock ${isPositive ? 'surged' : 'dropped'} ${Math.abs(stock.changePercent).toFixed(2)}% to RM ${stock.price.toFixed(2)}`,
          time: getTimeAgo(stock.timestamp),
          read: false,
          priority: Math.abs(stock.changePercent) >= THRESHOLDS.LARGE_CHANGE ? 'high' : 'medium',
          stockCode: stock.code,
          timestamp: stock.timestamp
        });
      }

      // Volume surge alerts (simplified - compare to a baseline)
      const avgVolume = 5.0; // Baseline average volume in millions
      if (stock.volume > avgVolume * THRESHOLDS.VOLUME_SURGE) {
        alerts.push({
          id: alertId++,
          type: 'volume',
          title: `${stock.name} Volume Surge`,
          message: `Trading volume ${(stock.volume / avgVolume).toFixed(1)}x above average at ${stock.volume.toFixed(2)}M`,
          time: getTimeAgo(stock.timestamp),
          read: false,
          priority: 'medium',
          stockCode: stock.code,
          timestamp: stock.timestamp
        });
      }
    });

    // Add KLCI market alert
    try {
      const klci = await fetchKLCIIndex();
      if (Math.abs(klci.changePercent) >= 0.5) {
        const isPositive = klci.change > 0;
        alerts.push({
          id: alertId++,
          type: 'news',
          title: `KLCI Market ${isPositive ? 'Rally' : 'Decline'}`,
          message: `FTSE Bursa Malaysia KLCI ${isPositive ? 'up' : 'down'} ${Math.abs(klci.changePercent).toFixed(2)}% at ${klci.value.toFixed(2)} points`,
          time: getTimeAgo(klci.timestamp),
          read: false,
          priority: Math.abs(klci.changePercent) >= 1.0 ? 'high' : 'low',
          timestamp: klci.timestamp
        });
      }
    } catch (err) {
      console.error('Error fetching KLCI for alerts:', err);
    }

    // Add news-based alerts
    try {
      const news = await fetchFinancialNews();
      const recentNews = news.filter(article => {
        // Only news from last 2 hours
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        return article.timestamp > twoHoursAgo;
      });

      recentNews.forEach(article => {
        // Only alert if news mentions watchlist stocks
        const mentionedWatchlistStocks = article.stocks?.filter(code =>
          watchlistCodes.includes(code)
        );

        if (mentionedWatchlistStocks && mentionedWatchlistStocks.length > 0 && article.sentiment === 'bullish') {
          alerts.push({
            id: `news-${article.id}`,
            type: 'news',
            title: `Bullish News: ${article.title.substring(0, 50)}...`,
            message: article.summary.substring(0, 100) + '...',
            time: article.time,
            read: false,
            priority: 'medium',
            stocks: mentionedWatchlistStocks,
            timestamp: article.timestamp
          });
        }
      });
    } catch (err) {
      console.error('Error fetching news for alerts:', err);
    }

    // Sort by timestamp (newest first) and limit to 20
    return alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  } catch (error) {
    console.error('Error generating alerts:', error);
    return [];
  }
};

// Helper to format time ago
const getTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Today';
};

export default {
  generateAlerts,
  getCustomAlerts,
  saveCustomAlert,
  deleteCustomAlert,
  toggleCustomAlert,
  THRESHOLDS
};
