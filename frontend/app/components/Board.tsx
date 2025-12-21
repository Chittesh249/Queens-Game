import { useMemo, useState, useEffect, useRef } from "react";

type BoardProps = {
  n: number;
};

type GameMode = "human-vs-human" | "human-vs-ai";
type Difficulty = "easy" | "hard";

interface GameState {
  n: number;
  regions: number[];
  queenPositions: number[];
  currentPlayer: number;
  gameOver: boolean;
  winner: string | null;
  message: string;
  validMoves: number[];
  player1Queens: number;
  player2Queens: number;
}

// Graph Node representing each box on the board
class GraphNode {
  row: number;
  col: number;
  index: number;
  color: string | null;
  region: number; // Color region assignment
  neighbors: Set<number>;

  constructor(row: number, col: number, index: number, region: number) {
    this.row = row;
    this.col = col;
    this.index = index;
    this.region = region;
    this.color = null;
    this.neighbors = new Set();
  }

  addNeighbor(nodeIndex: number) {
    this.neighbors.add(nodeIndex);
  }
}

// Greedy algorithm for generating EXACTLY N regions
function generateRandomRegions(n: number, seed: number): number[] {
  const regions = new Array(n * n).fill(-1);
  const targetRegions = n;
  const totalCells = n * n;
  const minCellsPerRegion = Math.floor(totalCells / targetRegions);
  const extraCells = totalCells % targetRegions;
  
  // Use seed for deterministic randomness
  const seededRandom = (i: number) => {
    const x = Math.sin(seed * 9999 + i * 1234) * 10000;
    return x - Math.floor(x);
  };
  
  // Track region sizes
  const regionSizes = new Array(targetRegions).fill(0);
  const regionMaxSizes = new Array(targetRegions).fill(minCellsPerRegion);
  
  // Distribute extra cells to first few regions
  for (let i = 0; i < extraCells; i++) {
    regionMaxSizes[i]++;
  }
  
  // Generate well-distributed seed positions (one per region)
  const seeds: number[] = [];
  const usedPositions = new Set<number>();
  
  for (let i = 0; i < targetRegions; i++) {
    let seedPos;
    let attempts = 0;
    do {
      // Spread seeds across the board
      const baseRow = Math.floor((i / Math.sqrt(targetRegions)) * n);
      const baseCol = Math.floor((i % Math.sqrt(targetRegions)) * n);
      const offsetRow = Math.floor(seededRandom(i * 100 + attempts) * (n / 2));
      const offsetCol = Math.floor(seededRandom(i * 101 + attempts) * (n / 2));
      const row = Math.min(n - 1, baseRow + offsetRow);
      const col = Math.min(n - 1, baseCol + offsetCol);
      seedPos = row * n + col;
      attempts++;
    } while (usedPositions.has(seedPos) && attempts < 200);
    
    usedPositions.add(seedPos);
    seeds.push(seedPos);
    regions[seedPos] = i;
    regionSizes[i] = 1;
  }
  
  // Helper to get unassigned neighbors
  const getUnassignedNeighbors = (idx: number): number[] => {
    const row = Math.floor(idx / n);
    const col = idx % n;
    const neighbors: number[] = [];
    
    if (row > 0 && regions[(row - 1) * n + col] === -1) neighbors.push((row - 1) * n + col);
    if (row < n - 1 && regions[(row + 1) * n + col] === -1) neighbors.push((row + 1) * n + col);
    if (col > 0 && regions[row * n + (col - 1)] === -1) neighbors.push(row * n + (col - 1));
    if (col < n - 1 && regions[row * n + (col + 1)] === -1) neighbors.push(row * n + (col + 1));
    
    return neighbors;
  };
  
  // Greedy BFS: grow regions while respecting size limits
  let queue = seeds.map((pos, idx) => ({ pos, regionId: idx }));
  let iterations = 0;
  const maxIterations = n * n * 5;
  
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const { pos: current, regionId } = queue.shift()!;
    const currentRegion = regions[current];
    
    if (currentRegion === -1 || currentRegion !== regionId) continue;
    
    // Check if this region has reached max size
    if (regionSizes[regionId] >= regionMaxSizes[regionId]) continue;
    
    const neighbors = getUnassignedNeighbors(current);
    
    if (neighbors.length > 0) {
      // Pick random neighbor
      const randIdx = Math.floor(seededRandom(iterations * 777) * neighbors.length);
      const nextCell = neighbors[randIdx];
      regions[nextCell] = regionId;
      regionSizes[regionId]++;
      queue.push({ pos: nextCell, regionId });
      queue.push({ pos: current, regionId }); // Re-add current for more growth
    }
  }
  
  // Fill remaining cells - MUST preserve all N regions!
  for (let i = 0; i < regions.length; i++) {
    if (regions[i] === -1) {
      const row = Math.floor(i / n);
      const col = i % n;
      
      // Find nearest region that's not at max size
      const neighborRegions: number[] = [];
      if (row > 0 && regions[(row - 1) * n + col] !== -1) 
        neighborRegions.push(regions[(row - 1) * n + col]);
      if (col > 0 && regions[row * n + (col - 1)] !== -1) 
        neighborRegions.push(regions[row * n + (col - 1)]);
      if (row < n - 1 && regions[(row + 1) * n + col] !== -1) 
        neighborRegions.push(regions[(row + 1) * n + col]);
      if (col < n - 1 && regions[row * n + (col + 1)] !== -1) 
        neighborRegions.push(regions[row * n + (col + 1)]);
      
      if (neighborRegions.length > 0) {
        // Pick first available neighbor region
        const chosenRegion = neighborRegions[0];
        regions[i] = chosenRegion;
        regionSizes[chosenRegion]++;
      } else {
        // Fallback: assign to smallest region
        let smallestRegion = 0;
        let smallestSize = regionSizes[0];
        for (let r = 1; r < targetRegions; r++) {
          if (regionSizes[r] < smallestSize) {
            smallestSize = regionSizes[r];
            smallestRegion = r;
          }
        }
        regions[i] = smallestRegion;
        regionSizes[smallestRegion]++;
      }
    }
  }
  
  // Verify we have exactly N distinct regions
  const uniqueRegions = new Set(regions);
  console.log(`🎨 Generated ${uniqueRegions.size} regions (target: ${targetRegions})`);
  console.log(`📊 Region sizes:`, regionSizes);
  
  return regions;
}

