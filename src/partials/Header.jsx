import React, { useState, useEffect } from 'react';

import ThemeToggle from '../components/ThemeToggle';
import { getMarketStatus, formatMarketTime } from '../utils/marketHours';

function Header({
  sidebarOpen,
  setSidebarOpen,
  variant = 'default',
}) {

  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [currentTime, setCurrentTime] = useState(formatMarketTime());

  // Update market status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
      setCurrentTime(formatMarketTime());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30 ${variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' : 'max-lg:shadow-xs lg:before:bg-gray-100/90 dark:lg:before:bg-gray-900/90'} ${variant === 'v2' ? 'dark:before:bg-gray-800' : ''} ${variant === 'v3' ? 'dark:before:bg-gray-900' : ''}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-gray-700/60'}`}>

          {/* Header: Left side */}
          <div className="flex items-center">

            {/* Hamburger button */}
            <button
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>

          </div>

          {/* Header: Center - Title & Market Status */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                📊 Bursa Malaysia Stock Monitor
              </h1>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  marketStatus.isOpen
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    marketStatus.isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></span>
                  {marketStatus.status}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentTime}
                </span>
              </div>
            </div>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;