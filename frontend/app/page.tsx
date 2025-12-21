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
      setTimeout(() => {
        setIsLoading(false);
        setShowGame(true);
      }, 1500); // 1.5s loading animation
    }
  };

  const handleReset = () => {
    setShowGame(false);
    setN("");
  };

  // LOADING SCREEN
  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 3s ease infinite",
      }}>
        <style jsx>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}</style>
        
        <div style={{
          fontSize: "clamp(32px, 6vw, 64px)",
          fontWeight: "900",
          color: "#fff",
          textShadow: "0 0 40px rgba(255, 255, 255, 0.8)",
          marginBottom: "40px",
          animation: "pulse 2s infinite",
        }}>
          👑 LOADING QUEENS 👑
        </div>
        
        <div style={{
          width: "80px",
          height: "80px",
          border: "8px solid rgba(255, 255, 255, 0.3)",
          borderTop: "8px solid #fff",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        
        <div style={{
          marginTop: "30px",
          fontSize: "clamp(16px, 3vw, 24px)",
          color: "#fff",
          fontWeight: "700",
        }}>
          Generating {n}×{n} board...
        </div>
      </div>
    );
  }

  // GAME SCREEN
  if (showGame && n !== "" && n >= minN) {
    return (
      <div style={{ position: "relative" }}>
        {/* Back button */}
        <button
          onClick={handleReset}
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "800",
            backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "3px solid #fff",
            borderRadius: "12px",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(102, 126, 234, 0.8)",
            zIndex: 1000,
            textTransform: "uppercase",
          }}
        >
          ⬅️ BACK
        </button>
        <Board n={n} />
      </div>
    );
  }

  // WELCOME SCREEN
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundImage: "linear-gradient(45deg, #000 0%, #1a1a2e 50%, #000 100%)",
      padding: "20px",
      overflow: "hidden",
      position: "relative",
    }}>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.5), 0 0 40px rgba(102, 126, 234, 0.3); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.8), 0 0 80px rgba(102, 126, 234, 0.5); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-3px) rotate(-1deg); }
          75% { transform: translateX(3px) rotate(1deg); }
        }
      `}</style>

      {/* Animated Title */}
      <div style={{
        fontSize: "clamp(40px, 8vw, 96px)",
        fontWeight: "900",
        textTransform: "uppercase",
        backgroundImage: "linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #ff0080)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "rainbow 3s linear infinite, shake 0.5s infinite",
        textShadow: "0 0 30px rgba(255, 0, 128, 0.8)",
        marginBottom: "20px",
        textAlign: "center",
      }}>
        👑 QUEENS GAME 👑
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: "clamp(16px, 3vw, 28px)",
        color: "#fff",
        fontWeight: "700",
        marginBottom: "50px",
        textAlign: "center",
        opacity: 0.9,
      }}>
        🔥 2-Player Strategic Battle 🔥
      </div>

      {/* Input Card */}
      <div style={{
        backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "clamp(30px, 5vw, 60px)",
        borderRadius: "30px",
        border: "5px solid #fff",
        boxShadow: "0 0 60px rgba(102, 126, 234, 0.8)",
        animation: "glow 2s infinite, float 3s ease-in-out infinite",
        maxWidth: "500px",
        width: "90%",
      }}>
        <div style={{
          fontSize: "clamp(20px, 4vw, 32px)",
          color: "#fff",
          fontWeight: "900",
          marginBottom: "30px",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}>
          🎮 CHOOSE BOARD SIZE 🎮
        </div>

        <input
          type="number"
          value={n}
          min={minN}
          placeholder="Enter N (≥6)"
          onChange={(e) => {
            const value = e.target.value;
            setN(value === "" ? "" : Number(value));
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleStart();
          }}
          style={{
            width: "100%",
            padding: "20px",
            fontSize: "clamp(20px, 4vw, 32px)",
            fontWeight: "800",
            textAlign: "center",
            border: "4px solid #fff",
            borderRadius: "15px",
            backgroundColor: "#fff",
            color: "#000",
            marginBottom: "20px",
            boxSizing: "border-box",
            outline: "none",
          }}
        />

        {n !== "" && n < minN && (
          <div style={{
            color: "#ffeb3b",
            fontSize: "clamp(14px, 2.5vw, 18px)",
            fontWeight: "700",
            textAlign: "center",
            marginBottom: "15px",
            backgroundColor: "rgba(255, 0, 0, 0.3)",
            padding: "10px",
            borderRadius: "10px",
            border: "2px solid #fff",
          }}>
            ⚠️ N must be ≥ {minN}!
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={n === "" || n < minN}
          style={{
            width: "100%",
            padding: "20px",
            fontSize: "clamp(18px, 3.5vw, 28px)",
            fontWeight: "900",
            backgroundImage: (n !== "" && n >= minN)
              ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              : "linear-gradient(135deg, #666 0%, #444 100%)",
            color: "#fff",
            border: "4px solid #fff",
            borderRadius: "15px",
            cursor: (n !== "" && n >= minN) ? "pointer" : "not-allowed",
            boxShadow: "0 8px 0px #000",
            textTransform: "uppercase",
            letterSpacing: "2px",
            transition: "all 0.1s ease",
            opacity: (n !== "" && n >= minN) ? 1 : 0.5,
          }}
          onMouseDown={(e) => {
            if (n !== "" && n >= minN) {
              e.currentTarget.style.transform = "translateY(4px)";
              e.currentTarget.style.boxShadow = "0 4px 0px #000";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 0px #000";
          }}
        >
          🚀 START GAME 🚀
        </button>

        <div style={{
          marginTop: "25px",
          fontSize: "clamp(12px, 2vw, 16px)",
          color: "#fff",
          textAlign: "center",
          opacity: 0.8,
        }}>
          💡 Recommended: N = 8 (Classic Chess Board)
        </div>
      </div>

      {/* Features */}
      <div style={{
        display: "flex",
        gap: "20px",
        marginTop: "50px",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "800px",
      }}>
        {[
          { icon: "🤖", text: "AI Battle" },
          { icon: "👥", text: "PvP Mode" },
          { icon: "🧠", text: "Greedy Algorithm" },
          { icon: "🔥", text: "2 Difficulty Levels" },
        ].map((feature, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              padding: "15px 25px",
              borderRadius: "15px",
              border: "3px solid rgba(255, 255, 255, 0.3)",
              fontSize: "clamp(14px, 2.5vw, 18px)",
              fontWeight: "700",
              color: "#fff",
              textAlign: "center",
            }}
          >
            {feature.icon} {feature.text}
          </div>
        ))}
      </div>
    </div>
  );
}
