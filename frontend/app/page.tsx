"use client";

import { useState } from "react";
import Board from "./components/Board";

export default function HomePage() {
  const [n, setN] = useState<number | "">("");
  const minN = 6;

  return (
    <div className="page">
      {/* Top bar */}
      <div className="top-bar">
        <div></div>

        <h1 className="title">Queens Game</h1>

        <div className="input-container">
          <label>Enter N:</label>
          <input
            type="number"
            className="n-input no-spinner"
            placeholder="≥ 6"
            value={n}
            min={minN}
            onChange={(e) => {
              const value = e.target.value;
              setN(value === "" ? "" : Number(value));
            }}
          />
        </div>
      </div>

      {/* Validation message */}
      {n !== "" && n < minN && (
        <p style={{ color: "red", textAlign: "center" }}>
          N must be at least {minN}
        </p>
      )}

      {/* Board */}
      {n !== "" && n >= minN && (
        <div className="board-container">
          <Board n={n} />
        </div>
      )}
    </div>
  );
}
