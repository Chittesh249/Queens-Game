package jar.service;

import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DynamicProgrammingSolverService {

    /**
     * Solves the N-Queens problem with Regions constraint using Dynamic Programming (Memoization).
     * 
     * Optimization:
     * - Uses bitmasks for columns, diagonals, and regions.
     * - Maps arbitrary region IDs to 0..N-1 to allow bitmask usage.
     * - Memorizes states to avoid re-computing known dead-ends.
     */
    public QueensSolution solveDP(int n, List<Integer> regions) {
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                "Invalid regions array. Expected size: " + (n * n));
        }

        // 1. Map Regions to 0..N-1 for bitmasking
        // We need to know which region ID corresponds to which bit index.
        Set<Integer> uniqueRegions = new HashSet<>(regions);
        if (uniqueRegions.size() != n) {
             return new QueensSolution(new ArrayList<>(), false,
                "Invalid number of regions. Expected " + n + ", found " + uniqueRegions.size());
        }

        List<Integer> sortedUniqueRegions = new ArrayList<>(uniqueRegions);
        Collections.sort(sortedUniqueRegions);
        Map<Integer, Integer> regionIdToBitIndex = new HashMap<>();
        for (int i = 0; i < sortedUniqueRegions.size(); i++) {
            regionIdToBitIndex.put(sortedUniqueRegions.get(i), i);
        }

        // 2. Prepare board with mapped region indices
        // boardRegionBits[row][col] = bit index of the region at that cell
        int[][] boardRegionBits = new int[n][n];
        for (int i = 0; i < regions.size(); i++) {
            int r = i / n;
            int c = i % n;
            boardRegionBits[r][c] = regionIdToBitIndex.get(regions.get(i));
        }

        // 3. Memoization cache
        // Key: unique state string
        // Value: Boolean (true if solvable)
        Map<String, Boolean> memo = new HashMap<>();

        // 4. Solution container
        List<Integer> solution = new ArrayList<>();

        // Start recursion
        boolean found = solveRecursive(0, n, boardRegionBits, 0L, 0L, 0L, 0L, solution, memo);

        if (found) {
            return new QueensSolution(solution, true, 
                "Solved using Dynamic Programming (Memoization with Bitmasks).");
        } else {
            return new QueensSolution(new ArrayList<>(), false, 
                "No solution found using Dynamic Programming.");
        }
    }

    /**
     * Recursive backtracking with memoization.
     * 
     * @param row Current row index (0 to n-1)
     * @param n Board size
     * @param boardRegionBits 2D array mapping cells to region bit indices
     * @param colMask Bitmask of occupied columns
     * @param diagMask Bitmask of occupied main diagonals (row - col + n - 1)
     * @param antiDiagMask Bitmask of occupied anti-diagonals (row + col)
     * @param regionMask Bitmask of occupied regions
     * @param solution List of queen positions (linear indices)
     * @param memo Memoization map
     * @return true if solution found
     */
    private boolean solveRecursive(int row, int n, int[][] boardRegionBits, 
                                   long colMask, long diagMask, long antiDiagMask, long regionMask,
                                   List<Integer> solution, 
                                   Map<String, Boolean> memo) {
        
        // Base case: All rows processed
        if (row == n) {
            return true;
        }

        // Memoization Key Generation
        // State is uniquely defined by (row, colMask, diagMask, antiDiagMask, regionMask)
        // Since we process row by row, 'row' is implicit? No, different paths can reach same masks?
        // Actually, if we fill row by row, row is fixed for a given recursion depth.
        // But for clarity and uniqueness in a global map, we include it or use Map<Int, Map<...>>
        // A string key is simplest: "row|col|diag|anti|region"
        String key = row + "|" + colMask + "|" + diagMask + "|" + antiDiagMask + "|" + regionMask;

        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        // Try all columns in current row
        for (int col = 0; col < n; col++) {
            // 1. Column Check
            if ((colMask & (1L << col)) != 0) continue;

            // 2. Diagonal Check (Main: row - col)
            // Shift by N to make non-negative: (row - col + n)
            // Or typically: (row - col + n - 1) ranges from 0 to 2N-2
            int diagIdx = row - col + n; 
            if ((diagMask & (1L << diagIdx)) != 0) continue;

            // 3. Anti-Diagonal Check (row + col)
            int antiDiagIdx = row + col;
            if ((antiDiagMask & (1L << antiDiagIdx)) != 0) continue;

            // 4. Region Check
            int regionBitIdx = boardRegionBits[row][col];
            if ((regionMask & (1L << regionBitIdx)) != 0) continue;

            // Place Queen
            solution.add(row * n + col);

            // Recurse
            boolean result = solveRecursive(row + 1, n, boardRegionBits, 
                                            colMask | (1L << col), 
                                            diagMask | (1L << diagIdx), 
                                            antiDiagMask | (1L << antiDiagIdx), 
                                            regionMask | (1L << regionBitIdx), 
                                            solution, 
                                            memo);
            
            if (result) {
                return true; // Found solution, bubble up true
            }

            // Backtrack
            solution.remove(solution.size() - 1);
        }

        // If we tried all columns and found no solution from this state
        memo.put(key, false);
        return false;
    }
}
