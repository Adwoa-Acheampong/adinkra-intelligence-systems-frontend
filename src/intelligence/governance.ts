export const CONFIDENCE_POLICY = {
  high: { minimum: 90, meaning: 'Suitable for the registered decision when access and freshness also pass.' },
  review: { minimum: 70, meaning: 'Visible with cause and reduced-confidence contributors; human review required.' },
  restricted: { minimum: 0, meaning: 'Aggregate visibility and source-record access are evaluated separately.' },
} as const;

export const CURRENCY_POLICY = {
  baseCurrency: 'USD',
  operationalCurrencies: ['GHS', 'NGN', 'KES', 'ZAR', 'USD'],
  rule: 'Store the original amount and currency; aggregate only with a registered rate, provider, effective time and reproducible as-of state.',
} as const;

export const UNIT_POLICY = {
  rule: 'Store original unit, canonical unit and conversion factor. Never sum incompatible units.',
  canonical: {
    currency: 'minor units plus ISO 4217 code',
    mass: 'kilogram',
    distance: 'kilometre',
    duration: 'second',
    quantity: 'domain-defined accepted unit',
  },
} as const;
