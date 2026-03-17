import type { DisplayCurrency } from '../types';

interface Props {
  currency: DisplayCurrency;
  onChange: (c: DisplayCurrency) => void;
}

export function CurrencyToggle({ currency, onChange }: Props) {
  return (
    <div className="currency-toggle">
      <button
        className={currency === 'USD' ? 'active' : ''}
        onClick={() => onChange('USD')}
      >
        USD $
      </button>
      <button
        className={currency === 'ILS' ? 'active' : ''}
        onClick={() => onChange('ILS')}
      >
        NIS ₪
      </button>
    </div>
  );
}
