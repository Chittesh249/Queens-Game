package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Pure Backtracking Solver for Queens Game
 * 
 * Backtracking approach:
 * 1. Try a valid move
 * 2. Recursively solve from new state
 * 3. If solution found, return it
 * 4. If no solution, undo move (backtrack) and try next option
 */
@Service
public class BacktrackingSolverService {

    /**
     * Solve the Queens puzzle using pure backtracking
     */
    public QueensSolution solveBacktracking(int n, List<Integer> regions) {
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                "Invalid regions array. Expected size: " + (n * n));
        }
        
        List<Integer> solution = new ArrayList<>();
        Set<Integer> usedRegions = new HashSet<>();
        
        // Start backtracking from position 0
        boolean success = backtrack(0, n, regions, solution, usedRegions);
        
        if (success) {
            return new QueensSolution(new ArrayList<>(solution), true,
                "Solved using Pure Backtracking with region constraints");
        } else {
            return new QueensSolution(new ArrayList<>(), false,
                "No solution found using Backtracking");
        }
    }
    
    /**
     * Pure backtracking algorithm
     */
    private boolean backtrack(int position, int n, List<Integer> regions, 
                              List<Integer> solution, Set<Integer> usedRegions) {
        // BASE CASE: All queens placed successfully
        if (solution.size() == n) {
            return true;
        }
        
        // Try each position from current position to end
        for (int pos = position; pos < n * n; pos++) {
            int row = pos / n;
            int col = pos % n;
            int region = regions.get(pos);
            
            // Check if position is valid (not attacked and region not used)
            if (!isValid(pos, row, col, region, n, solution, regions, usedRegions)) {
                continue;
            }
            
            // DO: Place queen
            solution.add(pos);
            usedRegions.add(region);
            
            // RECURSE: Try to solve from next position
            if (backtrack(pos + 1, n, regions, solution, usedRegions)) {
                return true;  // Solution found!
            }
            
            // UNDO: Backtrack (remove queen)
            solution.remove(solution.size() - 1);
            usedRegions.remove(region);
        }
        
        // No valid solution found from this state
        return false;
    }
    
    /**
     * Check if a position is valid for placing a queen
     */
    private boolean isValid(int position, int row, int col, int region, int n,
                           List<Integer> solution, List<Integer> regions, Set<Integer> usedRegions) {
        // Check region constraint
        if (usedRegions.contains(region)) {
            return false;
        }
        
        // Check if attacked by any existing queen
        for (int queenPos : solution) {
            int qRow = queenPos / n;
            int qCol = queenPos % n;
            
            // Same row
            if (row == qRow) return false;
            
            // Same column
            if (col == qCol) return false;
            
            // Same diagonal (top-left to bottom-right)
            if ((row - col) == (qRow - qCol)) return false;
            
            // Same anti-diagonal (top-right to bottom-left)
            if ((row + col) == (qRow + qCol)) return false;
        }
        
        return true;
    }
    
    /**
     * Get backtracking AI move for the current game state
     */
    public int getBacktrackingMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }
        
        int n = gameState.getN();
        List<Integer> regions = gameState.getRegions();
        List<Integer> currentQueens = gameState.getQueenPositions();
        
        // Build used regions set
        Set<Integer> usedRegions = new HashSet<>();
        for (int pos : currentQueens) {
            usedRegions.add(regions.get(pos));
        }
        
        // Find next valid move using backtracking logic
        return findNextValidMove(n, regions, currentQueens, usedRegions);
    }
    
    /**
     * Find the next valid move for AI
     */
    private int findNextValidMove(int n, List<Integer> regions, 
                                  List<Integer> currentQueens, Set<Integer> usedRegions) {
        int startPos = 0;
        if (!currentQueens.isEmpty()) {
            // Start from row after last placed queen
            int lastPos = currentQueens.get(currentQueens.size() - 1);
            startPos = lastPos + 1;
        }
        
        // Try each position
        for (int pos = startPos; pos < n * n; pos++) {
            int row = pos / n;
            int col = pos % n;
            int region = regions.get(pos);
            
            // Check if valid
            if (!isValid(pos, row, col, region, n, currentQueens, regions, usedRegions)) {
                continue;
            }
            
            // Simulate placing queen
            List<Integer> testSolution = new ArrayList<>(currentQueens);
            Set<Integer> testRegions = new HashSet<>(usedRegions);
            testSolution.add(pos);
            testRegions.add(region);
            
            // Check if this leads to a solution (or at least has future moves)
            if (hasFutureMoves(pos + 1, n, regions, testSolution, testRegions)) {
                return pos;
            }
        }
        
        // No strategic move found, return first valid move
        for (int pos = startPos; pos < n * n; pos++) {
            int row = pos / n;
            int col = pos % n;
            int region = regions.get(pos);
            
            if (isValid(pos, row, col, region, n, currentQueens, regions, usedRegions)) {
                return pos;
            }
        }
        
        return -1;  // No valid move
    }
    
    /**
     * Check if there are future moves available from current state
     */
    private boolean hasFutureMoves(int startPos, int n, List<Integer> regions,
                                   List<Integer> currentQueens, Set<Integer> usedRegions) {
        // Simple check: see if at least one more valid position exists
        for (int pos = startPos; pos < n * n; pos++) {
            int row = pos / n;
            int col = pos % n;
            int region = regions.get(pos);
            
            if (isValid(pos, row, col, region, n, currentQueens, regions, usedRegions)) {
                return true;
            }
        }
        return false;
    }
    
    // ==================== TWO-PLAYER MINIMAX METHODS ====================
    
    private static final int MAX_DEPTH = 4;
    private static final int WIN_SCORE = 1000;
    private static final int LOSE_SCORE = -1000;
    
    /**
     * Get best move for two-player game using Minimax with Alpha-Beta pruning
     */
    public int getTwoPlayerMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }
        
        int n = gameState.getN();
        List<Integer> regions = gameState.getRegions();
        List<Integer> currentQueens = new ArrayList<>(gameState.getQueenPositions());
        
        Set<Integer> usedRegions = new HashSet<>();
        for (int pos : currentQueens) {
            usedRegions.add(regions.get(pos));
        }
        
        int row = currentQueens.size();
        
        int bestMove = -1;
        int bestScore = Integer.MIN_VALUE;
        
        // Try each valid move
        for (int col = 0; col < n; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);
            
            if (!isValidMove(pos, row, col, n, currentQueens, usedRegions, regions)) {
                continue;
            }
            
            // Make move
            currentQueens.add(pos);
            usedRegions.add(region);
            
            // Get score from minimax
            int score = minimax(row + 1, n, currentQueens, usedRegions, regions, 
                               MAX_DEPTH - 1, false, Integer.MIN_VALUE, Integer.MAX_VALUE);
            
            // Undo move
            currentQueens.remove(currentQueens.size() - 1);
            usedRegions.remove(region);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = pos;
            }
        }
        
        return bestMove;
    }
    
    /**
     * Minimax with Alpha-Beta pruning for two-player game
     * 
     * isMaximizing: true = AI's turn (maximize), false = opponent's turn (minimize)
     */
    private int minimax(int row, int n, List<Integer> queens, Set<Integer> usedRegions,
                        List<Integer> regions, int depth, boolean isMaximizing,
                        int alpha, int beta) {
        
        // Base case: depth limit or game over
        if (depth == 0 || row >= n) {
            return evaluatePosition(row, n, queens, usedRegions, regions);
        }
        
        // Get valid moves for current row
        List<Integer> moves = getValidMovesInRow(row, n, queens, usedRegions, regions);
        
        // No valid moves = current player loses
        if (moves.isEmpty()) {
            return isMaximizing ? LOSE_SCORE + depth : WIN_SCORE - depth;
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
                if (beta <= alpha) break; // Alpha-Beta prune
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
                if (beta <= alpha) break; // Alpha-Beta prune
            }
            return best;
        }
    }
    
    /**
     * Evaluate position at leaf node
     */
    private int evaluatePosition(int row, int n, List<Integer> queens,
                                 Set<Integer> usedRegions, List<Integer> regions) {
        // Count available moves for current player
        return getValidMovesInRow(row, n, queens, usedRegions, regions).size();
    }
    
    /**
     * Get valid moves in a specific row
     */
    private List<Integer> getValidMovesInRow(int row, int n, List<Integer> queens,
                                             Set<Integer> usedRegions, List<Integer> regions) {
        List<Integer> moves = new ArrayList<>();
        
        for (int col = 0; col < n; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);
            
            if (isValidMove(pos, row, col, n, queens, usedRegions, regions)) {
                moves.add(pos);
            }
        }
        
        return moves;
    }
    
    /**
     * Check if a move is valid
     */
    private boolean isValidMove(int pos, int row, int col, int n,
                                List<Integer> queens, Set<Integer> usedRegions,
                                List<Integer> regions) {
        int region = regions.get(pos);
        
        if (usedRegions.contains(region)) return false;
        
        for (int q : queens) {
            int qr = q / n;
            int qc = q % n;
            
            if (qc == col) return false;
            if (Math.abs(qr - row) == Math.abs(qc - col)) return false;
        }
        
        return true;
    }
}
