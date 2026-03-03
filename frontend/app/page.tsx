"use client";

import { useState } from "react";
import Board from "./components/Board";
import ComplexityAnalysis from "./components/ComplexityAnalysis";
import BacktrackingVisualizer from "./components/BacktrackingVisualizer";
import Link from "next/link";

export default function HomePage() {
  const [n, setN] = useState<number | "">("");
  const [showGame, setShowGame] = useState(false);
  const [showComplexity, setShowComplexity] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [boardData, setBoardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const minN = 6;

  const maxN = 10;

  const handleStart = () => {
    if (n !== "" && n >= minN && n <= maxN) {
      setIsLoading(true);
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

  const handleStartVisualizer = (size: number) => {
    setN(size);
    // Generate board data for visualizer
    const seed = Math.floor(Math.random() * 1000);
    const regions = generateRandomRegions(size, seed);
    const colors = generateDistinctColors(size);
    const boxColors = regions.map(r => colors[r]);

    // Borders
    const borders = regions.map((region, i) => {
      const row = Math.floor(i / size);
      const col = i % size;
      const b = { top: false, right: false, bottom: false, left: false };
      if (row > 0 && regions[(row - 1) * size + col] !== region) b.top = true;
      if (row < size - 1 && regions[(row + 1) * size + col] !== region) b.bottom = true;
      if (col > 0 && regions[row * size + (col - 1)] !== region) b.left = true;
      if (col < size - 1 && regions[row * size + (col + 1)] !== region) b.right = true;
      return b;
    });

    setBoardData({ regions, boxColors, hasBorder: borders });
    setShowVisualizer(true);
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
        <Board n={n} />
      </div>
    );
  }

  if (showComplexity) {
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
        <ComplexityAnalysis onBack={() => setShowComplexity(false)} />
      </div>
    );
  }

  if (showVisualizer && n !== "" && boardData) {
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
        <BacktrackingVisualizer
          n={Number(n)}
          regions={boardData.regions}
          boxColors={boardData.boxColors}
          hasBorder={boardData.hasBorder}
          onBack={() => setShowVisualizer(false)}
        />
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

      <button
        onClick={() => setShowComplexity(true)}
        style={{
          padding: "10px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "#fff",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          marginBottom: "15px",
          boxShadow: "0 10px 20px -5px rgba(118, 75, 162, 0.4)",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(118, 75, 162, 0.5)";
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(118, 75, 162, 0.4)";
        }}
      >
        View Algorithm Complexity
      </button>

      <button
        onClick={() => {
          // Default to size 8 for visualizer if no size selected, or show a selector
          // For now, let's just make the board size cards have a "Visualize" option or a separate button
          setShowVisualizer(false); // Ensure we're not already showing it
          // We'll add a way to pick N for visualizer or just use 8 as default
          handleStartVisualizer(8);
        }}
        style={{
          padding: "10px 24px",
          fontSize: "14px",
          fontWeight: "600",
          color: "#fff",
          background: "linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          marginBottom: "30px",
          boxShadow: "0 10px 20px -5px rgba(255, 106, 136, 0.4)",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(255, 106, 136, 0.5)";
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(255, 106, 136, 0.4)";
        }}
      >
        Backtracking Visualizer (N=8)
      </button>


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

// Helper functions for board generation (copied from Board.tsx for now to avoid refactoring)
function generateRandomRegions(n: number, seed: number): number[] {
  const totalCells = n * n;
  const regions = new Array(totalCells).fill(-1);
  const seededRandom = (i: number) => {
    const x = Math.sin(seed * 9999 + i * 1234) * 10000;
    return x - Math.floor(x);
  };
  const seeds: number[] = [];
  const used = new Set<number>();
  let attempt = 0;
  while (seeds.length < n) {
    const pos = Math.floor(seededRandom(attempt) * totalCells);
    if (!used.has(pos)) {
      used.add(pos);
      seeds.push(pos);
      regions[pos] = seeds.length - 1;
    }
    attempt++;
  }
  let queue = [...seeds];
  let head = 0;
  while (head < queue.length) {
    const currentIdx = queue[head++];
    const currentRegion = regions[currentIdx];
    const row = Math.floor(currentIdx / n);
    const col = currentIdx % n;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push((row - 1) * n + col);
    if (row < n - 1) neighbors.push((row + 1) * n + col);
    if (col > 0) neighbors.push(row * n + (col - 1));
    if (col < n - 1) neighbors.push(row * n + (col + 1));
    neighbors.sort((a, b) => seededRandom(a + seed) - 0.5);
    for (const neighbor of neighbors) {
      if (regions[neighbor] === -1) {
        regions[neighbor] = currentRegion;
        queue.push(neighbor);
      }
    }
  }
  return regions;
}

function generateDistinctColors(n: number): string[] {
  const colors: string[] = [];
  const hueStep = 360 / n;
  for (let i = 0; i < n; i++) {
    const hue = Math.floor(i * hueStep);
    const saturation = 65 + (i % 3) * 10;
    const lightness = 70 + (i % 2) * 10;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
}
