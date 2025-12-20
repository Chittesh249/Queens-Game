import { useMemo, useState } from "react";

type BoardProps = {
  n: number;
};

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

// Greedy algorithm for generating regions dynamically with random seeds
function generateRandomRegions(n: number, seed: number): number[] {
  const regions = new Array(n * n).fill(-1);
  const targetRegions = n;
  
  // Use seed for deterministic randomness
  const seededRandom = (i: number) => {
    const x = Math.sin(seed * 9999 + i * 1234) * 10000;
    return x - Math.floor(x);
  };
  
  // Generate random seed positions for each region
  const seeds: number[] = [];
  const usedPositions = new Set<number>();
  
  for (let i = 0; i < targetRegions; i++) {
    let seedPos;
    let attempts = 0;
    do {
      // Random position using seeded random
      seedPos = Math.floor(seededRandom(i * 100 + attempts) * (n * n));
      attempts++;
    } while (usedPositions.has(seedPos) && attempts < 100);
    
    usedPositions.add(seedPos);
    seeds.push(seedPos);
    regions[seedPos] = i;
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
  
  // Greedy BFS: grow all regions from seeds
  let queue = [...seeds];
  let iterations = 0;
  const maxIterations = n * n * 3;
  
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const current = queue.shift()!;
    const currentRegion = regions[current];
    
    if (currentRegion === -1) continue;
    
    const neighbors = getUnassignedNeighbors(current);
    
    if (neighbors.length > 0) {
      // Pick random neighbor using seeded random
      const randIdx = Math.floor(seededRandom(iterations * 777) * neighbors.length);
      const nextCell = neighbors[randIdx];
      regions[nextCell] = currentRegion;
      queue.push(nextCell);
      queue.push(current);
    }
  }
  
  // Fill remaining cells with nearest neighbor's region
  for (let i = 0; i < regions.length; i++) {
    if (regions[i] === -1) {
      const row = Math.floor(i / n);
      const col = i % n;
      
      // Check all 4 neighbors
      if (row > 0 && regions[(row - 1) * n + col] !== -1) {
        regions[i] = regions[(row - 1) * n + col];
      } else if (col > 0 && regions[row * n + (col - 1)] !== -1) {
        regions[i] = regions[row * n + (col - 1)];
      } else if (row < n - 1 && regions[(row + 1) * n + col] !== -1) {
        regions[i] = regions[(row + 1) * n + col];
      } else if (col < n - 1 && regions[row * n + (col + 1)] !== -1) {
        regions[i] = regions[row * n + (col + 1)];
      } else {
        regions[i] = i % targetRegions;
      }
    }
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
  const [queens, setQueens] = useState<Set<number>>(new Set());

  // Compute colors using optimized graph algorithm with regions
  const { boxColors, hasBorder } = useMemo(() => {
    const graph = buildGraph(n, boardSeed);
    assignRegionColors(graph, n);
    
    const colors = graph.map(node => node.color || "#FFFFFF");
    
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
    
    return { boxColors: colors, hasBorder: borders };
  }, [n, boardSeed]);

  const handleCellClick = (index: number) => {
    const newQueens = new Set(queens);
    if (newQueens.has(index)) {
      newQueens.delete(index);
    } else {
      newQueens.add(index);
    }
    setQueens(newQueens);
  };

  const handleNewBoard = () => {
    setBoardSeed(prev => prev + 1);
    setQueens(new Set()); // Clear queens on new board
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      {/* Generate New Board Button */}
      <button
        onClick={handleNewBoard}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: "600",
          backgroundColor: "#5B8DEF",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#4A7DD9")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#5B8DEF")}
      >
        🎲 Generate New Board
      </button>

      {/* Board Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${n}, 65px)`,
          gridTemplateRows: `repeat(${n}, 65px)`,
          gap: "0",
          border: "2px solid #000",
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {Array.from({ length: n * n }).map((_, i) => (
          <div
            key={i}
            onClick={() => handleCellClick(i)}
            style={{
              width: "65px",
              height: "65px",
              backgroundColor: boxColors[i],
              borderTop: hasBorder[i].top ? "2px solid #000" : "1px solid #000",
              borderRight: hasBorder[i].right ? "2px solid #000" : "1px solid #000",
              borderBottom: hasBorder[i].bottom ? "2px solid #000" : "1px solid #000",
              borderLeft: hasBorder[i].left ? "2px solid #000" : "1px solid #000",
              boxSizing: "border-box",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              transition: "background-color 0.15s ease",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              if (!queens.has(i)) {
                e.currentTarget.style.opacity = "0.85";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {queens.has(i) && (
              <span style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }}>👑</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