// Build graph with conflict edges (optimized for large N)
function buildGraph(n: number, seed: number): GraphNode[] {
  const nodes: GraphNode[] = [];
  const regions = generateRandomRegions(n, seed);
  
  // Create nodes for each box with region assignment
  for (let i = 0; i < n * n; i++) {
    const row = Math.floor(i / n);
    const col = i % n;
    nodes.push(new GraphNode(row, col, i, regions[i]));
  }
  
  // Add edges between conflicting boxes (optimized)
  // Only add edges within a reasonable range to avoid O(n^4) complexity
  for (let i = 0; i < nodes.length; i++) {
    const node1 = nodes[i];
    
    // Add edges to same row, column, and diagonal (optimized)
    for (let j = 0; j < n; j++) {
      // Same row
      if (j !== node1.col) {
        const idx = node1.row * n + j;
        if (idx > i) {
          node1.addNeighbor(idx);
          nodes[idx].addNeighbor(i);
        }
      }
      
      // Same column
      if (j !== node1.row) {
        const idx = j * n + node1.col;
        if (idx > i) {
          node1.addNeighbor(idx);
          nodes[idx].addNeighbor(i);
        }
      }
    }
    
    // Diagonals (optimized)
    for (let d = 1; d < n; d++) {
      // Top-left to bottom-right diagonal
      const r1 = node1.row + d;
      const c1 = node1.col + d;
      if (r1 < n && c1 < n) {
        const idx = r1 * n + c1;
        node1.addNeighbor(idx);
        nodes[idx].addNeighbor(i);
      }
      
      // Top-right to bottom-left diagonal
      const r2 = node1.row + d;
      const c2 = node1.col - d;
      if (r2 < n && c2 >= 0) {
        const idx = r2 * n + c2;
        node1.addNeighbor(idx);
        nodes[idx].addNeighbor(i);
      }
    }
    
    // Add edges to same region
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[j].region === node1.region) {
        node1.addNeighbor(j);
        nodes[j].addNeighbor(i);
      }
    }
  }
  
  return nodes;
}

