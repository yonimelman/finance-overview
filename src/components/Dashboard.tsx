import type { PortfolioItem, DisplayCurrency, ExchangeRate } from '../types';
import { formatCurrency } from '../utils/format';
import { PieChart } from './PieChart';

function isToday(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

function ExchangeRateLabel({ exchangeRate }: { exchangeRate: ExchangeRate }) {
  if (exchangeRate.asOf === 'loading') {
    return <div className="exchange-rate">Loading exchange rate...</div>;
  }

  const isFallback = exchangeRate.asOf === 'fallback';
  const stale = isFallback || !isToday(exchangeRate.asOf);
  const dateLabel = isFallback
    ? 'cached'
    : new Date(exchangeRate.asOf).toLocaleDateString();

  return (
    <div className={`exchange-rate${stale ? ' exchange-rate-stale' : ''}`}>
      1 USD = {exchangeRate.usdToNis.toFixed(2)} NIS
      <span className="rate-date"> ({dateLabel})</span>
    </div>
  );
}

interface Props {
  items: PortfolioItem[];
  exchangeRate: ExchangeRate;
  currency: DisplayCurrency;
}

interface GroupSummary {
  group: string;
  totalUSD: number;
  totalNIS: number;
  count: number;
}

export function Dashboard({ items, exchangeRate, currency }: Props) {
  let totalUSD = 0;
  let totalNIS = 0;
  const byGroup = new Map<string, GroupSummary>();

  for (const item of items) {
    const usd = item.totalValueUSD ?? 0;
    const nis = item.totalValueNIS ?? 0;
    totalUSD += usd;
    totalNIS += nis;

    const key = item.holding.group;
    const existing = byGroup.get(key);
    if (existing) {
      existing.totalUSD += usd;
      existing.totalNIS += nis;
      existing.count++;
    } else {
      byGroup.set(key, {
        group: key,
        totalUSD: usd,
        totalNIS: nis,
        count: 1,
      });
    }
  }

  const totalDisplay = currency === 'USD' ? totalUSD : totalNIS;
  const groups = Array.from(byGroup.values()).sort((a, b) => {
    const aVal = currency === 'USD' ? a.totalUSD : a.totalNIS;
    const bVal = currency === 'USD' ? b.totalUSD : b.totalNIS;
    return bVal - aVal;
  });

  return (
    <div className="dashboard">
      <div className="total-card">
        <div className="total-label">Total Portfolio</div>
        <div className="total-value">{formatCurrency(totalDisplay, currency)}</div>
        <div className="total-secondary">
          {currency === 'USD'
            ? formatCurrency(totalNIS, 'ILS')
            : formatCurrency(totalUSD, 'USD')}
        </div>
        <ExchangeRateLabel exchangeRate={exchangeRate} />
      </div>

      <PieChart items={items} currency={currency} />

      <div className="category-cards">
        {groups.map((g) => {
          const gTotal = currency === 'USD' ? g.totalUSD : g.totalNIS;
          const pct = totalDisplay > 0 ? (gTotal / totalDisplay) * 100 : 0;
          return (
            <div key={g.group} className="category-card">
              <div className="category-label">{g.group}</div>
              <div className="category-value">
                {formatCurrency(gTotal, currency)}
              </div>
              <div className="category-meta">
                {g.count} holding{g.count !== 1 ? 's' : ''} &middot; {pct.toFixed(1)}%
              </div>
              <div className="category-bar">
                <div className="category-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
