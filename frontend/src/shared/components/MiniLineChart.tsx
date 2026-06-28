import React, { useMemo } from 'react';

interface TransactionItem {
  amount: number;
  date: string;
}

interface MiniLineChartProps {
  transactions: TransactionItem[];
  createdAt: string;
  currentAccumulated: number;
}

interface Point {
  date: Date;
  value: number;
}

// ==========================================
// HELPERS
// ==========================================

/** Parse a date string safely. Handles ISO 8601 with 'T' and YYYY-MM-DD. */
function parseDate(dateStr: string): Date {
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ==========================================
// ALGORITHM — buildDataPoints
// ==========================================

function buildDataPoints({
  transactions,
  createdAt,
  currentAccumulated,
}: MiniLineChartProps): Point[] {
  const createdDate = parseDate(createdAt);
  const today = new Date();

  // 1. Start point: { date: createdAt, value: 0 }
  const points: Point[] = [{ date: createdDate, value: 0 }];

  // 2. Sort transactions chronologically (oldest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );

  // 3-4. Running total + point for each individual transaction (no daily grouping)
  let runningTotal = 0;
  for (const txn of sortedTransactions) {
    runningTotal += txn.amount;
    points.push({ date: parseDate(txn.date), value: runningTotal });
  }

  // 5. End point: today with current accumulated value
  points.push({ date: today, value: currentAccumulated });

  // 6. If data spans more than 3 months, filter to last 3 months
  const minPointDate = points[0].date;
  const maxPointDate = points[points.length - 1].date;
  const spanMs = maxPointDate.getTime() - minPointDate.getTime();
  const threeMonthsMs = 3 * 30 * 24 * 60 * 60 * 1000; // ~90 days

  if (spanMs > threeMonthsMs) {
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const filtered = points.filter((p) => p.date >= threeMonthsAgo);

    // Ensure at least 2 points for a visible line
    if (filtered.length >= 2) {
      return filtered;
    }

    if (filtered.length === 0) {
      // Extremely unlikely: nothing in last 3 months (today always is)
      return [
        { date: threeMonthsAgo, value: currentAccumulated },
        { date: today, value: currentAccumulated },
      ];
    }

    // Exactly 1 point (should be today) → add a start point
    return [
      { date: threeMonthsAgo, value: filtered[0].value },
      { date: today, value: filtered[0].value },
    ];
  }

  // 8. Data fits within 3 months → return all points
  return points;
}

// ==========================================
// SVG CONSTANTS
// ==========================================

const WIDTH = 280;
const HEIGHT = 44;
const PADDING = { top: 6, right: 8, bottom: 8, left: 8 };
const CHART_W = WIDTH - PADDING.left - PADDING.right;
const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

// ==========================================
// COMPONENT
// ==========================================

const MiniLineChart: React.FC<MiniLineChartProps> = (props) => {
  const dataPoints = useMemo(() => buildDataPoints(props), [props]);

  if (dataPoints.length < 2) return null;

  // --- Scale domains ---
  let minDate = dataPoints[0].date;
  let maxDate = dataPoints[dataPoints.length - 1].date;

  // Guard: prevent division by zero in xScale (all points same date)
  const timeSpan = maxDate.getTime() - minDate.getTime();
  if (timeSpan === 0) {
    // Artificially extend to ±30 seconds to group points horizontally
    minDate = new Date(minDate.getTime() - 30 * 1000);
    maxDate = new Date(maxDate.getTime() + 30 * 1000);
  }

  let minValue = Math.min(...dataPoints.map((p) => p.value));
  let maxValue = Math.max(...dataPoints.map((p) => p.value));
  const valueRange = maxValue - minValue;

  if (valueRange === 0) {
    // Flat line — center the actual value vertically in the chart
    const actualValue = minValue;
    const padding = Math.max(Math.abs(actualValue) * 0.5, 50);
    minValue = actualValue - padding;
    maxValue = actualValue + padding;
  } else {
    // Add 10% padding above and below (clamped to 0)
    const padding = valueRange * 0.1;
    minValue = Math.max(0, minValue - padding);
    maxValue = maxValue + padding;
  }



  // --- Scale functions ---
  const xScale = (index: number): number => {
    const count = dataPoints.length;
    if (count <= 1) return PADDING.left;
    return PADDING.left + (index / (count - 1)) * CHART_W;
  };

  const yScale = (value: number): number => {
    return (
      HEIGHT -
      PADDING.bottom -
      ((value - minValue) / (maxValue - minValue)) * CHART_H
    );
  };

  // --- Polyline points string ---
  const pointsStr = dataPoints
    .map(
      (p, index) => `${xScale(index).toFixed(1)},${yScale(p.value).toFixed(1)}`
    )
    .join(' ');

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >

        {/* --- Area fill below the line --- */}
        <polygon
          points={`${PADDING.left},${HEIGHT - PADDING.bottom} ${pointsStr} ${WIDTH - PADDING.right},${HEIGHT - PADDING.bottom}`}
          className="fill-green-500/15 dark:fill-green-400/15"
        />

        {/* --- Main polyline --- */}
        <polyline
          points={pointsStr}
          fill="none"
          className="text-green-500 dark:text-green-400"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default React.memo(MiniLineChart);
