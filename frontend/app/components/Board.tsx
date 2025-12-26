
import { useMemo, useState, useEffect, useRef } from "react";
import * as api from "../utils/api";

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
// Greedy algorithm for generating EXACTLY N regions (or at least N-1)
function generateRandomRegions(n: number, seed: number): number[] {
  const tryGenerate = (attemptSeed: number): number[] | null => {
    const regions = new Array(n * n).fill(-1);
    const targetRegions = n;
    const totalCells = n * n;
    const minCellsPerRegion = Math.floor(totalCells / targetRegions);
    const extraCells = totalCells % targetRegions;

    // Use seed for deterministic randomness
    const seededRandom = (i: number) => {
      const x = Math.sin(attemptSeed * 9999 + i * 1234) * 10000;
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

    // Grid based seeding for better distribution
    const gridSize = Math.ceil(Math.sqrt(targetRegions));

    for (let i = 0; i < targetRegions; i++) {
      let seedPos;
      let attempts = 0;
      do {
        // Spread seeds across the board using grid cells
        const gridRow = Math.floor(i / gridSize);
        const gridCol = i % gridSize;

        const rowStart = Math.floor((gridRow / gridSize) * n);
        const rowEnd = Math.floor(((gridRow + 1) / gridSize) * n);
        const colStart = Math.floor((gridCol / gridSize) * n);
        const colEnd = Math.floor(((gridCol + 1) / gridSize) * n);

        const row = Math.floor(rowStart + seededRandom(i * 100 + attempts) * (rowEnd - rowStart));
        const col = Math.floor(colStart + seededRandom(i * 101 + attempts) * (colEnd - colStart));

        seedPos = Math.min(n * n - 1, Math.max(0, row * n + col));
        attempts++;
      } while (usedPositions.has(seedPos) && attempts < 50);

      if (usedPositions.has(seedPos)) {
        let freePos = -1;
        for (let k = 0; k < n * n; k++) {
          if (!usedPositions.has(k)) {
            freePos = k;
            break;
          }
        }
        if (freePos !== -1) seedPos = freePos;
      }

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
      const queueIdx = Math.floor(seededRandom(iterations) * queue.length);
      const { pos: current, regionId } = queue.splice(queueIdx, 1)[0];

      const currentRegion = regions[current];
      if (currentRegion === -1 || currentRegion !== regionId) continue;

      if (regionSizes[regionId] >= regionMaxSizes[regionId]) continue;

      const neighbors = getUnassignedNeighbors(current);

      if (neighbors.length > 0) {
        const randIdx = Math.floor(seededRandom(iterations * 777) * neighbors.length);
        const nextCell = neighbors[randIdx];
        regions[nextCell] = regionId;
        regionSizes[regionId]++;

        queue.push({ pos: nextCell, regionId });
        if (neighbors.length > 1) {
          queue.push({ pos: current, regionId });
        }
      }
    }

    // Fill remaining cells
    for (let i = 0; i < regions.length; i++) {
      if (regions[i] === -1) {
        const row = Math.floor(i / n);
        const col = i % n;

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
          const chosenRegion = neighborRegions[0];
          regions[i] = chosenRegion;
          regionSizes[chosenRegion]++;
        } else {
          regions[i] = 0;
        }
      }
    }

    const distinctcount = new Set(regions).size;
    // STRICTLY require N regions
    if (distinctcount === n) {
      return regions;
    }
    return null;
  };

  // Try up to 10 times to generate a good board
  let result = tryGenerate(seed);
  if (result) return result;

  for (let i = 1; i <= 10; i++) {
    result = tryGenerate(seed + i * 997);
    if (result) {
      console.log(`Generated regions on retry ${i}`);
      return result;
    }
  }

  // Last resort: simple stripe/grid assignment to guarantee N regions
  console.warn("Falling back to simple region generation");
  const regions = new Array(n * n).fill(0);
  for (let i = 0; i < n * n; i++) {
    regions[i] = i % n;
  }
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

  // Edges are handled by backend logic now, but we keep this for color generation consistency if needed
  // ... (graph building logic omitted as we rely on backend for game logic)

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
}