// Assign colors to regions (each region gets one distinct color)
function assignRegionColors(nodes: GraphNode[], n: number): void {
  const regionColors = [
    "#FF6B9D", // Rose Pink
    "#4ECDC4", // Turquoise
    "#95E1D3", // Mint
    "#FFD93D", // Bright Yellow
    "#6BCF7F", // Emerald Green
    "#A8E6CF", // Light Green
    "#FFB6B9", // Peach Pink
    "#8ED1FC", // Sky Blue
    "#C7CEEA", // Lavender
    "#FECA57", // Mango
    "#FF9FF3", // Pink Purple
    "#54A0FF", // Bright Blue
  ];
  
  // Assign each node the color of its region
  for (const node of nodes) {
    node.color = regionColors[node.region % regionColors.length];
  }
}

export default function Board({ n }: BoardProps) {
  const [boardSeed, setBoardSeed] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>("human-vs-human");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showValidMoves, setShowValidMoves] = useState(true);
  
  // Use ref to always have latest game state for AI
  const gameStateRef = useRef<GameState | null>(null);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Compute colors using optimized graph algorithm with regions
  const { boxColors, hasBorder, regions } = useMemo(() => {
    const graph = buildGraph(n, boardSeed);
    assignRegionColors(graph, n);
    
    const colors = graph.map(node => node.color || "#FFFFFF");
    const regions = graph.map(node => node.region);
    
    // Create border information - add dark border between different regions
    const borders = graph.map((node, i) => {
      const row = Math.floor(i / n);
      const col = i % n;
      const borders = { top: false, right: false, bottom: false, left: false };
      
      // Check neighbors for region boundaries
      if (row > 0 && graph[(row - 1) * n + col].region !== node.region) borders.top = true;
      if (row < n - 1 && graph[(row + 1) * n + col].region !== node.region) borders.bottom = true;
      if (col > 0 && graph[row * n + (col - 1)].region !== node.region) borders.left = true;
      if (col < n - 1 && graph[row * n + (col + 1)].region !== node.region) borders.right = true;
      
      return borders;
    });
    
    return { boxColors: colors, hasBorder: borders, regions };
  }, [n, boardSeed]);

  // Initialize game when board changes
  useEffect(() => {
    initializeGame();
  }, [regions, boardSeed]);

  const initializeGame = async () => {
    const newGameState: GameState = {
      n,
      regions,
      queenPositions: [],
      currentPlayer: 1,
      gameOver: false,
      winner: null,
      message: "Game started! Player 1's turn.",
      validMoves: getAllValidMoves([]),
      player1Queens: 0,
      player2Queens: 0,
    };
    setGameState(newGameState);
  };

  const getAllValidMoves = (queenPositions: number[]): number[] => {
    const validMoves: number[] = [];
    const usedRegions = new Set(
      queenPositions.map(pos => regions[pos])
    );

    for (let i = 0; i < n * n; i++) {
      if (isSafe(i, queenPositions) && !usedRegions.has(regions[i])) {
        validMoves.push(i);
      }
    }
    return validMoves;
  };

  const isSafe = (position: number, queenPositions: number[]): boolean => {
    const row = Math.floor(position / n);
    const col = position % n;

    for (const queenPos of queenPositions) {
      const qRow = Math.floor(queenPos / n);
      const qCol = queenPos % n;

      // Same row or column - NOT ALLOWED
      if (row === qRow || col === qCol) return false;

      const rowDiff = Math.abs(row - qRow);
      const colDiff = Math.abs(col - qCol);
      
      if (difficulty === "hard") {
        // HARD MODE: Full diagonal attacks (Classic N-Queens)
        // All cells on diagonal are blocked
        if (rowDiff === colDiff) return false;
      } else {
        // EASY MODE: Only adjacent diagonals
        // Only 1-step diagonal neighbors are blocked
        if (rowDiff === 1 && colDiff === 1) return false;
      }
    }

    return true;
  };

  const handleCellClick = (index: number) => {
    if (!gameState || gameState.gameOver) return;

    // Check if it's AI's turn
    if (gameMode === "human-vs-ai" && gameState.currentPlayer === 2) {
      return; // Don't allow human to click on AI's turn
    }

    // If clicking on a cell with a queen, REMOVE IT (toggle off)
    if (gameState.queenPositions.includes(index)) {
      removeQueen(index);
      return;
    }

    // Check if move is valid
    if (!gameState.validMoves.includes(index)) {
      return;
    }

    // Make the move
    makeMove(index);
  };

  const removeQueen = (position: number) => {
    if (!gameState) return;

    // Remove the queen from the position
    const newQueenPositions = gameState.queenPositions.filter(pos => pos !== position);
    
    // Find which player placed this queen and decrement their count
    const queenIndex = gameState.queenPositions.indexOf(position);
    const wasPlayer1 = queenIndex % 2 === 0; // Even indices = player 1, odd = player 2
    
    const newPlayer1Queens = wasPlayer1 ? gameState.player1Queens - 1 : gameState.player1Queens;
    const newPlayer2Queens = !wasPlayer1 ? gameState.player2Queens - 1 : gameState.player2Queens;

    // Recalculate valid moves
    const newValidMoves = getAllValidMoves(newQueenPositions);

    // Update game state (stay on same player's turn)
    setGameState({
      ...gameState,
      queenPositions: newQueenPositions,
      validMoves: newValidMoves,
      message: `Player ${gameState.currentPlayer}'s turn. ${newValidMoves.length} valid moves available.`,
      player1Queens: newPlayer1Queens,
      player2Queens: newPlayer2Queens,
    });
  };

  const makeMove = (position: number, isAIMove: boolean = false) => {
    if (!gameState) return;

    const newQueenPositions = [...gameState.queenPositions, position];
    
    const newPlayer1Queens = gameState.currentPlayer === 1 
      ? gameState.player1Queens + 1 
      : gameState.player1Queens;
    const newPlayer2Queens = gameState.currentPlayer === 2 
      ? gameState.player2Queens + 1 
      : gameState.player2Queens;

    // Check if this move completes the board (N queens placed)
    if (newQueenPositions.length === n) {
      // ALL REGIONS FILLED! Current player wins!
      setGameState({
        ...gameState,
        queenPositions: newQueenPositions,
        gameOver: true,
        winner: `Player ${gameState.currentPlayer}`,
        message: `🏆 Player ${gameState.currentPlayer} wins! All ${n} regions filled! 🏆`,
        validMoves: [],
        player1Queens: newPlayer1Queens,
        player2Queens: newPlayer2Queens,
      });
      return;
    }

    // Switch player FIRST
    const nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    // Check valid moves for THE NEXT PLAYER
    const newValidMoves = getAllValidMoves(newQueenPositions);

    // If next player has NO valid moves, CURRENT player wins (they just made the winning move)
    if (newValidMoves.length === 0) {
      setGameState({
        ...gameState,
        queenPositions: newQueenPositions,
        gameOver: true,
        winner: `Player ${gameState.currentPlayer}`, // Current player wins!
        message: `Player ${gameState.currentPlayer} wins! Player ${nextPlayer} has no valid moves. (${newQueenPositions.length}/${n} queens placed)`,
        validMoves: [],
        player1Queens: newPlayer1Queens,
        player2Queens: newPlayer2Queens,
      });
      return;
    }

    // Game continues - update state for next player
    const newGameState = {
      ...gameState,
      queenPositions: newQueenPositions,
      currentPlayer: nextPlayer,
      validMoves: newValidMoves,
      message: `Player ${nextPlayer}'s turn. ${newValidMoves.length} valid moves available. (${newQueenPositions.length}/${n} queens)`,
      player1Queens: newPlayer1Queens,
      player2Queens: newPlayer2Queens,
    };

    setGameState(newGameState);

    // If it's AI's turn, make AI move after a delay (only if human just moved)
    if (gameMode === "human-vs-ai" && nextPlayer === 2 && !isAIMove) {
      setTimeout(() => {
        console.log('🤖 AI TURN TRIGGERED');
        // Use ref to get latest state
        const latestState = gameStateRef.current;
        if (latestState && !latestState.gameOver && latestState.currentPlayer === 2) {
          makeAIMove(latestState);
        } else {
          console.log('❌ AI turn cancelled - state changed');
        }
      }, 1200);
    }
  };

  const makeAIMove = (currentGameState: GameState) => {
    if (currentGameState.validMoves.length === 0 || currentGameState.gameOver) {
      console.log('❌ AI cannot move - game over or no moves');
      return;
    }

    console.log(`🤖 AI evaluating ${currentGameState.validMoves.length} moves...`);
    console.log('Current game state:', { 
      queens: currentGameState.queenPositions.length,
      currentPlayer: currentGameState.currentPlayer 
    });

    // IMPROVED GREEDY ALGORITHM: Maximize options while ensuring game continues
    let bestMove = -1;
    let maxFutureOptions = -1;
    const moveEvaluations: Array<{move: number, aiMoves: number, humanMoves: number}> = [];

    for (const move of currentGameState.validMoves) {
      // Simulate AI placing queen at this position
      const afterAIMove = [...currentGameState.queenPositions, move];
      const aiValidMoves = getAllValidMoves(afterAIMove);
      
      // Check if human can respond (simulate human's best move)
      let minHumanMoves = Infinity;
      if (aiValidMoves.length > 0) {
        // For each possible AI move, find minimum human responses
        for (const aiNextMove of aiValidMoves.slice(0, Math.min(5, aiValidMoves.length))) {
          const afterHumanSim = [...afterAIMove, aiNextMove];
          const humanValidMoves = getAllValidMoves(afterHumanSim);
          minHumanMoves = Math.min(minHumanMoves, humanValidMoves.length);
        }
      } else {
        // AI move blocks all moves = winning move!
        minHumanMoves = 0;
      }

      moveEvaluations.push({
        move,
        aiMoves: aiValidMoves.length,
        humanMoves: minHumanMoves,
      });

      console.log(`  Move ${move}: AI=${aiValidMoves.length} moves, Human≥${minHumanMoves} moves`);
    }

    // GREEDY SELECTION STRATEGY:
    // 1. If there's a winning move (humanMoves=0), take it!
    // 2. Otherwise, pick move that maximizes AI options while leaving human ≥1 move
    // 3. If all moves block human, pick the one with most AI options (aggressive)
    
    const winningMoves = moveEvaluations.filter(e => e.humanMoves === 0);
    const fairMoves = moveEvaluations.filter(e => e.humanMoves > 0);

    if (winningMoves.length > 0) {
      // Take winning move!
      const winner = winningMoves.sort((a, b) => b.aiMoves - a.aiMoves)[0];
      bestMove = winner.move;
      console.log(`🏆 WINNING MOVE ${bestMove}!`);
    } else if (fairMoves.length > 0) {
      // Pick move that maximizes AI options while being fair
      const best = fairMoves.sort((a, b) => b.aiMoves - a.aiMoves)[0];
      bestMove = best.move;
      maxFutureOptions = best.aiMoves;
      console.log(`🎯 FAIR GREEDY: ${bestMove} (AI=${best.aiMoves}, Human=${best.humanMoves})`);
    } else {
      // All moves block human - pick least aggressive
      const leastBad = moveEvaluations.sort((a, b) => b.aiMoves - a.aiMoves)[0];
      bestMove = leastBad.move;
      console.log(`⚠️ NO FAIR MOVES - Picking ${bestMove}`);
    }

    if (bestMove !== -1) {
      console.log('✅ Executing AI move...');
      makeMove(bestMove, true);
    } else {
      console.log('❌ No valid move found!');
    }
  };

  const handleNewBoard = () => {
    setBoardSeed(prev => prev + 1);
  };

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    initializeGame();
  };

  if (!gameState) return null;

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      gap: "15px",
      backgroundImage: "linear-gradient(45deg, #000 0%, #1a1a2e 50%, #000 100%)",
      padding: "20px",
      minHeight: "100vh",
      maxWidth: "100vw",
      overflow: "auto",
      boxSizing: "border-box",
    }}>
      {/* ULTRA BRAIN ROT HEADER */}
      <div style={{
        fontSize: "clamp(24px, 5vw, 48px)",
        fontWeight: "900",
        textTransform: "uppercase",
        backgroundImage: "linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #ff0080)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "rainbow 3s linear infinite, shake 0.5s infinite",
        textShadow: "0 0 30px rgba(255, 0, 128, 0.8)",
        letterSpacing: "clamp(2px, 0.5vw, 4px)",
      }}>
        💀 QUEENS GAME 💀
      </div>

      {/* Game Controls - MAXIMUM BRAIN ROT - RESPONSIVE */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "95vw",
      }}>
        <button
          onClick={handleNewBoard}
          style={{
            padding: "clamp(10px, 2vw, 18px) clamp(20px, 4vw, 36px)",
            fontSize: "clamp(14px, 2.5vw, 20px)",
            fontWeight: "900",
            backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "4px solid #fff",
            borderRadius: "20px",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(102, 126, 234, 0.8), 8px 8px 0px #000",
            transition: "all 0.1s ease",
            textTransform: "uppercase",
            letterSpacing: "2px",
            animation: "glow 2s infinite",
            whiteSpace: "nowrap",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translate(-3px, -3px) scale(1.05)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(102, 126, 234, 1), 12px 12px 0px #000";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translate(0, 0) scale(1)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(102, 126, 234, 0.8), 8px 8px 0px #000";
          }}
        >
          💥 NEW GAME FR FR 💥
        </button>

        <select
          value={gameMode}
          onChange={(e) => handleModeChange(e.target.value as GameMode)}
          disabled={!gameState.gameOver && gameState.queenPositions.length > 0}
          style={{
            padding: "clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 20px)",
            fontSize: "clamp(12px, 2vw, 16px)",
            fontWeight: "800",
            border: "3px solid #000",
            borderRadius: "12px",
            cursor: "pointer",
            backgroundImage: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "#fff",
            boxShadow: "4px 4px 0px #000",
            textTransform: "uppercase",
          }}
        >
          <option value="human-vs-human">💀 PVP MODE 💀</option>
          <option value="human-vs-ai">🤖 FIGHT THE BOT 🤖</option>
        </select>

        <button
          onClick={() => setShowValidMoves(!showValidMoves)}
          style={{
            padding: "clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 20px)",
            fontSize: "clamp(12px, 2vw, 15px)",
            fontWeight: "800",
            backgroundImage: showValidMoves 
              ? "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" 
              : "linear-gradient(135deg, #a8a8a8 0%, #6b6b6b 100%)",
            color: "#000",
            border: "3px solid #000",
            borderRadius: "12px",
            cursor: "pointer",
            boxShadow: "4px 4px 0px #000",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {showValidMoves ? "👁️ HINTS ON" : "🚫 HINTS OFF"}
        </button>

        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value as Difficulty);
            initializeGame(); // Restart game with new difficulty
          }}
          style={{
            padding: "clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 20px)",
            fontSize: "clamp(12px, 2vw, 16px)",
            fontWeight: "800",
            border: "3px solid #000",
            borderRadius: "12px",
            cursor: "pointer",
            backgroundImage: difficulty === "hard"
              ? "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)"
              : "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
            color: "#fff",
            boxShadow: "4px 4px 0px #000",
            textTransform: "uppercase",
          }}
        >
          <option value="easy">👶 EASY MODE</option>
          <option value="hard">🔥 HARD MODE</option>
        </select>
      </div>

      {/* Game Status - MAXIMUM BRAIN ROT - RESPONSIVE */}
      <div style={{
        padding: "clamp(12px, 3vw, 24px) clamp(20px, 5vw, 40px)",
        backgroundImage: gameState.gameOver 
          ? "linear-gradient(135deg, #fa709a 0%, #fee140 50%, #fa709a 100%)" 
          : "linear-gradient(135deg, #30cfd0 0%, #330867 50%, #30cfd0 100%)",
        backgroundSize: "200% 200%",
        color: "#fff",
        borderRadius: "25px",
        fontWeight: "900",
        fontSize: "clamp(14px, 3vw, 20px)",
        textAlign: "center",
        minWidth: "min(500px, 90vw)",
        maxWidth: "95vw",
        boxShadow: "0 0 40px rgba(255, 255, 255, 0.5), 10px 10px 0px #000",
        border: "5px solid #fff",
        textTransform: "uppercase",
        letterSpacing: "clamp(1px, 0.3vw, 3px)",
        animation: gameState.gameOver ? "winner 1s infinite" : "pulse 2s infinite, bgSlide 3s linear infinite",
        position: "relative",
        overflow: "hidden",
      }}>
        {gameState.gameOver ? (
          <div>
            <div style={{ fontSize: "clamp(24px, 5vw, 32px)", marginBottom: "12px", textShadow: "3px 3px 0px #000" }}>
              💀 {gameState.winner} IS THE GOAT 💀
            </div>
            <div style={{ fontSize: "clamp(14px, 2.5vw, 16px)", fontWeight: "700" }}>
              {gameState.queenPositions.length === n 
                ? `🏆 PERFECT GAME - ALL ${n} REGIONS FILLED! 🏆`
                : `PARTIAL GAME - ${gameState.queenPositions.length}/${n} QUEENS PLACED`
              }
            </div>
            <div style={{ fontSize: "clamp(12px, 2vw, 14px)", marginTop: "8px", opacity: 0.9 }}>
              P1: {gameState.player1Queens} 👑 | P2: {gameState.player2Queens} 👑
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "clamp(16px, 3vw, 24px)", marginBottom: "8px", textShadow: "2px 2px 0px #000" }}>
              {gameMode === "human-vs-ai" && gameState.currentPlayer === 2 
                ? "🤖 AI THINKING... 🧠" 
                : `⚡ PLAYER ${gameState.currentPlayer} DROP THAT QUEEN ⚡`}
            </div>
            <div style={{ fontSize: "clamp(12px, 2vw, 15px)", fontWeight: "700" }}>
              {gameState.validMoves.length} MOVES LEFT 📍 {gameState.queenPositions.length}/{n} QUEENS PLACED
            </div>
            <div style={{ fontSize: "clamp(11px, 1.8vw, 13px)", marginTop: "4px", fontWeight: "700" }}>
              P1: {gameState.player1Queens} 👑 | P2: {gameState.player2Queens} 👑
            </div>
            <div style={{ fontSize: "clamp(10px, 1.5vw, 12px)", marginTop: "6px", opacity: 0.8 }}>
              {difficulty === "hard" ? "🔥 HARD MODE - Full Diagonals" : "👶 EASY MODE - Adjacent Only"}
            </div>
          </div>
        )}
      </div>

      {/* ULTRA BRAIN ROT ANIMATIONS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 10px rgba(102, 126, 234, 0.8); }
          50% { transform: scale(1.5); opacity: 0.6; box-shadow: 0 0 30px rgba(102, 126, 234, 1); }
        }
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-2px) rotate(-1deg); }
          75% { transform: translateX(2px) rotate(1deg); }
        }
        @keyframes glow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 10px rgba(255, 255, 255, 0.5)); }
          50% { filter: brightness(1.2) drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)); }
        }
        @keyframes winner {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(-2deg); }
          75% { transform: scale(1.05) rotate(2deg); }
        }
        @keyframes bgSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .queen-bounce {
          animation: bounce 0.6s ease-in-out, spin 10s linear infinite;
          display: inline-block;
        }
        .hint-pulse {
          animation: pulse-dot 1.5s infinite;
        }
      `}</style>

      {/* Board Grid - ULTRA BRAIN ROT - RESPONSIVE */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${n}, minmax(30px, 60px))`,
          gridTemplateRows: `repeat(${n}, minmax(30px, 60px))`,
          gap: "0",
          border: "5px solid #fff",
          backgroundColor: "#000",
          boxShadow: "0 0 50px rgba(255, 255, 255, 0.5), 0 10px 30px rgba(0,0,0,0.5)",
          borderRadius: "15px",
          padding: "5px",
          animation: "float 4s ease-in-out infinite",
          maxWidth: "min(90vw, 90vh)",
          maxHeight: "min(90vw, 90vh)",
        }}
      >
        {Array.from({ length: n * n }).map((_, i) => {
          const hasQueen = gameState.queenPositions.includes(i);
          const isValidMove = showValidMoves && gameState.validMoves.includes(i);
          const isPlayerTurn = gameMode === "human-vs-human" || gameState.currentPlayer === 1;

          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              style={{
                width: "100%",
                height: "100%",
                minWidth: "30px",
                minHeight: "30px",
                aspectRatio: "1 / 1",
                backgroundColor: boxColors[i],
                borderTop: hasBorder[i].top ? "3px solid #000" : "2px solid rgba(0,0,0,0.3)",
                borderRight: hasBorder[i].right ? "3px solid #000" : "2px solid rgba(0,0,0,0.3)",
                borderBottom: hasBorder[i].bottom ? "3px solid #000" : "2px solid rgba(0,0,0,0.3)",
                borderLeft: hasBorder[i].left ? "3px solid #000" : "2px solid rgba(0,0,0,0.3)",
                boxSizing: "border-box",
                cursor: !gameState.gameOver && isPlayerTurn && isValidMove ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(20px, 4vmin, 42px)",
                transition: "all 0.2s ease",
                userSelect: "none",
                position: "relative",
                opacity: isValidMove ? 1 : hasQueen ? 1 : 0.7,
                filter: isValidMove ? "brightness(1.2) saturate(1.3)" : "brightness(1)",
                boxShadow: isValidMove ? "inset 0 0 20px rgba(102, 126, 234, 0.5)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!gameState.gameOver && isPlayerTurn && isValidMove) {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.zIndex = "10";
                  e.currentTarget.style.filter = "brightness(1.4) saturate(1.5)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(102, 126, 234, 1), inset 0 0 20px rgba(255, 255, 255, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.zIndex = "1";
                e.currentTarget.style.filter = isValidMove ? "brightness(1.2) saturate(1.3)" : "brightness(1)";
                e.currentTarget.style.boxShadow = isValidMove ? "inset 0 0 20px rgba(102, 126, 234, 0.5)" : "none";
              }}
            >
              {hasQueen && (
                <span className="queen-bounce" style={{ 
                  filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.5))",
                  fontSize: "clamp(20px, 4vmin, 42px)",
                }}>👑</span>
              )}
              {isValidMove && !hasQueen && (
                <div className="hint-pulse" style={{
                  width: "clamp(10px, 2vmin, 16px)",
                  height: "clamp(10px, 2vmin, 16px)",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "3px solid #000",
                  boxShadow: "0 0 10px rgba(102, 126, 234, 0.8)",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Algorithm Explanation - BRAIN ROT EDITION - RESPONSIVE */}
      {gameMode === "human-vs-ai" && (
        <div style={{
          padding: "clamp(12px, 3vw, 20px)",
          background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
          borderRadius: "12px",
          maxWidth: "min(550px, 90vw)",
          fontSize: "clamp(12px, 2vw, 15px)",
          lineHeight: "1.7",
          border: "4px solid #000",
          boxShadow: "6px 6px 0px #000",
          fontWeight: "600",
        }}>
          <div style={{ 
            fontWeight: "900", 
            marginBottom: "12px", 
            color: "#000",
            fontSize: "18px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}>
            🧠 AI GREEDY STRAT (NO CAP) 🧠
          </div>
          <div style={{ color: "#222" }}>
            Bot be like: "YO LEMME PICK THE MOVE WITH THE <strong>MOST FUTURE MOVES</strong> FR FR 💯"
            <br/><br/>
            This AI only thinks about RIGHT NOW ⚡ (locally optimal) - it ain't predicting your next 5 moves like some chess grandmaster 🤷
            <br/><br/>
            <strong>⏱️ Speed:</strong> O(N³) per turn (that's math for "pretty fast ngl")
          </div>
        </div>
      )}
    </div>
  );
}
