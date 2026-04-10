"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import styles from "./page.module.css";

const CACHE_KEY = "jetty_fx_rates";

const COMMON_CURRENCIES = [
  { code: "USD", name: "US Dollar", icon: "$" },
  { code: "INR", name: "Indian Rupee", icon: "₹" },
  { code: "EUR", name: "Euro", icon: "€" },
  { code: "GBP", name: "British Pound", icon: "£" },
  { code: "AUD", name: "Australian Dollar", icon: "A$" },
  { code: "CAD", name: "Canadian Dollar", icon: "C$" },
  { code: "SGD", name: "Singapore Dollar", icon: "S$" },
  { code: "AED", name: "Emirati Dirham", icon: "د.إ" },
  { code: "JPY", name: "Japanese Yen", icon: "¥" },
];

export default function CurrencyClient() {
  const [marketRates, setMarketRates] = useState<{ USD_INR?: number, EUR_INR?: number, USD_EUR?: number } | null>(null);

  // Converter States
  const [fromCurr, setFromCurr] = useState("USD");
  const [toCurr, setToCurr] = useState("INR");
  const [amount, setAmount] = useState<string>("1");

  // Core Rates Cache
  const [customRatesMap, setCustomRatesMap] = useState<Record<string, Record<string, number>>>({});

  // Manual Override State
  const [isManual, setIsManual] = useState(false);
  const [manualRate, setManualRate] = useState<string>("");

  // Dropdown States
  const [dropOpen, setDropOpen] = useState<"from" | "to" | null>(null);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Attempt to load from caching first.
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMarketRates({
          USD_INR: parsed.USD_INR,
          EUR_INR: parsed.EUR_INR,
          USD_EUR: parsed.USD_EUR
        });
      }
    } catch { }

    // Update real USD/INR live rate for the Hero card
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(res => res.json())
      .then(data => {
        setMarketRates(prev => ({
          ...prev,
          USD_INR: data.rates.INR,
          EUR_INR: data.rates.INR / data.rates.EUR,
          USD_EUR: data.rates.EUR
        }));
      })
      .catch();
  }, []);

  // Fetch exchange rate dynamically when currencies change (and not in manual mode)
  useEffect(() => {
    if (fromCurr === toCurr) return;

    // Check if we already have it temporarily
    if (customRatesMap[fromCurr] && customRatesMap[fromCurr][toCurr]) return;

    fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurr}`)
      .then(res => res.json())
      .then(data => {
        const rate = data.rates[toCurr];
        if (rate) {
          setCustomRatesMap(prev => ({
            ...prev,
            [fromCurr]: {
              ...(prev[fromCurr] || {}),
              [toCurr]: rate
            }
          }));
        }
      })
      .catch();
  }, [fromCurr, toCurr, customRatesMap]);

  // Derived current exchange rate
  const activeRate = useMemo(() => {
    if (isManual) {
      return parseFloat(manualRate) || 0;
    }
    if (fromCurr === toCurr) return 1;
    return customRatesMap[fromCurr]?.[toCurr] || 0;
  }, [isManual, manualRate, fromCurr, toCurr, customRatesMap]);

  const convertedAmount = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    return amt * activeRate;
  }, [amount, activeRate]);

  // Handle Swap
  const handleSwap = () => {
    setFromCurr(toCurr);
    setToCurr(fromCurr);
    // When swapping, manual rate should invert or clear? Typical UX: clear or invert.
    if (isManual) {
      const parsed = parseFloat(manualRate);
      if (parsed > 0) {
        setManualRate((1 / parsed).toFixed(4));
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropOpen(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredCurrencies = COMMON_CURRENCIES.filter(
    c => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Currency <span className={styles.titleHighlight}>Converter</span></h2>
          <p className={styles.subtitle}>
            <span className="msi msi-sm">anchor</span>
            Conversion Instrument & Cash Management
          </p>
        </div>
        {/* <div className={styles.statusCard}>
          <p className={styles.statusLabel}>System Status</p>
          <div className={styles.statusValue}>
            <div className={styles.statusDot}></div>
            Operational
          </div>
        </div> */}
      </header>

      <div className={styles.grid}>

        {/* Conversion Tool */}
        <section>
          <div className={styles.glassPanel}>
            <div className={styles.toolHeader}>
              <div className={styles.toolTitleWrapper}>
                <span className="msi msi-md" style={{ color: "var(--secondary)" }}>currency_exchange</span>
                <h3 className={styles.toolTitle}>Conversion Tool</h3>
              </div>

              <label className={styles.toggleLabel}>
                <div className={styles.switch}>
                  <input type="checkbox" checked={isManual} onChange={(e) => setIsManual(e.target.checked)} />
                  <span className={styles.slider}></span>
                </div>
                Manual Rate
              </label>
            </div>

            <div className={styles.pairGrid}>

              {/* FROM Dropdown */}
              <div className={styles.pairCol} ref={dropOpen === "from" ? dropdownRef : null}>
                <span className={styles.inputLabel}>From</span>
                <button className={styles.currencySelectBtn} onClick={() => { setDropOpen("from"); setSearch(""); }}>
                  <div className={styles.currencyIconBox}>
                    {COMMON_CURRENCIES.find(c => c.code === fromCurr)?.icon}
                  </div>
                  <div className={styles.currencyMeta}>
                    <div className={styles.currencyCode}>{fromCurr}</div>
                    <div className={styles.currencyName}>{COMMON_CURRENCIES.find(c => c.code === fromCurr)?.name || "Currency"}</div>
                  </div>
                  <span className="msi">expand_more</span>
                </button>

                {dropOpen === "from" && (
                  <div className={styles.dropdownAbsolute}>
                    <input
                      type="text"
                      autoFocus
                      className={styles.searchInput}
                      placeholder="Search currency..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <div className={styles.dropdownList}>
                      {filteredCurrencies.map(c => (
                        <div key={c.code} className={styles.dropdownItem} onClick={() => { setFromCurr(c.code); setDropOpen(null); }}>
                          <span className={styles.currencyCode}>{c.code}</span>
                          <span className={styles.currencyName}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SWAP */}
              <button className={styles.swapBtn} onClick={handleSwap}>
                <span className="msi">swap_horiz</span>
              </button>

              {/* TO Dropdown */}
              <div className={styles.pairCol} ref={dropOpen === "to" ? dropdownRef : null}>
                <span className={styles.inputLabel}>To</span>
                <button className={styles.currencySelectBtn} onClick={() => { setDropOpen("to"); setSearch(""); }}>
                  <div className={styles.currencyIconBox}>
                    {COMMON_CURRENCIES.find(c => c.code === toCurr)?.icon}
                  </div>
                  <div className={styles.currencyMeta}>
                    <div className={styles.currencyCode}>{toCurr}</div>
                    <div className={styles.currencyName}>{COMMON_CURRENCIES.find(c => c.code === toCurr)?.name || "Currency"}</div>
                  </div>
                  <span className="msi">expand_more</span>
                </button>

                {dropOpen === "to" && (
                  <div className={styles.dropdownAbsolute}>
                    <input
                      type="text"
                      autoFocus
                      className={styles.searchInput}
                      placeholder="Search currency..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <div className={styles.dropdownList}>
                      {filteredCurrencies.map(c => (
                        <div key={c.code} className={styles.dropdownItem} onClick={() => { setToCurr(c.code); setDropOpen(null); }}>
                          <span className={styles.currencyCode}>{c.code}</span>
                          <span className={styles.currencyName}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Rate Setup */}
            {isManual && (
              <div className={styles.manualRateBox}>
                <div className={styles.inputLabel} style={{ marginLeft: 0 }}>Custom Exchange Rate</div>
                <div className={styles.manualRateInputWrapper}>
                  <span className={styles.currencyCode}>1 {fromCurr} =</span>
                  <input
                    type="number"
                    step="0.0001"
                    className={styles.manualRateInput}
                    value={manualRate}
                    onChange={e => setManualRate(e.target.value)}
                    placeholder={`Rate in ${toCurr}`}
                  />
                  <span className={styles.currencyCode}>{toCurr}</span>
                </div>
              </div>
            )}

            <div className={styles.amountGrid}>
              <div className={styles.amountInputWrapper}>
                <span className={styles.inputLabel} style={{ position: "absolute", top: "-1.25rem", left: "0.25rem" }}>Amount</span>
                <input
                  type="number"
                  className={styles.amountInput}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onFocus={() => { if (amount === "1") setAmount(""); }}
                  onBlur={() => { if (amount === "" || amount === "0") setAmount("1"); }}
                />
                <span className={styles.amountSymbol}>{COMMON_CURRENCIES.find(c => c.code === fromCurr)?.icon}</span>
              </div>

              <div style={{ position: "relative" }}>
                <span className={styles.inputLabel} style={{ position: "absolute", top: "-1.25rem", left: "0.25rem" }}>Converted Amount</span>
                <div className={styles.convertedBox}>
                  <div className={styles.convertedValue}>
                    {/* Format using local number system but showing active rate */}
                    <span className={styles.convertedAmount}>
                      {activeRate > 0 ? convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "..."}
                    </span>
                    <span className={styles.convertedCurrency}>{toCurr}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Live Market Hero Card */}
        <section>
          <div className={styles.heroCard}>
            <div className={styles.heroGradient}></div>
            <div>
              <div className={styles.heroCardHeader}>
                <span className="msi msi-md" style={{ color: "var(--primary)" }}>show_chart</span>
                <h3 className={styles.heroCardTitle}>Live Market Rates</h3>
              </div>
              <div className={styles.ratesList}>
                <div className={styles.rateItem}>
                  <p className={styles.heroRatePair}>1 USD</p>
                  <div className={styles.heroRateValue}>
                    <span className={styles.heroRateBig}>{marketRates?.USD_INR ? marketRates.USD_INR.toFixed(2) : "..."}</span>
                    <span className={styles.heroRateCurrency}>INR</span>
                  </div>
                </div>
                <div className={styles.rateItem}>
                  <p className={styles.heroRatePair}>1 EUR</p>
                  <div className={styles.heroRateValue}>
                    <span className={styles.heroRateBig}>{marketRates?.EUR_INR ? marketRates.EUR_INR.toFixed(2) : "..."}</span>
                    <span className={styles.heroRateCurrency}>INR</span>
                  </div>
                </div>
                <div className={styles.rateItem}>
                  <p className={styles.heroRatePair}>1 USD</p>
                  <div className={styles.heroRateValue}>
                    <span className={styles.heroRateBig}>{marketRates?.USD_EUR ? marketRates.USD_EUR.toFixed(2) : "..."}</span>
                    <span className={styles.heroRateCurrency}>EUR</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.heroCardFooter}>
              <div className={styles.heroUpdated}>
                <span className="msi msi-sm">update</span>
                Last updated just now
              </div>
              <div className={styles.heroMarketStatus}>Market Open</div>
            </div>
          </div>
        </section>


      </div>

      {/* Cash Manager (Coming Soon) */}
      <div className={styles.sectionBlock}>
        <div className={styles.cmBox}>
          <div className={styles.cmBgIcon}>
            <span className="msi">account_balance_wallet</span>
          </div>
          <div className={styles.cmContent}>
            <div className={styles.soonBadge}>
              <span className="msi msi-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              Coming Soon
            </div>
            <h3 className={styles.cmTitle}>Integrated Cash Manager</h3>
            <p className={styles.cmDesc}>
              Track your onboard cash advances, salary balances and expenses with no loss. Launching in the next update.
            </p>
            <div className={styles.cmIcons}>
              <div className={styles.cmIconCircle}><span className="msi">receipt_long</span></div>
              <div className={styles.cmIconCircle}><span className="msi">payments</span></div>
              <div className={styles.cmIconCircle}><span className="msi">history_edu</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
