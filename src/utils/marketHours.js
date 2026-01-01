// Bursa Malaysia Market Hours Utility

export const isMarketOpen = () => {
  const now = new Date();

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
  // Morning session: 9:00 AM - 12:30 PM
  // Afternoon session: 2:30 PM - 5:00 PM

  const morningStart = 9 * 60; // 9:00 AM
  const morningEnd = 12 * 60 + 30; // 12:30 PM
  const afternoonStart = 14 * 60 + 30; // 2:30 PM
  const afternoonEnd = 17 * 60; // 5:00 PM

  // Check if current time is within trading hours
  const isMorningSession = currentTime >= morningStart && currentTime <= morningEnd;
  const isAfternoonSession = currentTime >= afternoonStart && currentTime <= afternoonEnd;

  return isMorningSession || isAfternoonSession;
};

export const getMarketStatus = () => {
  const isOpen = isMarketOpen();
  const now = new Date();
  const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
  const day = malaysiaTime.getDay();

  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      status: 'Closed',
      message: 'Weekend',
      nextOpen: 'Monday 9:00 AM'
    };
  }

  if (isOpen) {
    return {
      isOpen: true,
      status: 'Open',
      message: 'Live Trading',
      color: 'green'
    };
  }

  return {
    isOpen: false,
    status: 'Closed',
    message: 'After Hours',
    nextOpen: 'Next trading day'
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
