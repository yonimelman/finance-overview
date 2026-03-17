import { useState, useMemo } from 'react';
import type { PortfolioItem, DisplayCurrency } from '../types';
import { formatCurrency, formatNumber } from '../utils/format';

type SortField = 'name' | 'group' | 'value';
type SortDirection = 'asc' | 'desc';

interface Props {
  items: PortfolioItem[];
  currency: DisplayCurrency;
}

export function HoldingsTable({ items, currency }: Props) {
  const [sortField, setSortField] = useState<SortField>('group');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'value' ? 'desc' : 'asc');
    }
  };

  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.holding.name.localeCompare(b.holding.name);
          break;
        case 'group':
          cmp = a.holding.group.localeCompare(b.holding.group)
            || a.holding.name.localeCompare(b.holding.name);
          break;
        case 'value': {
          const aVal = currency === 'USD' ? a.totalValueUSD : a.totalValueNIS;
          const bVal = currency === 'USD' ? b.totalValueUSD : b.totalValueNIS;
          cmp = (aVal ?? 0) - (bVal ?? 0);
          break;
        }
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [items, sortField, sortDirection, currency]);

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div className="holdings-table-wrapper">
      <table className="holdings-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleSort('name')}>
              Name{sortIndicator('name')}
            </th>
            <th className="sortable" onClick={() => handleSort('group')}>
              Group{sortIndicator('group')}
            </th>
            <th className="num">Units</th>
            <th className="num">Price ({currency === 'USD' ? '$' : '₪'})</th>
            <th className="num sortable" onClick={() => handleSort('value')}>
              Value ({currency === 'USD' ? '$' : '₪'}){sortIndicator('value')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => {
            const value = currency === 'USD'
              ? item.totalValueUSD
              : item.totalValueNIS;

            const showPrice = item.holding.type !== 'cash' && item.holding.type !== 'education_fund';
            const pricePerUnit = showPrice && value !== null && item.holding.units > 0
              ? value / item.holding.units
              : null;

            return (
              <tr key={item.holding.id} className={item.error ? 'row-error' : ''}>
                <td>
                  <div className="holding-name">{item.holding.name}</div>
                  <div className="holding-id">{item.holding.id}</div>
                </td>
                <td>
                  <span className="group-label">{item.holding.group}</span>
                </td>
                <td className="num">{item.holding.manualValue != null ? '—' : formatNumber(item.holding.units)}</td>
                <td className="num">
                  {pricePerUnit !== null
                    ? formatCurrency(pricePerUnit, currency, true)
                    : '—'}
                </td>
                <td className="num">
                  {item.error && !item.totalValueUSD ? (
                    <span className="error-text" title={item.error}>Error</span>
                  ) : (
                    <>
                      {formatCurrency(value, currency)}
                      {item.holding.manualDate && (
                        <div className="value-date">as of {item.holding.manualDate}</div>
                      )}
                      {item.error && item.totalValueUSD !== null && (
                        <div className="value-date value-stale">{item.error}</div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
