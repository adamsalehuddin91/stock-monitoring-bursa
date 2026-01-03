import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation
} from 'react-router-dom';

import './css/style.css';

import './charts/ChartjsConfig';

// Import pages
import Dashboard from './pages/Dashboard';
import StockDashboard from './pages/StockDashboard';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Alerts from './pages/Alerts';
import News from './pages/News';
import DailyChecklist from './pages/DailyChecklist';
import StockDetail from './pages/StockDetail';
import StockScreener from './pages/StockScreener';

// PWA Install Prompt
import InstallPWA from './components/InstallPWA';

function App() {

  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]); // triggered on route change

  return (
    <>
      <Routes>
        <Route exact path="/" element={<StockDashboard />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/stock/:stockCode" element={<StockDetail />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/news" element={<News />} />
        <Route path="/stock-screener" element={<StockScreener />} />
        <Route path="/checklist" element={<DailyChecklist />} />
        <Route path="/original-dashboard" element={<Dashboard />} />
      </Routes>

      {/* PWA Install Prompt */}
      <InstallPWA />
    </>
  );
}

export default App;
