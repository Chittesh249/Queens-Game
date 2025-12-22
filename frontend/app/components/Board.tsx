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

// Generate N distinct colors dynamically using HSL
function generateDistinctColors(n: number): string[] {
  const colors: string[] = [];
  const hueStep = 360 / n; // Divide color wheel evenly
  
  for (let i = 0; i < n; i++) {
    const hue = Math.floor(i * hueStep);
    const saturation = 65 + (i % 3) * 10; // Vary saturation: 65%, 75%, 85%
    const lightness = 70 + (i % 2) * 10;  // Vary lightness: 70%, 80%
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
}

// Assign colors to regions (each region gets one distinct color)
function assignRegionColors(nodes: GraphNode[], n: number): void {
  const regionColors = generateDistinctColors(n);
  
  // Assign each node the color of its region
  for (const node of nodes) {
    node.color = regionColors[node.region];
  }

  // Debug: verify distinct colors used
  const usedColors = new Set(nodes.map(node => node.color));
  console.log(`Regions (target N): ${n}, distinct region ids: ${new Set(nodes.map(n => n.region)).size}, distinct colors used: ${usedColors.size}`);
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
      // Pick move based on difficulty
      let best;
      if (difficulty === "hard") {
        // HARD: minimize human moves first, then maximize AI moves
        best = fairMoves.sort((a, b) => {
          if (a.humanMoves === b.humanMoves) return b.aiMoves - a.aiMoves;
          return a.humanMoves - b.humanMoves;
        })[0];
      } else {
        // EASY: maximize AI options while being fair
        best = fairMoves.sort((a, b) => b.aiMoves - a.aiMoves)[0];
      }
      bestMove = best.move;
      maxFutureOptions = best.aiMoves;
      console.log(`🎯 GREEDY PICK: ${bestMove} (AI=${best.aiMoves}, Human=${best.humanMoves}, mode=${difficulty})`);
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
      gap: "20px",
      background: "#f5f5f5",
      padding: "30px",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif",
    }}>
      {/* Title */}
      <div style={{
        fontSize: "32px",
        fontWeight: "bold",
        color: "#333",
      }}>
        👑 Queens Game
      </div>

      {/* Controls */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        <button
          onClick={handleNewBoard}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "600",
            background: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          New Game
        </button>

        <select
          value={gameMode}
          onChange={(e) => handleModeChange(e.target.value as GameMode)}
          disabled={!gameState.gameOver && gameState.queenPositions.length > 0}
          style={{
            padding: "10px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="human-vs-human">Player vs Player</option>
          <option value="human-vs-ai">Player vs AI</option>
        </select>

        <button
          onClick={() => setShowValidMoves(!showValidMoves)}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "600",
            background: showValidMoves ? "#2196F3" : "#999",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {showValidMoves ? "Hints: ON" : "Hints: OFF"}
        </button>

        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value as Difficulty);
            initializeGame();
          }}
          style={{
            padding: "10px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="easy">Easy Mode</option>
          <option value="hard">Hard Mode</option>
        </select>
      </div>

      {/* Queen Slots (N queens) */}
      <div style={{
        display: "flex",
        gap: "6px",
        marginTop: "5px",
        justifyContent: "center",
        alignItems: "center",
      }}>
        {Array.from({ length: n }).map((_, i) => {
          const filled = gameState.queenPositions.length > i;
          return (
            <div
              key={i}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "2px solid #4CAF50",
                backgroundColor: filled ? "#4CAF50" : "transparent",
              }}
            />
          );
        })}
      </div>

      <div style={{
        padding: "20px 30px",
        background: gameState.gameOver ? "#4CAF50" : "#2196F3",
        color: "#fff",
        borderRadius: "8px",
        textAlign: "center",
        maxWidth: "600px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}>
        {gameState.gameOver ? (
          <div>
            <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>
              {gameState.winner} Wins!
            </div>
            <div style={{ fontSize: "16px", marginBottom: "5px" }}>
              {gameState.queenPositions.length === n 
                ? `Perfect Game - All ${n} regions filled!`
                : `${gameState.queenPositions.length}/${n} queens placed`
              }
            </div>
            <div style={{ fontSize: "14px" }}>
              Player 1: {gameState.player1Queens} | Player 2: {gameState.player2Queens}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
              {gameMode === "human-vs-ai" && gameState.currentPlayer === 2 
                ? "AI is thinking..." 
                : `Player ${gameState.currentPlayer}'s Turn`}
            </div>
            <div style={{ fontSize: "15px", marginBottom: "5px" }}>
              {gameState.validMoves.length} valid moves | {gameState.queenPositions.length}/{n} queens placed
            </div>
            <div style={{ fontSize: "14px" }}>
              Player 1: {gameState.player1Queens} | Player 2: {gameState.player2Queens}
            </div>
            <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.9 }}>
              {difficulty === "hard" ? "Hard Mode (Full Diagonals)" : "Easy Mode (Adjacent Only)"}
            </div>
          </div>
        )}
      </div>

      {/* Board Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${n}, minmax(40px, 60px))`,
          gridTemplateRows: `repeat(${n}, minmax(40px, 60px))`,
          gap: "0",
          border: "2px solid #333",
          backgroundColor: "#fff",
          borderRadius: "4px",
          overflow: "hidden",
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
                backgroundColor: boxColors[i],
                borderTop: hasBorder[i].top ? "2px solid #333" : "1px solid rgba(0,0,0,0.1)",
                borderRight: hasBorder[i].right ? "2px solid #333" : "1px solid rgba(0,0,0,0.1)",
                borderBottom: hasBorder[i].bottom ? "2px solid #333" : "1px solid rgba(0,0,0,0.1)",
                borderLeft: hasBorder[i].left ? "2px solid #333" : "1px solid rgba(0,0,0,0.1)",
                boxSizing: "border-box",
                cursor: !gameState.gameOver && isPlayerTurn && isValidMove ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                transition: "all 0.2s ease",
                userSelect: "none",
                position: "relative",
              }}
            >
              {hasQueen && (
                <span style={{ fontSize: "32px" }}>👑</span>
              )}
              {isValidMove && !hasQueen && (
                <div style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#2196F3",
                  border: "2px solid #fff",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
