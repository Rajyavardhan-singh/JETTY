/**
 * CurrencyWidget — Client Component
 * Fetches USD→INR, EUR→INR, USD→EUR from the open exchangerate-api.
 * Caches in localStorage for 60 minutes so the currency converter page can reuse it.
 * On the home page we only display the USD→INR rate.
 */
"use client";

import { useEffect, useState } from "react";
import styles from "./CurrencyWidget.module.css";

const CACHE_KEY = "jetty_fx_rates";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface FxRates {
  USD_INR: number;
  EUR_INR: number;
  USD_EUR: number;
  fetchedAt: number;
}

async function fetchRates(): Promise<FxRates | null> {
  try {
    // Free, no-auth API — returns base currency rates
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rates: FxRates = {
      USD_INR: data.rates.INR,
      EUR_INR: data.rates.INR / data.rates.EUR,  // cross rate
      USD_EUR: data.rates.EUR,
      fetchedAt: Date.now(),
    };
    // Store in localStorage for the currency converter page
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(rates)); } catch {}
    return rates;
  } catch {
    return null;
  }
}

function getCached(): FxRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: FxRates = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

export default function CurrencyWidget() {
  const [rates, setRates] = useState<FxRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setRates(cached);
      setLoading(false);
      return;
    }
    fetchRates().then(r => {
      setRates(r);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className={styles.widget}>
        <div className={styles.label}>USD → INR</div>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (!rates) return null;

  return (
    <div className={styles.widget}>
      <div className={styles.label}>USD → INR</div>
      <div className={styles.rate}>₹{rates.USD_INR.toFixed(2)}</div>
      <div className={styles.sub}>per 1 US Dollar</div>
    </div>
  );
}
