import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

/**
 * MiniChart - Lightweight sparkline chart for table rows
 * Props:
 * - data: Array of { time, value } points
 * - width: Chart width (default: 120)
 * - height: Chart height (default: 40)
 * - color: Line color (default: auto based on trend)
 */
function MiniChart({ data, width = 120, height = 40, color }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) {
      return;
    }

    try {
      // Determine trend and color
      const firstValue = data[0].value;
      const lastValue = data[data.length - 1].value;
      const isPositive = lastValue >= firstValue;
      const lineColor = color || (isPositive ? '#10b981' : '#ef4444');

      // Create minimal chart
      const chart = createChart(chartContainerRef.current, {
        width: width,
        height: height,
        layout: {
          background: { color: 'transparent' },
          textColor: 'transparent',
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        crosshair: {
          vertLine: { visible: false },
          horzLine: { visible: false },
        },
        leftPriceScale: { visible: false },
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
        handleScroll: false,
        handleScale: false,
      });

      chartRef.current = chart;

      // Add line series
      const lineSeries = chart.addLineSeries({
        color: lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });

      lineSeries.setData(data);
      chart.timeScale().fitContent();

      setError(false);
    } catch (err) {
      console.error('MiniChart error:', err);
      setError(true);
    }

    // Cleanup
    return () => {
      try {
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      } catch (err) {
        console.error('Chart cleanup error:', err);
      }
    };
  }, [data, width, height, color]);

  if (error) {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center">
        <span className="text-xs text-gray-400">-</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center">
        <span className="text-xs text-gray-400">...</span>
      </div>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="inline-block"
    />
  );
}

export default MiniChart;
