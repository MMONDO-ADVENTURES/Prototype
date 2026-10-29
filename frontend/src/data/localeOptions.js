export const LANGUAGES = [
  { code: "en", native: "English" },
  { code: "lg", native: "Luganda" },
  { code: "sw", native: "Kiswahili" },
  { code: "fr", native: "Français" },
  { code: "de", native: "Deutsch" },
  { code: "es", native: "Español" },
  { code: "zh", native: "中文" },
];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1, digits: 0 },
  { code: "UGX", symbol: "UGX ", name: "Ugandan Shilling", rate: 3700, digits: 0 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92, digits: 0 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79, digits: 0 },
  { code: "KES", symbol: "KES ", name: "Kenyan Shilling", rate: 129, digits: 0 },
  { code: "TZS", symbol: "TZS ", name: "Tanzanian Shilling", rate: 2500, digits: 0 },
  { code: "RWF", symbol: "RWF ", name: "Rwandan Franc", rate: 1290, digits: 0 },
  { code: "ZAR", symbol: "R", name: "South African Rand", rate: 18.2, digits: 0 },
  { code: "AED", symbol: "AED ", name: "UAE Dirham", rate: 3.67, digits: 0 },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", rate: 1.36, digits: 0 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.53, digits: 0 },
  { code: "CHF", symbol: "CHF ", name: "Swiss Franc", rate: 0.88, digits: 0 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 7.24, digits: 0 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.5, digits: 0 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 149, digits: 0 },
];

export const LANGUAGE_CODES = new Set(LANGUAGES.map((item) => item.code));
export const CURRENCY_BY_CODE = Object.fromEntries(CURRENCIES.map((item) => [item.code, item]));

export function convertFromUsd(amount, currencyCode) {
  const currency = CURRENCY_BY_CODE[currencyCode] || CURRENCY_BY_CODE.USD;
  return Number(amount || 0) * currency.rate;
}

export function formatConverted(amountUsd, currencyCode, digits) {
  const currency = CURRENCY_BY_CODE[currencyCode] || CURRENCY_BY_CODE.USD;
  const places = digits ?? currency.digits;
  const value = convertFromUsd(amountUsd, currency.code);
  const number = Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
  return `${currency.symbol}${number}`;
}
