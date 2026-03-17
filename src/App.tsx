import { useState, useEffect, useCallback } from 'react';
import type { Holding, DisplayCurrency, PortfolioItem, ExchangeRate } from './types';
import { fetchHoldings } from './api/sheets';
import { fetchAllPrices } from './api/prices';
import { Dashboard } from './components/Dashboard';
import { HoldingsTable } from './components/HoldingsTable';
import { CurrencyToggle } from './components/CurrencyToggle';
import { SetupScreen } from './components/SetupScreen';
import './App.css';

const SHEET_URL_KEY = 'finance_sheet_url';
const THEME_KEY = 'finance_theme';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getSheetUrlFromParams(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('csv') || params.get('sheet');
}

type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
}

function App() {
  const [sheetUrl, setSheetUrl] = useState<string | null>(
    () => getSheetUrlFromParams() || localStorage.getItem(SHEET_URL_KEY)
  );
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({
    usdToNis: 3.6,
    asOf: 'loading',
  });
  const [currency, setCurrency] = useState<DisplayCurrency>('ILS');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) || 'system'
  );

  // Persist URL-param sheet URL to localStorage
  useEffect(() => {
    const paramUrl = getSheetUrlFromParams();
    if (paramUrl) {
      localStorage.setItem(SHEET_URL_KEY, paramUrl);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const cycleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : t === 'light' ? 'system' : 'dark'));
  };

  const handleSaveUrl = (url: string) => {
    localStorage.setItem(SHEET_URL_KEY, url);
    setSheetUrl(url);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(SHEET_URL_KEY);
    setSheetUrl(null);
    setHoldings([]);
    setItems([]);
  };

  const loadData = useCallback(async () => {
    if (!sheetUrl) return;

    setLoading(true);
    setErrors([]);

    try {
      const h = await fetchHoldings(sheetUrl);
      setHoldings(h);

      const result = await fetchAllPrices(h);
      setItems(result.items);
      setExchangeRate(result.exchangeRate);
      setErrors(result.errors);
      setLastRefresh(new Date());
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to load data']);
    } finally {
      setLoading(false);
    }
  }, [sheetUrl]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!sheetUrl) {
    return <SetupScreen onSave={handleSaveUrl} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Finance Overview</h1>
        <div className="header-actions">
          <CurrencyToggle currency={currency} onChange={setCurrency} />
          <button className="btn-theme" onClick={cycleTheme} title={`Theme: ${theme}`}>
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '⚙️'}
          </button>
          <button className="btn-refresh" onClick={loadData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn-disconnect" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="error-banner">
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="loading">Loading portfolio data...</div>
      ) : (
        <>
          <Dashboard
            items={items}
            exchangeRate={exchangeRate}
            currency={currency}
          />
          <HoldingsTable items={items} currency={currency} />
        </>
      )}

      <footer className="app-footer">
        {lastRefresh && (
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        )}
        <span>{holdings.length} holdings</span>
      </footer>
    </div>
  );
}

export default App;
