package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Divide and Conquer Backtracking Solver for Queens Game
 * 
 * DnC_Queens(row, cols, diag1, diag2, regionMask):
 *     if row == n:
 *         return SUCCESS
 *     
 *     // DIVIDE: generate all valid moves for this row
 *     availableCols = ALL_COLS minus (cols OR diag1 OR diag2)
 *     
 *     for each col in availableCols:
 *         if region constraint used:
 *             region = regions[row][col]
 *             if regionMask contains region: continue
 *         
 *         // choose move (place queen) --- backtracking "do"
 *         mark col, diag1, diag2, region
 *         
 *         // CONQUER: solve smaller subproblem (next row)
 *         if DnC_Queens(row + 1, updated masks...) == SUCCESS:
 *             return SUCCESS
 *         
 *         // undo move --- backtracking "undo"
 *         unmark col, diag1, diag2, region
 *     
 *     // COMBINE: if none of the children worked
 *     return FAIL
 */
@Service
public class DnCBacktrackingSolverService {

    private int n;
    private List<Integer> regions;
    private List<Integer> solution;
    
    /**
     * Solve the Queens puzzle using DnC backtracking
     */
    public QueensSolution solveDnC(int n, List<Integer> regions) {
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                "Invalid regions array. Expected size: " + (n * n));
        }
        
        this.n = n;
        this.regions = regions;
        this.solution = new ArrayList<>();
        
        // Start DnC from row 0 with empty constraints
        boolean success = dncQueens(0, 0L, 0L, 0L, new HashSet<>());
        
        if (success) {
            return new QueensSolution(new ArrayList<>(solution), true,
                "Solved using DnC Backtracking with region constraints");
        } else {
            return new QueensSolution(new ArrayList<>(), false,
                "No solution found using DnC Backtracking");
        }
    }
    
    /**
     * Core DnC algorithm with backtracking
     */
    private boolean dncQueens(int row, long cols, long diag1, long diag2, Set<Integer> regionMask) {
        // BASE CASE: All rows processed successfully
        if (row == n) {
            return true;  // SUCCESS
        }
        
        // DIVIDE: Generate all valid columns for this row
        long available = ((1L << n) - 1) & ~(cols | (diag1 >> (row + n - 1)) | (diag2 >> row));
        
        // Try each valid column
        for (int col = 0; col < n; col++) {
            // Check if column is available
            if ((available & (1L << col)) == 0) {
                continue;
            }
            
            // Calculate position and region
            int position = row * n + col;
            int region = regions.get(position);
            
            // REGION CONSTRAINT: Check if region already has a queen
            if (regionMask.contains(region)) {
                continue;
            }
            
            // CHOOSE: Place queen (backtracking "do")
            solution.add(position);
            
            // Calculate diagonal masks
            int d1 = row - col + n - 1;  // Main diagonal
            int d2 = row + col;          // Anti-diagonal
            
            // Update masks
            long newCols = cols | (1L << col);
            long newDiag1 = diag1 | (1L << d1);
            long newDiag2 = diag2 | (1L << d2);
            regionMask.add(region);
            
            // CONQUER: Recursively solve for next row (smaller subproblem)
            if (dncQueens(row + 1, newCols, newDiag1, newDiag2, regionMask)) {
                return true;  // Solution found!
            }
            
            // UNDO: Backtrack (remove queen)
            solution.remove(solution.size() - 1);
            regionMask.remove(region);
        }
        
        // COMBINE: None of the children worked
        return false;  // FAIL
    }
    
    /**
     * Get DnC AI move for the current game state
     */
    public int getDnCMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }
        
        this.n = gameState.getN();
        this.regions = gameState.getRegions();
        this.solution = new ArrayList<>(gameState.getQueenPositions());
        
        // Build current constraints from existing queens
        long cols = 0L;
        long diag1 = 0L;
        long diag2 = 0L;
        Set<Integer> regionMask = new HashSet<>();
        
        int row = 0;
        for (int pos : gameState.getQueenPositions()) {
            int r = pos / n;
            int c = pos % n;
            cols |= (1L << c);
            diag1 |= (1L << (r - c + n - 1));
            diag2 |= (1L << (r + c));
            regionMask.add(regions.get(pos));
            row = r + 1;
        }
        
        // Find next valid move using DnC
        return findNextMove(row, cols, diag1, diag2, regionMask);
    }
    
    /**
     * Find the best next move using DnC approach
     */
    private int findNextMove(int row, long cols, long diag1, long diag2, Set<Integer> regionMask) {
        if (row >= n) {
            return -1;
        }
        
        // Generate valid columns for this row
        long available = ((1L << n) - 1) & ~(cols | (diag1 >> (row + n - 1)) | (diag2 >> row));
        
        for (int col = 0; col < n; col++) {
            if ((available & (1L << col)) == 0) {
                continue;
            }
            
            int position = row * n + col;
            int region = regions.get(position);
            
            // Check region constraint
            if (regionMask.contains(region)) {
                continue;
            }
            
            return position;  // Return first valid move
        }
        
        return -1;  // No valid move
    }
}
