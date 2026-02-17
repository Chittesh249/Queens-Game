"use client";

import { useState } from "react";
import Board from "./components/Board";

export default function HomePage() {
  const [n, setN] = useState<number | "">("");
  const [algorithm, setAlgorithm] = useState<"greedy" | "minimax" | "dp">("greedy");
  const [showGame, setShowGame] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const minN = 6;
  const maxN = 10;

  const handleDirectStart = (boardSize: number, algo: "greedy" | "minimax" | "dp") => {
    setN(boardSize);
    setAlgorithm(algo);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowGame(true);
    }, 600);
  };

  const handleReset = () => {
    setShowGame(false);
    setN("");
    setAlgorithm("greedy");
  };

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
        <Board n={n} algorithm={algorithm} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Inter', sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ 
        textAlign: "center",
        marginBottom: 40,
        maxWidth: "600px",
      }}>
        <div style={{ 
          fontSize: 42, 
          fontWeight: "800", 
          marginBottom: 12, 
          color: "#fff",
          textShadow: "0 2px 10px rgba(0,0,0,0.2)",
          letterSpacing: "1px",
        }}>
          👑 Queens Game
        </div>
        <div style={{ 
          fontSize: 16, 
          color: "rgba(255,255,255,0.9)", 
          fontWeight: "500",
          textShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}>
          2-player strategy game with advanced AI opponents
        </div>
      </div>

      {/* Enhanced Algorithm Selection */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "35px",
        width: "100%",
        maxWidth: "900px",
      }}>
        {[
          { 
            algorithm: "greedy" as const, 
            name: "Greedy Algorithm", 
            desc: "Fast, makes locally optimal choices",
            color: "#9708CC",
            icon: "⚡"
          },
          { 
            algorithm: "minimax" as const, 
            name: "Divide & Conquer", 
            desc: "Strategic, looks ahead multiple moves",
            color: "#623AA2",
            icon: "🎯"
          },
          { 
            algorithm: "dp" as const, 
            name: "Dynamic Programming", 
            desc: "Optimized with caching, learns from patterns",
            color: "#11998e",
            icon: "🧠"
          }
        ].map(({ algorithm: algo, name, desc, color, icon }) => (
          <div key={algo} style={{ 
            width: "100%",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "25px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            backdropFilter: "blur(10px)",
            border: `1px solid rgba(255,255,255,0.2)`,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: 15,
            }}>
              <span style={{ fontSize: "24px" }}>{icon}</span>
              <div style={{
                fontSize: 22,
                fontWeight: "800",
                color: color,
              }}>
                {name}
              </div>
            </div>
            <div style={{ 
              fontSize: 15, 
              color: "#555", 
              marginBottom: 20, 
              textAlign: "center",
              fontWeight: "500",
            }}>
              {desc}
            </div>
            <div style={{
              display: "flex",
              gap: "18px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}>
              {[6, 7, 8, 9, 10].map((size) => (
                <button
                  key={`${algo}-${size}`}
                  onClick={() => handleDirectStart(size, algo)}
                  style={{
                    width: "90px",
                    height: "90px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "16px",
                    border: `2px solid ${color}40`,
                    background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px) scale(1.05)";
                    e.currentTarget.style.boxShadow = `0 12px 25px ${color}60`;
                    e.currentTarget.style.background = `linear-gradient(135deg, ${color}25 0%, ${color}40 100%)`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 6px 15px rgba(0,0,0,0.1)";
                    e.currentTarget.style.background = `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`;
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    width: "30px",
                    height: "30px",
                    background: color,
                    borderRadius: "50%",
                    opacity: 0.1,
                  }} />
                  <span style={{
                    fontSize: "28px",
                    fontWeight: "800",
                    color: color,
                    zIndex: 2,
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}>
                    {size}
                  </span>
                  <span style={{
                    fontSize: "13px",
                    color: `${color}cc`,
                    marginTop: "3px",
                    fontWeight: "600",
                    zIndex: 2,
                  }}>
                    ×{size}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}