package jar.service;

import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class QueensSolverService {

    /**
     * Greedy algorithm to solve the Queens game.
     * Places N queens such that:
     * 1. No two queens attack each other (same row, column, or diagonal)
     * 2. Each region has exactly one queen
     * 
     * Strategy: At each step, place a queen in the region with the fewest valid positions,
     * choosing the position with the minimum conflicts.
     */
    public QueensSolution solveGreedy(int n, List<Integer> regions) {
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false, 
                "Invalid regions array. Expected size: " + (n * n));
        }

        // Track which regions have queens
        Set<Integer> regionsWithQueens = new HashSet<>();
        // Track queen positions (row * n + col)
        List<Integer> queenPositions = new ArrayList<>();
        // Track which cells are attacked
        boolean[] attacked = new boolean[n * n];

        // Group cells by region
        Map<Integer, List<Integer>> regionCells = new HashMap<>();
        for (int i = 0; i < regions.size(); i++) {
            int region = regions.get(i);
            regionCells.computeIfAbsent(region, k -> new ArrayList<>()).add(i);
        }

        // Greedy placement: process regions in order of increasing available positions
        List<Integer> regionsToProcess = new ArrayList<>(regionCells.keySet());
        
        // Sort regions by number of available cells (fewer options first)
        regionsToProcess.sort(Comparator.comparingInt(r -> regionCells.get(r).size()));

        for (int region : regionsToProcess) {
            List<Integer> candidates = regionCells.get(region);
            
            // Find the best position in this region
            int bestPosition = -1;
            int minConflicts = Integer.MAX_VALUE;

            for (int pos : candidates) {
                if (attacked[pos]) {
                    continue; // Skip attacked positions
                }

                // Count conflicts with already placed queens
                int conflicts = countConflicts(pos, queenPositions, n);
                
                if (conflicts < minConflicts) {
                    minConflicts = conflicts;
                    bestPosition = pos;
                }
            }

            if (bestPosition == -1) {
                // No valid position found for this region
                return new QueensSolution(queenPositions, false, 
                    "Cannot place queen in region " + region + ". No valid positions available.");
            }

            // Place queen at best position
            queenPositions.add(bestPosition);
            regionsWithQueens.add(region);
            
            // Mark all attacked cells
            markAttackedCells(bestPosition, attacked, n);
        }

        // Verify solution
        if (queenPositions.size() == n && regionsWithQueens.size() == n) {
            return new QueensSolution(queenPositions, true, 
                "Successfully placed " + n + " queens using greedy algorithm.");
        } else {
            return new QueensSolution(queenPositions, false, 
                "Partial solution: placed " + queenPositions.size() + " queens.");
        }
    }

    /**
     * Count conflicts between a candidate position and already placed queens.
     */
    private int countConflicts(int position, List<Integer> queenPositions, int n) {
        int row = position / n;
        int col = position % n;
        int conflicts = 0;

        for (int queenPos : queenPositions) {
            int qRow = queenPos / n;
            int qCol = queenPos % n;

            // Same row
            if (row == qRow) conflicts++;
            // Same column
            if (col == qCol) conflicts++;
            // Same diagonal (top-left to bottom-right)
            if ((row - col) == (qRow - qCol)) conflicts++;
            // Same anti-diagonal (top-right to bottom-left)
            if ((row + col) == (qRow + qCol)) conflicts++;
        }

        return conflicts;
    }

    /**
     * Mark all cells attacked by a queen at the given position.
     */
    private void markAttackedCells(int position, boolean[] attacked, int n) {
        int row = position / n;
        int col = position % n;

        // Mark same row
        for (int c = 0; c < n; c++) {
            attacked[row * n + c] = true;
        }

        // Mark same column
        for (int r = 0; r < n; r++) {
            attacked[r * n + col] = true;
        }

        // Mark diagonals
        for (int d = 1; d < n; d++) {
            // Top-left to bottom-right diagonal
            int r1 = row + d;
            int c1 = col + d;
            if (r1 < n && c1 < n) {
                attacked[r1 * n + c1] = true;
            }

            int r2 = row - d;
            int c2 = col - d;
            if (r2 >= 0 && c2 >= 0) {
                attacked[r2 * n + c2] = true;
            }

            // Top-right to bottom-left diagonal
            int r3 = row + d;
            int c3 = col - d;
            if (r3 < n && c3 >= 0) {
                attacked[r3 * n + c3] = true;
            }

            int r4 = row - d;
            int c4 = col + d;
            if (r4 >= 0 && c4 < n) {
                attacked[r4 * n + c4] = true;
            }
        }
    }
}

