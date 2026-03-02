package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Branch and Bound Solver for Queens Game
 * 
 * Improves backtracking by:
 * 1. BOUND: Calculate upper bound on future queens that can be placed
 * 2. BRANCH: Only explore branches that can potentially beat current best
 * 3. PRUNE: Skip branches that cannot improve solution
 */
@Service
public class BranchAndBoundSolverService {

    private int n;
    private List<Integer> regions;
    private int bestQueensPlaced;  // Best solution found so far
    private List<Integer> bestSolution;

    /**
     * Solve using Branch and Bound
     */
    public QueensSolution solve(int boardSize, List<Integer> regionList) {
        this.n = boardSize;
        this.regions = regionList;
        this.bestQueensPlaced = 0;
        this.bestSolution = new ArrayList<>();
        
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                "Invalid regions array. Expected size: " + (n * n));
        }
        
        // Start with empty solution
        List<Integer> currentSolution = new ArrayList<>();
        Set<Integer> usedRegions = new HashSet<>();
        
        // Branch and Bound from row 0
        branchAndBound(0, currentSolution, usedRegions);
        
        if (bestQueensPlaced == n) {
            return new QueensSolution(new ArrayList<>(bestSolution), true,
                "Solved using Branch and Bound - placed " + bestQueensPlaced + " queens");
        } else {
            return new QueensSolution(new ArrayList<>(bestSolution), false,
                "Partial solution: placed " + bestQueensPlaced + "/" + n + " queens");
        }
    }
    
    /**
     * Branch and Bound core algorithm
     */
    private void branchAndBound(int row, List<Integer> currentSolution, Set<Integer> usedRegions) {
        // BOUND 1: Check if we can beat current best
        int maxPossible = currentSolution.size() + (n - row);
        if (maxPossible <= bestQueensPlaced) {
            // PRUNE: Even if we place queen in every remaining row, 
            // we can't beat current best
            return;
        }
        
        // BOUND 2: Check if enough regions remain
        int remainingRegions = n - usedRegions.size();
        int remainingRows = n - row;
        if (remainingRegions < remainingRows) {
            // PRUNE: Not enough unused regions for remaining rows
            return;
        }
        
        // BASE CASE: All rows processed
        if (row == n) {
            if (currentSolution.size() > bestQueensPlaced) {
                bestQueensPlaced = currentSolution.size();
                bestSolution = new ArrayList<>(currentSolution);
            }
            return;
        }
        
        // BRANCH: Try each column in current row
        for (int col = 0; col < n; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);
            
            // Check if valid placement
            if (!isValid(pos, row, col, region, currentSolution, usedRegions)) {
                continue;
            }
            
            // BOUND 3: Check if this region is worth using
            if (!promisingRegion(region, row, currentSolution, usedRegions)) {
                continue;
            }
            
            // DO: Place queen
            currentSolution.add(pos);
            usedRegions.add(region);
            
            // RECURSE: Next row
            branchAndBound(row + 1, currentSolution, usedRegions);
            
            // UNDO: Backtrack
            currentSolution.remove(currentSolution.size() - 1);
            usedRegions.remove(region);
        }
        
        // Also try skipping this row (don't place queen)
        branchAndBound(row + 1, currentSolution, usedRegions);
    }
    
    /**
     * Check if position is valid
     */
    private boolean isValid(int pos, int row, int col, int region,
                           List<Integer> currentSolution, Set<Integer> usedRegions) {
        // Region constraint
        if (usedRegions.contains(region)) {
            return false;
        }
        
        // Attack constraints
        for (int queenPos : currentSolution) {
            int qRow = queenPos / n;
            int qCol = queenPos % n;
            
            if (col == qCol) return false;  // Same column
            if (Math.abs(row - qRow) == Math.abs(col - qCol)) return false;  // Diagonal
        }
        
        return true;
    }
    
    /**
     * BOUND: Check if using this region is promising
     */
    private boolean promisingRegion(int region, int currentRow, 
                                    List<Integer> currentSolution, 
                                    Set<Integer> usedRegions) {
        // Count available positions for this region in remaining rows
        int availablePositions = 0;
        for (int r = currentRow + 1; r < n; r++) {
            for (int c = 0; c < n; c++) {
                int pos = r * n + c;
                if (regions.get(pos) == region) {
                    // Check if this position would be valid
                    if (wouldBeValid(pos, r, c, currentSolution)) {
                        availablePositions++;
                    }
                }
            }
        }
        
        // If this region has very few future positions, 
        // it might be better to save it for later
        // (This is a heuristic bound)
        return availablePositions >= 0;  // Always true for now, can be tuned
    }
    
    /**
     * Check if position would be valid (without region constraint)
     */
    private boolean wouldBeValid(int pos, int row, int col, List<Integer> currentSolution) {
        for (int queenPos : currentSolution) {
            int qRow = queenPos / n;
            int qCol = queenPos % n;
            
            if (col == qCol) return false;
            if (Math.abs(row - qRow) == Math.abs(col - qCol)) return false;
        }
        return true;
    }
    
    /**
     * Get AI move for current game state using Minimax with Alpha-Beta pruning
     */
    public int getMove(GameState gameState) {
        return getBestMoveMinimax(gameState, 4); // depth 4
    }
    
    /**
     * Get best move using Minimax with Alpha-Beta pruning (Branch and Bound for game trees)
     */
    public int getBestMoveMinimax(GameState gameState, int maxDepth) {
        if (gameState.isGameOver()) {
            return -1;
        }

        int n = gameState.getN();
        List<Integer> queens = new ArrayList<>(gameState.getQueenPositions());
        List<Integer> regions = gameState.getRegions();

        Set<Integer> usedRegions = new HashSet<>();
        for (int pos : queens) {
            usedRegions.add(regions.get(pos));
        }

        int row = queens.size();

        int bestMove = -1;
        int bestScore = Integer.MIN_VALUE;

        for (int col = 0; col < n; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);

            if (!isValidMove(pos, row, col, n, queens, usedRegions, regions)) continue;

            queens.add(pos);
            usedRegions.add(region);

            int score = minimax(row + 1, n, queens, usedRegions, regions, maxDepth - 1, false,
                                Integer.MIN_VALUE, Integer.MAX_VALUE);

            queens.remove(queens.size() - 1);
            usedRegions.remove(region);

            if (score > bestScore) {
                bestScore = score;
                bestMove = pos;
            }
        }

        return bestMove;
    }

    /**
     * Minimax with Alpha-Beta pruning (Branch and Bound for two-player games)
     * 
     * isMaximizing = true: We want to maximize our score
     * isMaximizing = false: Opponent wants to minimize our score (choose worst for us)
     */
    private int minimax(int row, int n, List<Integer> queens, Set<Integer> usedRegions,
                        List<Integer> regions, int depth, boolean isMaximizing,
                        int alpha, int beta) {

        if (depth == 0 || row >= n) {
            return evaluateBoard(row, n, queens, usedRegions, regions);
        }

        List<Integer> moves = getValidMoves(row, n, queens, usedRegions, regions);

        if (moves.isEmpty()) {
            return isMaximizing ? -1000 : 1000; // No move = loss for current player
        }

        if (isMaximizing) {
            int best = Integer.MIN_VALUE;

            for (int pos : moves) {
                int region = regions.get(pos);

                queens.add(pos);
                usedRegions.add(region);

                best = Math.max(best, minimax(row + 1, n, queens, usedRegions, regions,
                                              depth - 1, false, alpha, beta));

                queens.remove(queens.size() - 1);
                usedRegions.remove(region);

                alpha = Math.max(alpha, best);
                if (beta <= alpha) break; // ✂️ Alpha-Beta PRUNE
            }
            return best;

        } else {
            int best = Integer.MAX_VALUE;

            for (int pos : moves) {
                int region = regions.get(pos);

                queens.add(pos);
                usedRegions.add(region);

                best = Math.min(best, minimax(row + 1, n, queens, usedRegions, regions,
                                              depth - 1, true, alpha, beta));

                queens.remove(queens.size() - 1);
                usedRegions.remove(region);

                beta = Math.min(beta, best);
                if (beta <= alpha) break; // ✂️ Alpha-Beta PRUNE
            }
            return best;
        }
    }

    /**
     * Evaluate board at leaf node
     */
    private int evaluateBoard(int row, int n, List<Integer> queens,
                              Set<Integer> usedRegions, List<Integer> regions) {
        return getValidMoves(row, n, queens, usedRegions, regions).size();
    }

    /**
     * Get valid moves in a row
     */
    private List<Integer> getValidMoves(int row, int n, List<Integer> queens,
                                       Set<Integer> usedRegions, List<Integer> regions) {
        List<Integer> moves = new ArrayList<>();

        for (int col = 0; col < n; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);

            if (usedRegions.contains(region)) continue;

            boolean ok = true;
            for (int q : queens) {
                int qr = q / n;
                int qc = q % n;

                if (qc == col) ok = false;
                if (Math.abs(qr - row) == Math.abs(qc - col)) ok = false;
            }

            if (ok) moves.add(pos);
        }
        return moves;
    }
    
    /**
     * Check if move is valid
     */
    private boolean isValidMove(int pos, int row, int col, int boardSize,
                               List<Integer> existingQueens, Set<Integer> usedRegions,
                               List<Integer> regionList) {
        int region = regionList.get(pos);
        
        if (usedRegions.contains(region)) return false;
        
        for (int queenPos : existingQueens) {
            int qRow = queenPos / boardSize;
            int qCol = queenPos % boardSize;
            
            if (col == qCol) return false;
            if (Math.abs(row - qRow) == Math.abs(col - qCol)) return false;
        }
        
        return true;
    }
}
