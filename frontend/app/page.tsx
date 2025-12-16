'use client'

import { useState } from 'react'
import Board from './components/Board'
import './globals.css'

export default function Home() {
  const [n, setN] = useState(4)

  return (
    <div className="page">
      {/* Top bar */}
      <div className="top-bar">
        <div /> {/* left spacer */}

        <h1 className="title">Queens Game</h1>

        <div className="input-container">
          <label>Enter N:</label>
          <input
            type="number"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="n-input no-spinner"
          />
        </div>
      </div>

      {/* Board */}
      <div className="board-container">
        <Board n={n} />
      </div>
    </div>
  )
}
``
