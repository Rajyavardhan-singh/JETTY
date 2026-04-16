"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

// TODO: Paste your aisstream.io API key here
const AIS_API_KEY = "32f954189e8a4933c3be7c6efbecc1d0fded711c";

export default function TrackingClient() {
  const [searchValue, setSearchValue] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [wsStatus, setWsStatus] = useState<"Disconnected" | "Connecting" | "Connected">("Disconnected");
  const [errMsg, setErrMsg] = useState("");

  const wsRef = useRef<WebSocket | null>(null);

  // Ship Data States
  const [shipData, setShipData] = useState<{
    mmsi?: number;
    name?: string;
    lat?: number;
    lng?: number;
    sog?: number; // Speed over ground
    cog?: number; // Course over ground
    heading?: number;
    navStatus?: number;
    updatedAt?: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const startTracking = () => {
    if (!AIS_API_KEY) {
      setErrMsg("Please paste your API key in the TrackingClient.tsx code.");
      return;
    }
    if (!searchValue.trim()) {
      setErrMsg("Please enter an MMSI, IMO, or Ship Name");
      return;
    }

    setErrMsg("");
    setShipData(null);
    setIsTracking(true);
    setWsStatus("Connecting");

    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log("Connecting to wss://stream.aisstream.io/v0/stream...");
    const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");
    wsRef.current = socket;

    socket.onopen = function () {
      console.log("WebSocket connection established!");
      setWsStatus("Connected");

      // Check if user entered a 9 digit MMSI
      const isMmsi = /^\d{9}$/.test(searchValue.trim());

      const subscriptionMessage: any = {
        APIKey: AIS_API_KEY,
        // The whole world. aisstream requires BoundingBoxes
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport", "ShipStaticData"]
      };

      if (isMmsi) {
        subscriptionMessage.FiltersShipMMSI = [searchValue.trim()];
        console.log(`Subscribing specifically to MMSI: ${searchValue.trim()}`);
      } else {
        console.log(`Subscribing globally to scan for name: ${searchValue.trim()}`);
      }

      console.log("Sending subscription payload:", subscriptionMessage);
      socket.send(JSON.stringify(subscriptionMessage));
    };

    socket.onmessage = function (event) {
      try {
        const aisMessage = JSON.parse(event.data);
        console.log("📡 Received AIS Message:", aisMessage);
        
        if (aisMessage.error) {
          console.error("API Error from server:", aisMessage.error);
          setErrMsg("API Error: " + aisMessage.error);
          socket.close();
          return;
        }

        const msgType = aisMessage.MessageType;
        const meta = aisMessage.MetaData || {};

        // If the user entered a name instead of MMSI, we check locally
        const targetSearch = searchValue.trim().toUpperCase();
        const isMmsi = /^\d{9}$/.test(targetSearch);

        // Filter out irrelevant ships if we are doing client-side filtering by name
        if (!isMmsi) {
          const sName = (meta.ShipName || "").trim().toUpperCase();
          const sMMSI = meta.MMSI?.toString();
          if (sName !== targetSearch && sMMSI !== targetSearch) {
            return; // Skip if it's not the ship we are looking for
          }
        }

        console.log("✅ Target ship locked!", aisMessage);

        // We found our ship
        const currentData = { ...shipData };
        currentData.mmsi = meta.MMSI;
        currentData.name = meta.ShipName || currentData.name || "Unknown";
        currentData.updatedAt = new Date().toLocaleTimeString();

        if (msgType === "PositionReport") {
          const report = aisMessage.Message.PositionReport;
          currentData.lat = report.Latitude;
          currentData.lng = report.Longitude;
          currentData.sog = report.Sog;
          currentData.cog = report.Cog;
          currentData.heading = report.TrueHeading;
          currentData.navStatus = report.NavigationalStatus;
        }

        setShipData(currentData as any);

      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    socket.onclose = function () {
      console.log("WebSocket connection closed.");
      setWsStatus("Disconnected");
      setIsTracking(false);
    };

    socket.onerror = function (error) {
      console.error("WebSocket Error:", error);
      setErrMsg("WebSocket connection failed.");
      setWsStatus("Disconnected");
      setIsTracking(false);
    };
  };

  const stopTracking = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Live <span className={styles.titleHighlight}>Tracking</span></h2>
          <p className={styles.subtitle}>
            <span className="msi msi-sm">radar</span>
            Global Maritime Vessel Locator
          </p>
        </div>
        <div className={styles.statusCard}>
          <p className={styles.statusLabel}>WebSocket Status</p>
          <div className={`${styles.statusValue} ${wsStatus === "Connected" ? styles.statusConnected : wsStatus === "Connecting" ? styles.statusConnecting : styles.statusDisconnected}`}>
            <div className={styles.statusDot}></div>
            {wsStatus}
          </div>
        </div>
      </header>

      <div className={styles.grid}>

        {/* Tracker Settings */}
        <section>
          <div className={styles.glassPanel}>
            <div className={styles.toolHeader}>
              <span className="msi msi-md" style={{ color: "var(--secondary)" }}>my_location</span>
              <h3 className={styles.toolTitle}>Locate Vessel</h3>
            </div>

            <div className={styles.searchBox}>
              <div style={{ flex: 1 }}>
                <label className={styles.inputLabel}>MMSI / IMO / Ship Name</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="e.g. 368207620 or TITANIC"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  disabled={isTracking}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                {!isTracking ? (
                  <button className={styles.trackBtn} onClick={startTracking}>
                    <span className="msi text-lg">radar</span>
                    Scan
                  </button>
                ) : (
                  <button className={styles.trackBtn} onClick={stopTracking} style={{ background: "var(--error)", color: "var(--on-error)" }}>
                    <span className="msi text-lg">stop_circle</span>
                    Stop
                  </button>
                )}
              </div>
            </div>

            {errMsg && <div className="text-red-400 text-sm mt-4 font-bold">{errMsg}</div>}

            <div className={styles.infoText}>
              <p>For fastest results, use a 9-digit MMSI number. Using a Ship Name or IMO number relies on global stream scanning and may take several minutes to locate a match depending on traffic density.</p>
            </div>
          </div>
        </section>

        {/* Live Data Display */}
        <section>
          <div className={styles.resultCard}>
            <div className={styles.gradientBg}></div>

            {!shipData ? (
              <div className={styles.emptyState}>
                <span className="msi">satellite_alt</span>
                <p className={styles.emptyStateText}>
                  {wsStatus === "Connecting" ? "Establishing Connection..." : isTracking ? "Scanning oceans for signal..." : "Waiting for coordinates"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8 z-10 relative">
                  <div>
                    <h3 className={styles.toolTitle} style={{ fontSize: "2rem" }}>
                      {shipData.name && shipData.name !== "Unknown" ? shipData.name : `MMSI: ${shipData.mmsi}`}
                    </h3>
                    <p className="text-sm text-emerald-400 font-bold mt-1">Live Signal Acquired</p>
                  </div>
                  <div className="text-right text-xs text-slate-400 font-mono">
                    Last sync: {shipData.updatedAt}
                  </div>
                </div>

                <div className={styles.dataGrid}>
                  <div className={styles.dataBlock}>
                    <span className={styles.dataLabel}>Latitude</span>
                    <span className={styles.dataValue}>{shipData.lat !== undefined ? shipData.lat.toFixed(5) : "--"}</span>
                  </div>
                  <div className={styles.dataBlock}>
                    <span className={styles.dataLabel}>Longitude</span>
                    <span className={styles.dataValue}>{shipData.lng !== undefined ? shipData.lng.toFixed(5) : "--"}</span>
                  </div>
                  <div className={styles.dataBlock}>
                    <span className={styles.dataLabel}>Speed (SOG)</span>
                    <span className={styles.dataValueSmall}>{shipData.sog !== undefined ? shipData.sog + ' knots' : "--"}</span>
                  </div>
                  <div className={styles.dataBlock}>
                    <span className={styles.dataLabel}>Course (COG)</span>
                    <span className={styles.dataValueSmall}>{shipData.cog !== undefined ? shipData.cog + '°' : "--"}</span>
                  </div>
                  <div className={styles.dataBlock}>
                    <span className={styles.dataLabel}>Heading</span>
                    <span className={styles.dataValueSmall}>{shipData.heading !== undefined ? (shipData.heading === 511 ? 'N/A' : shipData.heading + '°') : "--"}</span>
                  </div>
                  <div className={styles.dataBlock}>
                    <span className={styles.dataLabel}>Nav Status</span>
                    <span className={styles.dataValueSmall}>{shipData.navStatus !== undefined ? shipData.navStatus : "--"}</span>
                  </div>
                </div>

                <div className={styles.mapPlaceholder}>
                  <div className={styles.mapPulse}></div>
                  <span className="msi text-slate-500 absolute" style={{ zIndex: 10 }}>directions_boat</span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
