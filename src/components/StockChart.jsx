import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Loader2 } from 'lucide-react';
import { calculateAllIndicators } from '../utils/technicalIndicators';

/**
 * StockChart Component - TradingView Lightweight Charts
 *
 * Props:
 * - data: Array of candles { time, open, high, low, close, volume }
 * - height: Chart height in pixels (default: 400)
 * - showVolume: Show volume bars (default: true)
 * - type: 'candlestick' or 'line' (default: 'candlestick')
 * - indicators: Object { sma, ema, rsi, macd, bollingerBands } (default: {})
 */
function StockChart({ data, height = 400, showVolume = true, type = 'candlestick', indicators = {} }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const indicatorSeriesRef = useRef({});
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

    // Calculate technical indicators if enabled
    const hasIndicators = indicators.sma || indicators.ema || indicators.bollinger || indicators.rsi || indicators.macd;

    if (hasIndicators) {
      const prices = data.map(d => d.close);
      const volumes = data.map(d => d.volume);
      const calculatedIndicators = calculateAllIndicators(prices, volumes);

      // Add SMA line (20-period)
      if (indicators.sma && calculatedIndicators.sma && calculatedIndicators.sma.length > 0) {
        const smaSeries = chart.addLineSeries({
          color: '#f59e0b',
          lineWidth: 2,
          title: 'SMA(20)',
        });
        const smaData = calculatedIndicators.sma.map((value, index) => ({
          time: data[index + (data.length - calculatedIndicators.sma.length)].time,
          value: value,
        }));
        smaSeries.setData(smaData);
        indicatorSeriesRef.current.sma = smaSeries;
      }

      // Add EMA line (12-period)
      if (indicators.ema && calculatedIndicators.ema && calculatedIndicators.ema.length > 0) {
        const emaSeries = chart.addLineSeries({
          color: '#8b5cf6',
          lineWidth: 2,
          title: 'EMA(12)',
        });
        const emaData = calculatedIndicators.ema.map((value, index) => ({
          time: data[index].time,
          value: value,
        }));
        emaSeries.setData(emaData);
        indicatorSeriesRef.current.ema = emaSeries;
      }

      // Add Bollinger Bands
      if (indicators.bollinger && calculatedIndicators.bollingerBands) {
        const { upper, middle, lower } = calculatedIndicators.bollingerBands;

        if (upper.length > 0) {
          // Upper band
          const upperSeries = chart.addLineSeries({
            color: '#6366f1',
            lineWidth: 1,
            lineStyle: 2,
            title: 'BB Upper',
          });
          const upperData = upper.map((value, index) => ({
            time: data[index + (data.length - upper.length)].time,
            value: value,
          }));
          upperSeries.setData(upperData);
          indicatorSeriesRef.current.bbUpper = upperSeries;

          // Middle band (SMA)
          const middleSeries = chart.addLineSeries({
            color: '#6366f1',
            lineWidth: 1,
            title: 'BB Middle',
          });
          const middleData = middle.map((value, index) => ({
            time: data[index + (data.length - middle.length)].time,
            value: value,
          }));
          middleSeries.setData(middleData);
          indicatorSeriesRef.current.bbMiddle = middleSeries;

          // Lower band
          const lowerSeries = chart.addLineSeries({
            color: '#6366f1',
            lineWidth: 1,
            lineStyle: 2,
            title: 'BB Lower',
          });
          const lowerData = lower.map((value, index) => ({
            time: data[index + (data.length - lower.length)].time,
            value: value,
          }));
          lowerSeries.setData(lowerData);
          indicatorSeriesRef.current.bbLower = lowerSeries;
        }
      }

      // Add RSI as separate indicator (shown on price chart with reference lines)
      if (indicators.rsi && calculatedIndicators.rsi && calculatedIndicators.rsi.length > 0) {
        // Note: RSI should ideally be on a separate pane, but lightweight-charts doesn't support multiple panes
        // For now, we'll scale it to overlay on the price chart (0-100 scaled to price range)
        // In production, consider using a separate chart container for RSI
        const rsiSeries = chart.addLineSeries({
          color: '#ec4899',
          lineWidth: 2,
          priceScaleId: 'rsi',
          title: 'RSI(14)',
        });

        // Add RSI scale
        chart.priceScale('rsi').applyOptions({
          scaleMargins: {
            top: 0.9,
            bottom: 0,
          },
        });

        const rsiData = calculatedIndicators.rsi.map((value, index) => ({
          time: data[index + (data.length - calculatedIndicators.rsi.length)].time,
          value: value,
        }));
        rsiSeries.setData(rsiData);
        indicatorSeriesRef.current.rsi = rsiSeries;
      }

      // Add MACD histogram (shown as overlay)
      if (indicators.macd && calculatedIndicators.macd && calculatedIndicators.macd.histogram.length > 0) {
        const macdSeries = chart.addHistogramSeries({
          color: '#10b981',
          priceFormat: {
            type: 'price',
          },
          priceScaleId: 'macd',
        });

        chart.priceScale('macd').applyOptions({
          scaleMargins: {
            top: 0.85,
            bottom: 0,
          },
        });

        const macdData = calculatedIndicators.macd.histogram.map((value, index) => ({
          time: data[index + (data.length - calculatedIndicators.macd.histogram.length)].time,
          value: value,
          color: value >= 0 ? '#10b981' : '#ef4444',
        }));
        macdSeries.setData(macdData);
        indicatorSeriesRef.current.macd = macdSeries;
      }
    }

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
  }, [data, height, showVolume, type, indicators]);

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
