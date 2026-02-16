"use client";

import { useState } from "react";
import Board from "./components/Board";

export default function HomePage() {
  const [n, setN] = useState<number | "">("");
  const [showGame, setShowGame] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const minN = 6;

  const maxN = 10;

  const handleStart = () => {
    if (n !== "" && n >= minN && n <= maxN) {
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
  if (showGame && n !== "" && n >= minN && n <= maxN) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{
          padding: "20px",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: "600",
              borderRadius: "6px",
              border: "none",
              background: "#fff",
              color: "#333",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "transform 0.1s ease, box-shadow 0.1s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <span>←</span> Back
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
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        fontFamily: "'Inter', sans-serif",
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
          background: "#ffffff",
          padding: "30px 40px",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          minWidth: 320,
          border: "1px solid #eaeaea",
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
          Board size N ({minN}-{maxN})
        </label>
        <input
          type="number"
          value={n}
          min={minN}
          max={maxN}
          onChange={(e) => {
            const value = e.target.value;
            setN(value === "" ? "" : Number(value));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleStart();
          }}
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 16,
            borderRadius: 6,
            border: "2px solid #e0e0e0",
            marginBottom: 10,
            boxSizing: "border-box",
            backgroundColor: "#f9f9f9",
            color: "#333",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#2196F3"}
          onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
        />

        {n !== "" && (n < minN || n > maxN) && (
          <div
            style={{
              color: "#c62828",
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            N must be between {minN} and {maxN}.
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
