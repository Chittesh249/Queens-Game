"use client";

import { useState } from "react";
import Board from "./components/Board";

export default function HomePage() {
  const [n, setN] = useState<number | "">("");
  const [algorithm, setAlgorithm] = useState<"greedy" | "minimax" | "dp">("greedy");
  const [showGame, setShowGame] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlgorithmSelection, setShowAlgorithmSelection] = useState(false);
  const minN = 6;

  const maxN = 10;

  const handleStart = () => {
    if (n !== "" && n >= minN && n <= maxN) {
      setShowAlgorithmSelection(true);
    }
  };

  const handleAlgorithmSelect = (selectedAlgorithm: "greedy" | "minimax" | "dp") => {
    setAlgorithm(selectedAlgorithm);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowGame(true);
      setShowAlgorithmSelection(false);
    }, 600);
  };

  const handleReset = () => {
    setShowGame(false);
    setShowAlgorithmSelection(false);
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

  // Algorithm selection screen
  if (showAlgorithmSelection && n !== "" && n >= minN && n <= maxN) {
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

        <div style={{ fontSize: 28, fontWeight: "bold", marginBottom: 16, color: "#333" }}>
          Select Algorithm
        </div>
        <div style={{ fontSize: 16, color: "#666", marginBottom: 32, textAlign: "center" }}>
          Choose the AI strategy for your {n}×{n} game
        </div>

        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            flexWrap: "wrap",
            maxWidth: "800px",
            width: "100%",
          }}
        >
          {[
            {
              id: "greedy" as const,
              name: "Greedy Algorithm",
              description: "Fast, makes locally optimal choices",
              speed: "⚡ Fast",
              color: "linear-gradient(135deg, #43CBFF 0%, #9708CC 100%)",
              ring: "#9708CC"
            },
            {
              id: "minimax" as const,
              name: "Divide & Conquer",
              description: "Strategic, looks ahead multiple moves",
              speed: "🎯 Strategic",
              color: "linear-gradient(135deg, #F97794 0%, #623AA2 100%)",
              ring: "#623AA2"
            },
            {
              id: "dp" as const,
              name: "Dynamic Programming",
              description: "Optimized with caching, learns from patterns",
              speed: "🧠 Smart",
              color: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              ring: "#11998e"
            }
          ].map(({ id, name, description, speed, color, ring }) => (
            <button
              key={id}
              onClick={() => handleAlgorithmSelect(id)}
              style={{
                width: "220px",
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "20px",
                border: "none",
                background: color,
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                boxShadow: "0 10px 20px -10px rgba(0,0,0,0.15)",
                position: "relative",
                overflow: "hidden",
                padding: "20px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-10px) scale(1.05)";
                e.currentTarget.style.boxShadow = `0 20px 30px -10px ${ring}80`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 10px 20px -10px rgba(0,0,0,0.15)";
              }}
            >
              <div style={{
                background: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(4px)",
                padding: "6px 16px",
                borderRadius: "20px",
                marginBottom: "16px",
              }}>
                <span style={{
                  fontSize: "14px",
                  color: "#fff",
                  fontWeight: "700",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}>
                  {speed}
                </span>
              </div>
              <span style={{
                fontSize: "22px",
                fontWeight: "800",
                color: "#fff",
                lineHeight: 1.2,
                marginBottom: "12px",
                textAlign: "center",
                textShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}>
                {name}
              </span>
              <span style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.9)",
                lineHeight: 1.4,
                textAlign: "center",
                maxWidth: "180px",
              }}>
                {description}
              </span>
            </button>
          ))}
        </div>
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
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        fontFamily: "'Inter', sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: "bold", marginBottom: 8, color: "#333" }}>
        Queens Game
      </div>
      <div style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
        2-player strategy game with AI
      </div>

      <div
        style={{
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: "20px",
          marginBottom: "20px",
          maxWidth: "900px",
          width: "100%",
        }}
      >
        {/* Re-doing the map with better predefined colors */}
        {[
          { size: 6, bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", ring: "#667eea" }, // Deep Purple
          { size: 7, bg: "linear-gradient(135deg, #1fa2ff 0%, #12d8fa 100%, #a6ffcb 100%)", ring: "#1fa2ff" }, // Electric Blue
          { size: 8, bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", ring: "#11998e" }, // Vivid Green
          { size: 9, bg: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)", ring: "#ff0844" }, // Red/Orange
          { size: 10, bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", ring: "transparent" }, // Wait, user disliked light... let's change 10 too.
        ].map(({ size, bg, ring }) => null)}
        {/* Let's actually use the new values in the real map below */}
        {[
          { size: 6, bg: "linear-gradient(135deg, #43CBFF 0%, #9708CC 100%)", ring: "#9708CC" }, // Purple/Blue
          { size: 7, bg: "linear-gradient(135deg, #F97794 0%, #623AA2 100%)", ring: "#623AA2" }, // Magenta/Deep Purple
          { size: 8, bg: "linear-gradient(135deg, #FBD786 0%, #f7797d 100%)", ring: "#f7797d" }, // Gold/Red
          { size: 9, bg: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)", ring: "#0072ff" }, // Bright Blue
          { size: 10, bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", ring: "#11998e" }, // Bright Green
        ].map(({ size, bg, ring }) => (
          <button
            key={size}
            onClick={() => {
              setN(size);
              if (size >= minN && size <= maxN) {
                setN(size);
                setIsLoading(true);
                setTimeout(() => {
                  setIsLoading(false);
                  setShowGame(true);
                }, 600);
              }
            }}
            style={{
              width: "140px",
              height: "160px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "20px",
              border: "none",
              background: bg,
              cursor: "pointer",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              boxShadow: "0 10px 20px -10px rgba(0,0,0,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-10px) scale(1.05)";
              e.currentTarget.style.boxShadow = `0 20px 30px -10px ${ring}80`; // Add transparency to ring color
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 20px -10px rgba(0,0,0,0.15)";
            }}
          >
            <div style={{
              background: "rgba(255, 255, 255, 0.3)",
              backdropFilter: "blur(4px)",
              padding: "4px 12px",
              borderRadius: "20px",
              marginBottom: "12px",
            }}>
              <span style={{
                fontSize: "13px",
                color: "#fff",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: "700",
                textShadow: "0 1px 2px rgba(0,0,0,0.1)"
              }}>
                Board
              </span>
            </div>
            <span style={{
              fontSize: "64px",
              fontWeight: "900",
              color: "#fff",
              lineHeight: 1,
              textShadow: "0 2px 10px rgba(0,0,0,0.1)",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
            }}>
              {size}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
