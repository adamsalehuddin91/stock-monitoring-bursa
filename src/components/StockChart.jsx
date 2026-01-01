import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Loader2 } from 'lucide-react';

/**
 * StockChart Component - TradingView Lightweight Charts
 *
 * Props:
 * - data: Array of candles { time, open, high, low, close, volume }
 * - height: Chart height in pixels (default: 400)
 * - showVolume: Show volume bars (default: true)
 * - type: 'candlestick' or 'line' (default: 'candlestick')
 */
function StockChart({ data, height = 400, showVolume = true, type = 'candlestick' }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) {
      setLoading(false);
      return;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick or line series
    let series;
    if (type === 'candlestick') {
      series = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
    } else {
      series = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      });
    }

    candleSeriesRef.current = series;

    // Prepare data for chart (convert timestamp to seconds)
    const chartData = data.map(candle => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    series.setData(chartData);

    // Add volume series if enabled
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#3b82f6',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;

      const volumeData = data.map(candle => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? '#10b98180' : '#ef444480',
      }));

      volumeSeries.setData(volumeData);
    }

    // Fit content
    chart.timeScale().fitContent();

    setLoading(false);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [data, height, showVolume, type]);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height: `${height}px` }}
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div
          style={{ height: `${height}px` }}
          className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg z-10">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
      <div
        ref={chartContainerRef}
        className="rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

export default StockChart;
