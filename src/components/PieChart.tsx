import { useState } from 'react';
import type { PortfolioItem, DisplayCurrency } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  items: PortfolioItem[];
  currency: DisplayCurrency;
}

interface GroupData {
  group: string;
  totalUSD: number;
  totalNIS: number;
  count: number;
}

const COLORS = [
  '#4f8ff7', // blue
  '#34d399', // green
  '#fb923c', // orange
  '#c084fc', // purple
  '#fbbf24', // yellow
  '#f87171', // red
  '#38bdf8', // sky
  '#94a3b8', // slate
];

export function PieChart({ items, currency }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Aggregate by group
  const groupMap = new Map<string, GroupData>();
  for (const item of items) {
    const key = item.holding.group;
    const usd = item.totalValueUSD ?? 0;
    const nis = item.totalValueNIS ?? 0;
    const existing = groupMap.get(key);
    if (existing) {
      existing.totalUSD += usd;
      existing.totalNIS += nis;
      existing.count++;
    } else {
      groupMap.set(key, { group: key, totalUSD: usd, totalNIS: nis, count: 1 });
    }
  }

  const groups = Array.from(groupMap.values())
    .filter(g => {
      const val = currency === 'USD' ? g.totalUSD : g.totalNIS;
      return val > 0;
    })
    .sort((a, b) => {
      const aVal = currency === 'USD' ? a.totalUSD : a.totalNIS;
      const bVal = currency === 'USD' ? b.totalUSD : b.totalNIS;
      return bVal - aVal;
    });

  const total = groups.reduce(
    (sum, g) => sum + (currency === 'USD' ? g.totalUSD : g.totalNIS),
    0
  );

  if (total === 0) return null;

  // SVG donut chart params
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 70;
  const strokeWidth = 36;
  const circumference = 2 * Math.PI * radius;

  // Calculate slices
  let cumulativeOffset = 0;
  const slices = groups.map((g, i) => {
    const value = currency === 'USD' ? g.totalUSD : g.totalNIS;
    const pct = value / total;
    const dashLength = pct * circumference;
    const offset = -cumulativeOffset + circumference / 4; // start from top
    cumulativeOffset += dashLength;

    return {
      ...g,
      value,
      pct,
      color: COLORS[i % COLORS.length],
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: offset,
    };
  });

  return (
    <div className="pie-chart-section">
      <div className="pie-chart-container">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="pie-chart-svg"
        >
          {slices.map((slice, i) => (
            <circle
              key={slice.group}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={slice.dashArray}
              strokeDashoffset={slice.dashOffset}
              opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.3}
              style={{ transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
          {/* Center text */}
          {hoveredIndex !== null ? (
            <>
              <text x={cx} y={cy - 6} textAnchor="middle" className="pie-center-label">
                {slices[hoveredIndex].group}
              </text>
              <text x={cx} y={cy + 14} textAnchor="middle" className="pie-center-value">
                {(slices[hoveredIndex].pct * 100).toFixed(1)}%
              </text>
            </>
          ) : (
            <text x={cx} y={cy + 5} textAnchor="middle" className="pie-center-total">
              {formatCurrency(total, currency)}
            </text>
          )}
        </svg>
      </div>

      <div className="pie-legend">
        {slices.map((slice, i) => (
          <div
            key={slice.group}
            className={`pie-legend-item ${hoveredIndex === i ? 'active' : ''}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="pie-legend-dot" style={{ background: slice.color }} />
            <span className="pie-legend-label">{slice.group}</span>
            <span className="pie-legend-value">
              {formatCurrency(slice.value, currency)}
            </span>
            <span className="pie-legend-pct">
              {(slice.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
