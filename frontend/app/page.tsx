"use client";

import { useState } from "react";
import Board from "./components/Board";

export default function HomePage() {
  const [n, setN] = useState<number | "">("");
  const [showGame, setShowGame] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const minN = 6;

  const handleStart = () => {
    if (n !== "" && n >= minN) {
      setIsLoading(true);
      // Short, simple loading to keep UI responsive but calm
      setTimeout(() => {
        setIsLoading(false);
        setShowGame(true);
      }, 600);
    }
  };

  const handleReset = () => {
    setShowGame(false);
    setN("");
  };

  // Simple loading screen
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#f5f5f5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 16, color: "#333" }}>
          Loading board...
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "4px solid #ccc",
            borderTop: "4px solid #333",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Game screen
  if (showGame && n !== "" && n >= minN) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ padding: "10px 20px" }}>
          <button
            onClick={handleReset}
            style={{
              padding: "6px 12px",
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>
        <Board n={n} />
      </div>
    );
  }

  // Simple welcome / setup screen
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: "bold", marginBottom: 8, color: "#333" }}>
        Queens Game
      </div>
      <div style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
        2-player strategy game with greedy AI
      </div>

      <div
        style={{
          background: "#fff",
          padding: "24px 32px",
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          minWidth: 280,
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: 14,
            marginBottom: 8,
            color: "#333",
          }}
        >
          Board size N (≥ {minN})
        </label>
        <input
          type="number"
          value={n}
          min={minN}
          onChange={(e) => {
            const value = e.target.value;
            setN(value === "" ? "" : Number(value));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleStart();
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid #ccc",
            marginBottom: 10,
            boxSizing: "border-box",
          }}
        />

        {n !== "" && n < minN && (
          <div
            style={{
              color: "#c62828",
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            N must be at least {minN}.
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={n === "" || n < minN}
          style={{
            width: "100%",
            padding: "10px 16px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 4,
            border: "none",
            background: n !== "" && n >= minN ? "#1976D2" : "#9e9e9e",
            color: "#fff",
            cursor: n !== "" && n >= minN ? "pointer" : "not-allowed",
            marginTop: 4,
          }}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
