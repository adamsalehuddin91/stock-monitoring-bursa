import React, { useState } from 'react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';
import MarketStatusCard from '../partials/dashboard/MarketStatusCard';
import KLCIIndexCard from '../partials/dashboard/KLCIIndexCard';
import USMarketsCard from '../partials/dashboard/USMarketsCard';
import ForeignFlowCard from '../partials/dashboard/ForeignFlowCard';
import MarketOverviewCard from '../partials/dashboard/MarketOverviewCard';

function StockDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Dashboard header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Bursa Malaysia Stock Monitor</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time market data and trading insights</p>
              </div>

              {/* Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <button className="btn bg-blue-500 hover:bg-blue-600 text-white">
                  <svg className="fill-current shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
                  </svg>
                  <span>Refresh Data</span>
                </button>
              </div>
            </div>

            {/* Market Status - Full Width */}
            <div className="grid grid-cols-12 gap-6 mb-6">
              <MarketStatusCard />
            </div>

            {/* Market Cards */}
            <div className="grid grid-cols-12 gap-6 mb-6">
              <KLCIIndexCard />
              <USMarketsCard />
              <ForeignFlowCard />
            </div>

            {/* Market Overview Section */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📊 Market Overview</h2>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <MarketOverviewCard />
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

export default StockDashboard;
