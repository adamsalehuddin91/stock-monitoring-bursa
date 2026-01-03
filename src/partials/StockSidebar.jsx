import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, List, Wallet, Bell, Newspaper, CheckSquare, TrendingUp, Filter } from 'lucide-react';

function StockSidebar({ sidebarOpen, setSidebarOpen }) {
  const trigger = useRef(null);
  const sidebar = useRef(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  return (
    <div className="min-w-fit">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out rounded-r-2xl shadow-xs ${sidebarOpen ? "translate-x-0" : "-translate-x-64"}`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          {/* Close button */}
          <button
            ref={trigger}
            className="lg:hidden text-gray-500 hover:text-gray-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <NavLink end to="/" className="block">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <span className="ml-2 text-lg font-bold text-gray-800 dark:text-gray-100">Bursa Monitor</span>
            </div>
          </NavLink>
        </div>

        {/* Links */}
        <div className="space-y-8">
          {/* Stock Monitoring group */}
          <div>
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3 mb-3">
              Stock Monitoring
            </h3>
            <ul className="space-y-1">
              {/* Dashboard */}
              <li>
                <NavLink
                  end
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition duration-150 ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Dashboard</span>
                </NavLink>
              </li>

              {/* Watchlist */}
              <li>
                <NavLink
                  to="/watchlist"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition duration-150 ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  <List className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Watchlist</span>
                </NavLink>
              </li>

              {/* Portfolio */}
              <li>
                <NavLink
                  to="/portfolio"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition duration-150 ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  <Wallet className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Portfolio</span>
                </NavLink>
              </li>

              {/* Stock Screener */}
              <li>
                <NavLink
                  to="/stock-screener"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition duration-150 ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  <Filter className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Stock Screener</span>
                </NavLink>
              </li>

              {/* Alerts */}
              <li>
                <NavLink
                  to="/alerts"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition duration-150 ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  <Bell className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Alerts</span>
                </NavLink>
              </li>

              {/* News */}
              <li>
                <NavLink
                  to="/news"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition duration-150 ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  <Newspaper className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">News</span>
                </NavLink>
              </li>

              {/* Daily Checklist */}
              <li>
                <NavLink
                  to="/checklist"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition duration-150 ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  <CheckSquare className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Daily Checklist</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockSidebar;
