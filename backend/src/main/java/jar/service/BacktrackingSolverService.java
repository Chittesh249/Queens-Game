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
}
