package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;


@Service
public class DnCBacktrackingSolverService {

    private int n;
    private List<Integer> regions;
    private List<Integer> solution;
    
    // Bitmasks for efficient constraint tracking
    // cols: which columns are occupied
    // diag1: which main diagonals (row - col + n - 1) are occupied
    // diag2: which anti-diagonals (row + col) are occupied
    // regionMask: which regions already have queens
    
    // Solve using DnC backtracking
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
    
    private boolean dncQueens(int row, long cols, long diag1, long diag2, Set<Integer> regionMask) {
        if (row == n) {
            return true;  // Base case: all rows filled
        }

        // Collect valid columns for current row
        List<Integer> colsToTry = new ArrayList<>();
        for (int col = 0; col < n; col++) {
            if ((cols & (1L << col)) != 0) continue;
            if ((diag1 & (1L << (row - col + n - 1))) != 0) continue;
            if ((diag2 & (1L << (row + col))) != 0) continue;
            
            int position = row * n + col;
            int region = regions.get(position);
            
            if (regionMask.contains(region)) {
                continue;
            }
            
            colsToTry.add(col);
        }
        for (int col : colsToTry) {
            if ((cols & (1L << col)) != 0) continue;
            if ((diag1 & (1L << (row - col + n - 1))) != 0) continue;
            if ((diag2 & (1L << (row + col))) != 0) continue;
            
            int position = row * n + col;
            int region = regions.get(position);
            
            if (regionMask.contains(region)) {
                continue;
            }
            
            solution.add(position);
            
            long newCols = cols | (1L << col);
            long newDiag1 = diag1 | (1L << (row - col + n - 1));
            long newDiag2 = diag2 | (1L << (row + col));
            regionMask.add(region);
            
            if (dncQueens(row + 1, newCols, newDiag1, newDiag2, regionMask)) {
                return true;  // Solution found
            }
            
            solution.remove(solution.size() - 1);
            regionMask.remove(region);
        }
        
        // COMBINE: None of the children worked
        return false;  // FAIL
    }
    

    private boolean dncQueensParallel(int row, long cols, long diag1, long diag2, Set<Integer> regionMask) {
        if (row == n) {
            return true;
        }
        
        List<Integer> colsToTry = new ArrayList<>();
        for (int col = 0; col < n; col++) {
            // Check constraints
            if ((cols & (1L << col)) != 0) continue;
            if ((diag1 & (1L << (row - col + n - 1))) != 0) continue;
            if ((diag2 & (1L << (row + col))) != 0) continue;
            
            // Calculate position and region
            int position = row * n + col;
            int region = regions.get(position);
            
            // REGION CONSTRAINT: Check if region already has a queen
            if (regionMask.contains(region)) {
                continue;
            }
            
            colsToTry.add(col);
        }
        
        for (int col : colsToTry) {
            if ((cols & (1L << col)) != 0) continue;
            if ((diag1 & (1L << (row - col + n - 1))) != 0) continue;
            if ((diag2 & (1L << (row + col))) != 0) continue;
            
            int position = row * n + col;
            int region = regions.get(position);
            
            if (regionMask.contains(region)) {
                continue;
            }
            
            solution.add(position);
            
            long newCols = cols | (1L << col);
            long newDiag1 = diag1 | (1L << (row - col + n - 1));
            long newDiag2 = diag2 | (1L << (row + col));
            regionMask.add(region);
            
                if (dncQueensParallel(row + 1, newCols, newDiag1, newDiag2, regionMask)) {
                return true;
            }
            
            solution.remove(solution.size() - 1);
            regionMask.remove(region);
        }
        
        return false;
    }
    
    /**
     * Get DnC move
     */
    public int getDnCMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }
        
        this.n = gameState.getN();
        this.regions = gameState.getRegions();
        this.solution = new ArrayList<>(); // Start fresh for solver
        
        // Build current constraints from existing queens
        long cols = 0L;
        long diag1 = 0L;
        long diag2 = 0L;
        Set<Integer> regionMask = new HashSet<>();
        List<Integer> currentQueens = gameState.getQueenPositions();
        
        this.solution.addAll(currentQueens);
        
        boolean[] rowsOccupied = new boolean[n];
        for (int pos : currentQueens) {
            int r = pos / n;
            rowsOccupied[r] = true;
            
            int c = pos % n;
            cols |= (1L << c);
            diag1 |= (1L << (r - c + n - 1));
            diag2 |= (1L << (r + c));
            regionMask.add(regions.get(pos));
        }
        
        int startRow = -1;
        for(int r=0; r<n; r++) {
            if(!rowsOccupied[r]) {
                startRow = r;
                break;
            }
        }
        
        if (startRow == -1) return -1; // Board full
        
        // Run solver from startRow
        if (dncQueens(startRow, cols, diag1, diag2, regionMask)) {
             // The solution list now contains the full solution.
             // We need to find the move that corresponds to one of the new additions.
             // The first new addition would be at index `currentQueens.size()`
             if (solution.size() > currentQueens.size()) {
                 return solution.get(currentQueens.size());
             }
        }
        
        return -1; // No solution found
    }
}
