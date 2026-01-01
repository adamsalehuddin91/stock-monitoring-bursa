import React, { useState, useEffect } from 'react';
import { Clock, Activity } from 'lucide-react';

function MarketStatusCard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isMarketOpen = () => {
    const hour = currentTime.getHours();
    const day = currentTime.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
  };

  const marketOpen = isMarketOpen();

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Live Clock */}
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                Current Time (GMT+8)
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* Market Status */}
          <div className="flex items-center space-x-3">
            <div className={`p-3 ${marketOpen ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'} rounded-lg`}>
              <Activity className={`w-8 h-8 ${marketOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                Bursa Malaysia
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {marketOpen ? 'Open' : 'Closed'}
                </span>
                <span className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${marketOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center">
            <div>
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                Trading Day
              </div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MarketStatusCard;
