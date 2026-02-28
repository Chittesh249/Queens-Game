package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Branch and Bound Solver for the Queens Game using pruning.
 *
 * Objective:
 * - Maximize the number of queens placed on the board
 * - Subject to:
 *   1. No two queens attack each other (rows, columns, diagonals)
 *   2. At most one queen per region
 *
 * Branch and Bound Strategy:
 * - Branch: for each row, either place a queen in a valid column or skip the row
 * - Bound: compute an optimistic upper bound on how many additional queens can be placed:
 *     currentQueens + min(remainingRows, remainingUnusedRegions)
 *   If this upper bound is not better than the best solution found so far, prune the branch.
 *
 * This guarantees that the returned solution (which may be partial) uses the
 * maximum possible number of queens consistent with the constraints.
 */
@Service
public class BranchAndBoundSolverService {

    private int n;
    private List<Integer> regions;
    private Set<Integer> allRegions;

    private List<Integer> bestSolution;
    private int bestScore;

    /**
     * Solve the Queens puzzle using Branch and Bound with pruning.
     *
     * @param n       board size (n x n)
     * @param regions region id for each cell (size must be n * n)
     * @return best solution found and whether it places n queens
     */
    public QueensSolution solveBranchAndBound(int n, List<Integer> regions) {
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                "Invalid regions array. Expected size: " + (n * n));
        }

        this.n = n;
        this.regions = regions;
        this.allRegions = new HashSet<>(regions);

        this.bestSolution = new ArrayList<>();
        this.bestScore = 0;

        boolean[] cols = new boolean[n];
        boolean[] diag1 = new boolean[2 * n - 1]; // row - col + (n - 1)
        boolean[] diag2 = new boolean[2 * n - 1]; // row + col
        Set<Integer> usedRegions = new HashSet<>();
        List<Integer> current = new ArrayList<>();

        branchAndBound(0, cols, diag1, diag2, usedRegions, current);

        boolean solved = bestScore == n;
        String message;
        if (solved) {
            message = "Solved using Branch and Bound with pruning.";
        } else {
            message = "Best partial solution using Branch and Bound with pruning. "
                    + "Placed " + bestScore + " queens.";
        }

        return new QueensSolution(new ArrayList<>(bestSolution), solved, message);
    }

    /**
     * Get a single AI move using Branch and Bound, starting from the current game state.
     * This evaluates each valid move and selects the one that leads to the highest
     * total number of queens after optimal completion (according to Branch and Bound).
     *
     * @param gameState current game state
     * @return best move position, or -1 if no valid moves
     */
    public int getBranchAndBoundMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }

        int boardSize = gameState.getN();
        List<Integer> regionsList = gameState.getRegions();
        List<Integer> queenPositions = gameState.getQueenPositions();

        List<Integer> validMoves = getAllValidPositions(gameState);
        if (validMoves.isEmpty()) {
            return -1;
        }

        int existingQueens = queenPositions.size();
        int bestMove = -1;
        int bestTotalQueens = -1;

        // Evaluate each valid move using Branch and Bound completion
        for (int movePos : validMoves) {
            // Initialize shared state for this candidate
            this.n = boardSize;
            this.regions = regionsList;
            this.allRegions = new HashSet<>(regionsList);
            this.bestSolution = new ArrayList<>();
            this.bestScore = 0;

            boolean[] cols = new boolean[n];
            boolean[] diag1 = new boolean[2 * n - 1];
            boolean[] diag2 = new boolean[2 * n - 1];
            Set<Integer> usedRegions = new HashSet<>();

            // Mark constraints from already placed queens (fixed)
            for (int qPos : queenPositions) {
                int r = qPos / n;
                int c = qPos % n;
                int d1Index = r - c + (n - 1);
                int d2Index = r + c;
                cols[c] = true;
                diag1[d1Index] = true;
                diag2[d2Index] = true;
                usedRegions.add(regionsList.get(qPos));
            }

            // Place the candidate move
            int row = movePos / n;
            int col = movePos % n;
            int d1Index = row - col + (n - 1);
            int d2Index = row + col;
            int region = regionsList.get(movePos);

            // Safety check – should already be valid, but guard against conflicting constraints
            if (cols[col] || diag1[d1Index] || diag2[d2Index] || usedRegions.contains(region)) {
                continue;
            }

            cols[col] = true;
            diag1[d1Index] = true;
            diag2[d2Index] = true;
            usedRegions.add(region);

            List<Integer> current = new ArrayList<>();
            current.add(movePos);

            // Run Branch and Bound from this candidate
            branchAndBound(0, cols, diag1, diag2, usedRegions, current);

            int totalQueens = existingQueens + bestScore;
            if (totalQueens > bestTotalQueens) {
                bestTotalQueens = totalQueens;
                bestMove = movePos;
            }
        }

        return bestMove;
    }

    /**
     * Recursive Branch and Bound search.
     *
     * @param row         current row index (0-based)
     * @param cols        columns that already have queens
     * @param diag1       main diagonals that already have queens
     * @param diag2       anti-diagonals that already have queens
     * @param usedRegions regions that already contain a queen
     * @param current     current partial solution (positions)
     */
    private void branchAndBound(int row,
                                boolean[] cols,
                                boolean[] diag1,
                                boolean[] diag2,
                                Set<Integer> usedRegions,
                                List<Integer> current) {
        int placed = current.size();

        // Update best solution seen so far
        if (placed > bestScore) {
            bestScore = placed;
            bestSolution = new ArrayList<>(current);

            // Optimal solution found: cannot place more than n queens
            if (bestScore == n) {
                return;
            }
        }

        // All rows processed
        if (row == n) {
            return;
        }

        // Branch and Bound: compute optimistic upper bound
        int remainingRows = n - row;
        int remainingRegions = allRegions.size() - usedRegions.size();
        int upperBound = placed + Math.min(remainingRows, remainingRegions);

        // If even the optimistic bound cannot beat current best, prune
        if (upperBound <= bestScore) {
            return;
        }

        // BRANCH 1: Try placing a queen in each valid column of this row
        for (int col = 0; col < n; col++) {
            if (cols[col]) {
                continue;
            }

            int d1Index = row - col + (n - 1);
            int d2Index = row + col;

            if (diag1[d1Index] || diag2[d2Index]) {
                continue;
            }

            int position = row * n + col;
            int region = regions.get(position);

            if (usedRegions.contains(region)) {
                continue;
            }

            // Place queen
            cols[col] = true;
            diag1[d1Index] = true;
            diag2[d2Index] = true;
            usedRegions.add(region);
            current.add(position);

            branchAndBound(row + 1, cols, diag1, diag2, usedRegions, current);

            // Undo placement
            current.remove(current.size() - 1);
            usedRegions.remove(region);
            cols[col] = false;
            diag1[d1Index] = false;
            diag2[d2Index] = false;

            // If an optimal solution (n queens) was found deeper in the tree, stop exploring
            if (bestScore == n) {
                return;
            }
        }

        // BRANCH 2: Skip this row (allowing partial solutions with fewer than n queens)
        branchAndBound(row + 1, cols, diag1, diag2, usedRegions, current);
    }

    /**
     * Get all valid positions for the current game state using standard safety rules.
     */
    private List<Integer> getAllValidPositions(GameState gameState) {
        List<Integer> validMoves = new ArrayList<>();
        int boardSize = gameState.getN();
        List<Integer> regionsList = gameState.getRegions();
        List<Integer> queenPositions = gameState.getQueenPositions();

        for (int pos = 0; pos < boardSize * boardSize; pos++) {
            if (isSafe(pos, queenPositions, boardSize, regionsList)) {
                validMoves.add(pos);
            }
        }

        return validMoves;
    }

    /**
     * Check if placing a queen at the given position is safe with respect to
     * existing queens and region constraints.
     */
    private boolean isSafe(int position, List<Integer> queenPositions, int n,
                           List<Integer> regionsList) {
        int row = position / n;
        int col = position % n;
        int region = regionsList.get(position);

        // Region constraint: at most one queen per region
        for (int queenPos : queenPositions) {
            if (regionsList.get(queenPos) == region) {
                return false;
            }
        }

        // Attack constraints
        for (int queenPos : queenPositions) {
            int qRow = queenPos / n;
            int qCol = queenPos % n;

            if (row == qRow) return false;
            if (col == qCol) return false;
            if ((row - col) == (qRow - qCol)) return false;
            if ((row + col) == (qRow + qCol)) return false;
        }

        return true;
    }
}

