// Multi-Market Hours Utility (Bursa Malaysia + US Markets)

export const isMarketOpen = (market = 'BURSA') => {
  const now = new Date();

  if (market === 'US' || market === 'NASDAQ' || market === 'NYSE') {
    return isUSMarketOpen(now);
  }

  // Default: Bursa Malaysia
  return isBursaMarketOpen(now);
};

// Bursa Malaysia Market Hours
export const isBursaMarketOpen = (now = new Date()) => {
  // Convert to Malaysia Time (UTC+8)
  const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));

  const day = malaysiaTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = malaysiaTime.getHours();
  const minutes = malaysiaTime.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes since midnight

  // Weekend check (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) {
    return false;
  }

  // Bursa Malaysia trading hours (Mon-Fri):
  // Morning session: 9:00 AM - 12:30 PM MYT
  // Afternoon session: 2:30 PM - 5:00 PM MYT

  const morningStart = 9 * 60; // 9:00 AM
  const morningEnd = 12 * 60 + 30; // 12:30 PM
  const afternoonStart = 14 * 60 + 30; // 2:30 PM
  const afternoonEnd = 17 * 60; // 5:00 PM

  // Check if current time is within trading hours
  const isMorningSession = currentTime >= morningStart && currentTime <= morningEnd;
  const isAfternoonSession = currentTime >= afternoonStart && currentTime <= afternoonEnd;

  return isMorningSession || isAfternoonSession;
};

// US Market Hours (NASDAQ + NYSE)
export const isUSMarketOpen = (now = new Date()) => {
  // Convert to US Eastern Time (UTC-5/-4 depending on DST)
  const usTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  const day = usTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = usTime.getHours();
  const minutes = usTime.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Weekend check
  if (day === 0 || day === 6) {
    return false;
  }

  // US Market hours (Mon-Fri):
  // Regular session: 9:30 AM - 4:00 PM EST
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  return currentTime >= marketOpen && currentTime <= marketClose;
};

export const getMarketStatus = (market = 'BURSA') => {
  const now = new Date();
  const isOpen = isMarketOpen(market);

  if (market === 'US' || market === 'NASDAQ' || market === 'NYSE') {
    const usTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const day = usTime.getDay();

    if (day === 0 || day === 6) {
      return {
        isOpen: false,
        status: 'Closed',
        message: 'Weekend',
        nextOpen: 'Monday 9:30 AM EST',
        timezone: 'EST'
      };
    }

    if (isOpen) {
      return {
        isOpen: true,
        status: 'Open',
        message: 'Live Trading',
        color: 'green',
        timezone: 'EST'
      };
    }

    return {
      isOpen: false,
      status: 'Closed',
      message: 'After Hours',
      nextOpen: 'Next trading day',
      timezone: 'EST'
    };
  }

  // Bursa Malaysia
  const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
  const day = malaysiaTime.getDay();

  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      status: 'Closed',
      message: 'Weekend',
      nextOpen: 'Monday 9:00 AM MYT',
      timezone: 'MYT'
    };
  }

  if (isOpen) {
    return {
      isOpen: true,
      status: 'Open',
      message: 'Live Trading',
      color: 'green',
      timezone: 'MYT'
    };
  }

  return {
    isOpen: false,
    status: 'Closed',
    message: 'After Hours',
    nextOpen: 'Next trading day',
    timezone: 'MYT'
  };
};

export const formatMarketTime = () => {
  const now = new Date();
  const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));

  return malaysiaTime.toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kuala_Lumpur'
  });
};
