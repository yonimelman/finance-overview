import { useState } from 'react';

interface Props {
  onSave: (url: string) => void;
}

export function SetupScreen({ onSave }: Props) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSave(url.trim());
    }
  };

  return (
    <div className="setup-screen">
      <h1>Finance Overview</h1>
      <p>Connect your Google Sheet to get started.</p>

      <div className="setup-instructions">
        <h3>Setup Instructions</h3>
        <ol>
          <li>
            Create a Google Sheet with these columns:
            <code>source | id | name | units | currency | manual_value | manual_date | group</code>
          </li>
          <li>
            Go to <strong>File &rarr; Share &rarr; Publish to web</strong>
          </li>
          <li>
            Select the sheet tab and choose <strong>CSV</strong> format
          </li>
          <li>Click Publish and copy the URL</li>
        </ol>

        <details>
          <summary>Column reference</summary>
          <table className="setup-table">
            <thead>
              <tr><th>source</th><th>id</th><th>currency</th><th>group</th><th>Notes</th></tr>
            </thead>
            <tbody>
              <tr><td>stock</td><td>WIX, VWRA.L</td><td>USD</td><td>Stocks</td><td>Yahoo ticker</td></tr>
              <tr><td>tase_stock</td><td>IS-FF505.TA</td><td>ILA</td><td>Stocks</td><td>Yahoo TASE ticker (agorot)</td></tr>
              <tr><td>stonks</td><td>5117429</td><td>USD</td><td>Money Funds</td><td>Stonks repo ID</td></tr>
              <tr><td>crypto</td><td>bitcoin</td><td>USD</td><td>Crypto</td><td>CoinGecko ID</td></tr>
              <tr><td>education_fund</td><td>any-id</td><td>ILS</td><td>Education</td><td>Set manual_value</td></tr>
              <tr><td>cash</td><td>any-id</td><td>USD/ILS</td><td>Cash</td><td>units = amount</td></tr>
            </tbody>
          </table>
        </details>
      </div>

      <form onSubmit={handleSubmit} className="setup-form">
        <input
          type="url"
          placeholder="Paste your Google Sheets CSV URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit">Connect Sheet</button>
      </form>
    </div>
  );
}
