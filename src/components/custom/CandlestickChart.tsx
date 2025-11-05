"use client";

import { useEffect, useRef } from 'react';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function CandlestickChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Generate a single candle
    const generateCandle = (previousClose: number): Candle => {
      const time = Date.now();
      const open = previousClose;
      const changePercent = (Math.random() - 0.5) * 0.04;
      const close = open * (1 + changePercent);

      // Random wick length: 0% to 0.8% (shorter and more varied)
      const upperWickPercent = Math.random() * 0.008;
      const lowerWickPercent = Math.random() * 0.008;

      const high = Math.max(open, close) * (1 + upperWickPercent);
      const low = Math.min(open, close) * (1 - lowerWickPercent);

      return { time, open, high, low, close };
    };

    // Calculate EMA
    const calculateEMA = (data: number[], period: number): number[] => {
      const k = 2 / (period + 1);
      const emaData: number[] = [];
      emaData[0] = data[0];

      for (let i = 1; i < data.length; i++) {
        emaData[i] = data[i] * k + emaData[i - 1] * (1 - k);
      }

      return emaData;
    };

    // Calculate CCI (Commodity Channel Index)
    const calculateCCI = (candles: Candle[], period: number): number[] => {
      const cciData: number[] = [];

      for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) {
          cciData[i] = 0;
          continue;
        }

        // Calculate Typical Price for the period
        const typicalPrices: number[] = [];
        for (let j = i - period + 1; j <= i; j++) {
          const tp = (candles[j].high + candles[j].low + candles[j].close) / 3;
          typicalPrices.push(tp);
        }

        // Calculate SMA of Typical Price
        const smaTP = typicalPrices.reduce((a, b) => a + b, 0) / period;

        // Calculate Mean Deviation
        let meanDeviation = 0;
        for (let j = 0; j < typicalPrices.length; j++) {
          meanDeviation += Math.abs(typicalPrices[j] - smaTP);
        }
        meanDeviation /= period;

        // Calculate CCI
        const currentTP = (candles[i].high + candles[i].low + candles[i].close) / 3;
        if (meanDeviation !== 0) {
          cciData[i] = (currentTP - smaTP) / (0.015 * meanDeviation);
        } else {
          cciData[i] = 0;
        }
      }

      return cciData;
    };

    // Get candle color based on CCI (NS Indicator logic)
    const getCandleColor = (cci1: number, cci2: number, isBullish: boolean): { body: string; wick: string; hollow: boolean } => {
      // Sensitivity = 1 (default): CCI1 period = 7, CCI2 period = 49

      if (cci1 >= 0 && cci2 >= 0) {
        // Strong uptrend - Black border, hollow
        return { body: 'rgba(0, 0, 0, 1)', wick: 'rgba(0, 0, 0, 1)', hollow: true };
      } else if (cci1 < 0 && cci2 >= 0) {
        // Weak/warning - Light gray, bullish candles hollow
        return { body: 'rgba(180, 180, 180, 1)', wick: 'rgba(180, 180, 180, 1)', hollow: isBullish };
      } else if (cci1 < 0 && cci2 < 0) {
        // Strong downtrend - Black, filled
        return { body: 'rgba(0, 0, 0, 1)', wick: 'rgba(0, 0, 0, 1)', hollow: false };
      } else { // cci1 > 0 && cci2 < 0
        // Bounce/weak - Light gray, bullish candles hollow
        return { body: 'rgba(180, 180, 180, 1)', wick: 'rgba(180, 180, 180, 1)', hollow: isBullish };
      }
    };

    // Calculate Simple Moving Average (SMA)
    const calculateSMA = (data: number[], period: number): number[] => {
      const smaData: number[] = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          smaData[i] = data[i]; // Not enough data yet
        } else {
          const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
          smaData[i] = sum / period;
        }
      }
      return smaData;
    };

    // Calculate ATR (Average True Range)
    const calculateATR = (candles: Candle[], period: number): number[] => {
      const atrData: number[] = [];
      const trueRanges: number[] = [];

      for (let i = 0; i < candles.length; i++) {
        if (i === 0) {
          trueRanges[i] = candles[i].high - candles[i].low;
        } else {
          const tr1 = candles[i].high - candles[i].low;
          const tr2 = Math.abs(candles[i].high - candles[i - 1].close);
          const tr3 = Math.abs(candles[i].low - candles[i - 1].close);
          trueRanges[i] = Math.max(tr1, tr2, tr3);
        }
      }

      // Calculate ATR using SMA of true ranges
      for (let i = 0; i < trueRanges.length; i++) {
        if (i < period - 1) {
          atrData[i] = trueRanges[i];
        } else {
          const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
          atrData[i] = sum / period;
        }
      }

      return atrData;
    };

    // Calculate Keltner Channel
    const calculateKeltnerChannel = (candles: Candle[], period: number, atrMultiplier: number): { middle: number[], upper: number[], lower: number[] } => {
      const closes = candles.map(c => c.close);
      const middle = calculateSMA(closes, period);
      const atr = calculateATR(candles, period);

      const upper = middle.map((m, i) => m + atr[i] * atrMultiplier);
      const lower = middle.map((m, i) => m - atr[i] * atrMultiplier);

      return { middle, upper, lower };
    };

    // Calculate ZigZag indicator
    const calculateZigZag = (candles: Candle[], depth: number): Array<{ index: number; price: number; type: 'high' | 'low' }> => {
      if (candles.length < depth) return [];

      const zigzagPoints: Array<{ index: number; price: number; type: 'high' | 'low' }> = [];
      let lastHighIndex = 0;
      let lastLowIndex = 0;
      let lastHigh = candles[0].high;
      let lastLow = candles[0].low;
      let searchingForHigh = true;

      for (let i = 0; i < candles.length; i++) {
        if (searchingForHigh) {
          if (candles[i].high > lastHigh) {
            lastHigh = candles[i].high;
            lastHighIndex = i;
          }
          // Check if we found a significant low
          if (lastHigh - candles[i].low >= depth * 0.01) {
            zigzagPoints.push({ index: lastHighIndex, price: lastHigh, type: 'high' });
            lastLow = candles[i].low;
            lastLowIndex = i;
            searchingForHigh = false;
          }
        } else {
          if (candles[i].low < lastLow) {
            lastLow = candles[i].low;
            lastLowIndex = i;
          }
          // Check if we found a significant high
          if (candles[i].high - lastLow >= depth * 0.01) {
            zigzagPoints.push({ index: lastLowIndex, price: lastLow, type: 'low' });
            lastHigh = candles[i].high;
            lastHighIndex = i;
            searchingForHigh = true;
          }
        }
      }

      return zigzagPoints;
    };

    // Initialize
    let candles: Candle[] = [];
    let lastPrice = 1000;
    let currentBidPrice = lastPrice - 0.3; // Bid price (买价) = lower
    let currentAskPrice = lastPrice + 0.3; // Ask price (卖价) = higher
    const candleWidth = 10;
    const candleSpacing = 14;

    let animationId: number;
    let lastCandleTime = Date.now();
    const candleInterval = 150;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Add new candle
      const now = Date.now();
      if (now - lastCandleTime >= candleInterval) {
        const newCandle = generateCandle(lastPrice);
        candles.push(newCandle);
        lastPrice = newCandle.close;
        const spread = 0.3 + Math.random() * 0.4;
        currentBidPrice = lastPrice - spread / 2; // Bid = lower than mid price
        currentAskPrice = lastPrice + spread / 2; // Ask = higher than mid price
        lastCandleTime = now;
      }

      // Reserve space on the right to see new candles appearing (subtract 5 candles worth of space)
      const maxCandles = Math.floor(rect.width / candleSpacing) - 5;
      if (candles.length > maxCandles) {
        candles.shift();
      }

      if (candles.length === 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Calculate price range
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      candles.forEach(candle => {
        minPrice = Math.min(minPrice, candle.low);
        maxPrice = Math.max(maxPrice, candle.high);
      });

      minPrice = Math.min(minPrice, currentAskPrice - 5);
      maxPrice = Math.max(maxPrice, currentBidPrice + 5);

      const priceRange = maxPrice - minPrice;
      const padding = { top: 0, bottom: 0, left: 0, right: 0 };
      const chartHeight = rect.height - padding.top - padding.bottom;

      // Calculate CCI for NS indicator (Sensitivity = 1)
      const cci1 = candles.length >= 7 ? calculateCCI(candles, 7) : [];
      const cci2 = candles.length >= 49 ? calculateCCI(candles, 49) : [];

      // Draw vertical grid lines
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < candles.length; i += 10) {
        const x = i * candleSpacing + candleWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }

      // Draw horizontal grid lines
      for (let i = 0; i <= 8; i++) {
        const y = padding.top + (chartHeight / 8) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      // Draw candles with NS indicator colors
      candles.forEach((candle, index) => {
        const x = index * candleSpacing + candleWidth / 2;

        const highY = padding.top + ((maxPrice - candle.high) / priceRange) * chartHeight;
        const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * chartHeight;
        const openY = padding.top + ((maxPrice - candle.open) / priceRange) * chartHeight;
        const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * chartHeight;
        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

        // Determine if bullish (阳线) or bearish (阴线)
        const isBullish = candle.close > candle.open;

        // Get CCI-based color for this candle
        const currentCCI1 = cci1[index] || 0;
        const currentCCI2 = cci2[index] || 0;
        const candleColor = getCandleColor(currentCCI1, currentCCI2, isBullish);

        // Draw wick with CCI color
        ctx.strokeStyle = candleColor.wick;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw body with CCI color
        if (candleColor.hollow) {
          // Hollow candle (空心)
          // First fill with background color to hide the wick
          ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // White background
          ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
          // Then draw the border
          ctx.strokeStyle = candleColor.body;
          ctx.lineWidth = 2;
          ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        } else {
          // Filled candle (实心)
          ctx.fillStyle = candleColor.body;
          ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        }
      });

      // Draw ask price line (卖价 - red, higher price)
      const askY = padding.top + ((maxPrice - currentAskPrice) / priceRange) * chartHeight;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red - Ask (higher)
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(0, askY);
      ctx.lineTo(rect.width, askY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw bid price line (买价 - green, lower price)
      const bidY = padding.top + ((maxPrice - currentBidPrice) / priceRange) * chartHeight;
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; // Green - Bid (lower)
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(0, bidY);
      ctx.lineTo(rect.width, bidY);
      ctx.stroke();
      ctx.setLineDash([]);

      // EMA20 line removed per user request

      // Draw Keltner Channel (MA20, ATR multiplier 0.3, purple 1px)
      if (candles.length >= 20) {
        const keltner = calculateKeltnerChannel(candles, 20, 0.3);

        // Draw upper band
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.8)'; // Purple
        ctx.lineWidth = 1;
        ctx.beginPath();
        keltner.upper.forEach((value, index) => {
          const x = index * candleSpacing + candleWidth / 2;
          const y = padding.top + ((maxPrice - value) / priceRange) * chartHeight;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Draw middle line (MA20)
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.8)'; // Purple
        ctx.lineWidth = 1;
        ctx.beginPath();
        keltner.middle.forEach((value, index) => {
          const x = index * candleSpacing + candleWidth / 2;
          const y = padding.top + ((maxPrice - value) / priceRange) * chartHeight;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Draw lower band
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.8)'; // Purple
        ctx.lineWidth = 1;
        ctx.beginPath();
        keltner.lower.forEach((value, index) => {
          const x = index * candleSpacing + candleWidth / 2;
          const y = padding.top + ((maxPrice - value) / priceRange) * chartHeight;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      }

      // ZigZag indicator removed per user request

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <div className="w-full h-full">
      {/* K-line chart with 3D tilt and floating animation */}
      <div
        className="w-full h-full animate-float-3d"
        style={{
          transform: 'perspective(800px) rotateX(5deg) rotateY(-3deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'transparent' }}
        />
      </div>

      <style jsx>{`
        @keyframes float-3d {
          0%, 100% {
            transform: perspective(800px) rotateX(5deg) rotateY(-3deg) translateZ(0px) translateY(0px);
          }
          25% {
            transform: perspective(800px) rotateX(4deg) rotateY(-2deg) translateZ(8px) translateY(-3px);
          }
          50% {
            transform: perspective(800px) rotateX(6deg) rotateY(-4deg) translateZ(12px) translateY(2px);
          }
          75% {
            transform: perspective(800px) rotateX(5deg) rotateY(-2.5deg) translateZ(6px) translateY(-2px);
          }
        }

        .animate-float-3d {
          animation: float-3d 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
