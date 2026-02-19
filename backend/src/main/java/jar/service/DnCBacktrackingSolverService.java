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

    // ===========================
    // SOLVE FULL BOARD USING DnC
    // ===========================
    public QueensSolution solveDnC(int n, List<Integer> regions) {

        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                    "Invalid regions array. Expected size: " + (n * n));
        }

        this.n = n;
        this.regions = regions;
        this.solution = new ArrayList<>();

        Set<Integer> remainingRows = new HashSet<>();
        for (int i = 0; i < n; i++) {
            remainingRows.add(i);
        }

        boolean success = dncQueens(remainingRows, 0L, 0L, 0L, new HashSet<>());

        if (success) {
            return new QueensSolution(new ArrayList<>(solution), true,
                    "Solved using DnC Backtracking with MRV + region constraints");
        } else {
            return new QueensSolution(new ArrayList<>(), false,
                    "No solution found using DnC Backtracking");
        }
    }

    // ===========================================
    // PURE DnC + BACKTRACKING WITH MRV HEURISTIC
    // ===========================================
    private boolean dncQueens(Set<Integer> remainingRows,
                              long cols,
                              long diag1,
                              long diag2,
                              Set<Integer> regionMask) {

        if (remainingRows.isEmpty()) {
            return true;
        }

        int selectedRow = findRowWithMinValidPlacements(
                remainingRows, cols, diag1, diag2, regionMask);

        if (selectedRow == -1) {
            return false;
        }

        List<Integer> validCols = new ArrayList<>();

        for (int col = 0; col < n; col++) {

            if ((cols & (1L << col)) != 0) continue;
            if ((diag1 & (1L << (selectedRow - col + n - 1))) != 0) continue;
            if ((diag2 & (1L << (selectedRow + col))) != 0) continue;

            int position = selectedRow * n + col;
            int region = regions.get(position);

            if (regionMask.contains(region)) continue;

            validCols.add(col);
        }

        for (int col : validCols) {

            int position = selectedRow * n + col;
            int region = regions.get(position);

            solution.add(position);

            long newCols = cols | (1L << col);
            long newDiag1 = diag1 | (1L << (selectedRow - col + n - 1));
            long newDiag2 = diag2 | (1L << (selectedRow + col));
            regionMask.add(region);

            remainingRows.remove(selectedRow);

            if (dncQueens(remainingRows, newCols, newDiag1, newDiag2, regionMask)) {
                return true;
            }

            // BACKTRACK
            remainingRows.add(selectedRow);
            regionMask.remove(region);
            solution.remove(solution.size() - 1);
        }

        return false;
    }

    // ===========================================
    // MRV HELPER
    // ===========================================
    private int findRowWithMinValidPlacements(Set<Integer> remainingRows,
                                              long cols,
                                              long diag1,
                                              long diag2,
                                              Set<Integer> regionMask) {

        int minCount = Integer.MAX_VALUE;
        int bestRow = -1;

        for (int row : remainingRows) {

            int validCount = 0;

            for (int col = 0; col < n; col++) {

                if ((cols & (1L << col)) != 0) continue;
                if ((diag1 & (1L << (row - col + n - 1))) != 0) continue;
                if ((diag2 & (1L << (row + col))) != 0) continue;

                int position = row * n + col;
                int region = regions.get(position);

                if (regionMask.contains(region)) continue;

                validCount++;
            }

            if (validCount == 0) {
                return -1; // Early prune
            }

            if (validCount < minCount) {
                minCount = validCount;
                bestRow = row;
            }
        }

        return bestRow;
    }

    // ===========================================
    // GAME MOVE LOGIC (FIXED)
    // ===========================================
    public int getDnCMove(GameState gameState) {

        if (gameState.isGameOver()) {
            return -1;
        }

        this.n = gameState.getN();
        this.regions = gameState.getRegions();

        List<Integer> currentQueens = gameState.getQueenPositions();
        List<Integer> validMoves = new ArrayList<>();

        // Collect all valid moves
        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {

                int position = row * n + col;

                if (currentQueens.contains(position)) continue;

                if (isPositionSafeForMove(position, currentQueens, n, regions)) {
                    validMoves.add(position);
                }
            }
        }

        if (validMoves.isEmpty()) {
            return -1; // AI loses
        }

        // Try to find winning move
        for (int move : validMoves) {

            List<Integer> tempQueens = new ArrayList<>(currentQueens);
            tempQueens.add(move);

            if (!opponentHasMove(tempQueens)) {
                return move; // Winning move
            }
        }

        // Otherwise play first valid move
        return validMoves.get(0);
    }

    // ===========================================
    // CHECK IF OPPONENT HAS A MOVE
    // ===========================================
    private boolean opponentHasMove(List<Integer> queens) {

        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {

                int position = row * n + col;

                if (queens.contains(position)) continue;

                if (isPositionSafeForMove(position, queens, n, regions)) {
                    return true;
                }
            }
        }

        return false;
    }

    // ===========================================
    // SAFETY CHECK
    // ===========================================
    private boolean isPositionSafeForMove(int position,
                                          List<Integer> queenPositions,
                                          int n,
                                          List<Integer> regions) {

        int row = position / n;
        int col = position % n;
        int region = regions.get(position);

        for (int queenPos : queenPositions) {

            int qRow = queenPos / n;
            int qCol = queenPos % n;

            if (regions.get(queenPos) == region) return false;
            if (row == qRow) return false;
            if (col == qCol) return false;
            if ((row - col) == (qRow - qCol)) return false;
            if ((row + col) == (qRow + qCol)) return false;
        }

        return true;
    }
}
