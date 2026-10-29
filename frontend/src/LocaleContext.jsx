import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CURRENCY_BY_CODE, CURRENCIES, LANGUAGE_CODES, formatConverted } from "./data/localeOptions";
import { translate } from "./i18n";

const STORAGE_LANGUAGE = "mmondo_language";
const STORAGE_CURRENCY = "mmondo_currency";

const LocaleContext = createContext(null);

function readStored(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value && allowed.has(value)) return value;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function LocaleProvider({ children }) {
  const [language, setLanguageState] = useState(() => readStored(STORAGE_LANGUAGE, LANGUAGE_CODES, "en"));
  const [currency, setCurrencyState] = useState(() =>
    readStored(STORAGE_CURRENCY, new Set(CURRENCIES.map((item) => item.code)), "USD")
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next) => {
    const code = LANGUAGE_CODES.has(next) ? next : "en";
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_LANGUAGE, code);
    } catch {
      /* ignore */
    }
  }, []);

  const setCurrency = useCallback((next) => {
    const code = CURRENCY_BY_CODE[next] ? next : "USD";
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_CURRENCY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key) => translate(language, key), [language]);

  const formatPrice = useCallback(
    (amountUsd, digits) => formatConverted(amountUsd, currency, digits),
    [currency]
  );

  const value = useMemo(
    () => ({
      language,
      currency,
      setLanguage,
      setCurrency,
      t,
      formatPrice,
    }),
    [language, currency, setLanguage, setCurrency, t, formatPrice]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