export default function Board({ n }: BoardProps) {
  const [boardSeed, setBoardSeed] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>("human-vs-human");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showValidMoves, setShowValidMoves] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsLoading(true);
    setError(null);
    try {
      const initialState = await api.initGame(n, regions);
      setGameState(initialState);
    } catch (err) {
      console.error("Failed to initialize game:", err);
      setError("Failed to connect to game server. Please ensure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellClick = async (index: number) => {
    if (!gameState || gameState.gameOver || isLoading) return;

    // Check if it's AI's turn
    if (gameMode === "human-vs-ai" && gameState.currentPlayer === 2) {
      return; // Don't allow human to click on AI's turn
    }

    // Check if move is valid
    if (!gameState.validMoves.includes(index)) {
      return;
    }

    // Make the move via API
    try {
      const move = {
        position: index,
        player: gameState.currentPlayer,
        gameState: gameState
      };
      const newState = await api.makeMove(move);
      setGameState(newState);

      // Trigger AI if needed
      if (gameMode === "human-vs-ai" && !newState.gameOver && newState.currentPlayer === 2) {
        triggerAIMove(newState);
      }

    } catch (err) {
      console.error("Error making move:", err);
      setError("Error making move. Please try again.");
    }
  };

  const triggerAIMove = async (currentGameState: GameState) => {
    // Small delay for UX
    setTimeout(async () => {
      try {
        const aiState = await api.getAIMove(currentGameState);
        setGameState(aiState);
      } catch (err) {
        console.error("Error getting AI move:", err);
        // Don't set error state here to avoid disrupting the UI too much, just log it
      }
    }, 1000);
  };

  const handleNewBoard = () => {
    setBoardSeed(prev => prev + 1);
  };

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    // improving UX: reset game when mode changes
    if (gameState) {
      initializeGame();
    }
  };

  if (!gameState && !error) return <div>Loading game...</div>;
  if (error) return (
    <div style={{
      padding: "20px",
      color: "red",
      border: "1px solid red",
      borderRadius: "8px",
      background: "#ffebee",
      margin: "20px"
    }}>
      <h3>Error</h3>
      <p>{error}</p>
      <button onClick={initializeGame} style={{ marginTop: "10px", padding: "5px 10px" }}>Retry</button>
    </div>
  );

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
          disabled={gameState?.gameOver || (gameState?.queenPositions?.length || 0) > 0}
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
          const filled = (gameState?.queenPositions?.length || 0) > i;
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
        background: gameState?.gameOver ? "#4CAF50" : "#2196F3",
        color: "#fff",
        borderRadius: "8px",
        textAlign: "center",
        maxWidth: "600px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}>
        {gameState?.gameOver ? (
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
            <div style={{ fontSize: "14px", marginTop: "10px", fontStyle: "italic" }}>
              {gameState.message}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
              {gameMode === "human-vs-ai" && gameState?.currentPlayer === 2
                ? "AI is thinking..."
                : `Player ${gameState?.currentPlayer}'s Turn`}
            </div>
            <div style={{ fontSize: "15px", marginBottom: "5px" }}>
              {gameState?.validMoves?.length} valid moves | {gameState?.queenPositions?.length}/{n} queens placed
            </div>
            <div style={{ fontSize: "14px" }}>
              Player 1: {gameState?.player1Queens} | Player 2: {gameState?.player2Queens}
            </div>
            <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.9 }}>
              {gameState?.message}
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
          const hasQueen = gameState?.queenPositions?.includes(i);
          const isValidMove = showValidMoves && gameState?.validMoves?.includes(i);

          // Determine background color based on region
          // We can use the boxColors computed locally for visualization
          const bgColor = boxColors[i];
          const border = hasBorder[i];

          // Dynamic borders
          const borderStyle = {
            borderTop: border.top ? "2px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.05)",
            borderRight: border.right ? "2px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.05)",
            borderBottom: border.bottom ? "2px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.05)",
            borderLeft: border.left ? "2px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.05)",
          };

          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: gameState?.validMoves?.includes(i) ? "pointer" : "default",
                fontSize: "24px",
                position: "relative",
                ...borderStyle,
              }}
            >
              {/* Valid Move Indicator */}
              {isValidMove && !hasQueen && !gameState?.gameOver && (
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(33, 150, 243, 0.6)",
                  }}
                />
              )}

              {/* Queen Icon */}
              {hasQueen && (
                <span style={{
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
                  fontSize: "32px"
                }}>
                  👑
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        Seed: {boardSeed} | API: {isLoading ? "Connecting..." : "Connected"}
      </div>
    </div>
  );
}
