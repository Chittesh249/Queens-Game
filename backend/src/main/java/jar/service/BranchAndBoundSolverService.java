package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Branch and Bound (Alpha-Beta) Minimax Solver for the Queens Game.
 *
 * This reuses the Minimax DP approach but adds alpha-beta pruning to
 * aggressively cut branches that cannot influence the final decision.
 *
 * - State representation and evaluation follow {@link MinimaxDpSolverService}.
 * - Branch-and-bound is implemented via alpha (best for maximizer so far)
 *   and beta (best for minimizer so far) bounds.
 */
@Service
public class BranchAndBoundSolverService {

    private static final int WIN_SCORE = 10000;
    private static final int LOSE_SCORE = -10000;
    private static final int MAX_DEPTH = 6; // keep consistent with MinimaxDpSolverService

    /**
     * Solve the puzzle from an empty board using alpha-beta Minimax.
     */
    public QueensSolution solveBranchAndBound(int n, List<Integer> regions) {
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                "Invalid regions array. Expected size: " + (n * n));
        }

        GameState gameState = new GameState(n, regions);

        Map<String, AlphaBetaResult> memo = new HashMap<>();
        AlphaBetaResult result = alphaBetaSolve(
            gameState,
            0,
            true,
            Integer.MIN_VALUE,
            Integer.MAX_VALUE,
            memo
        );

        if (result != null && result.moveSequence != null) {
            return new QueensSolution(result.moveSequence, true,
                "Solved using Branch and Bound (alpha-beta Minimax) with score: " + result.score);
        }

        return new QueensSolution(new ArrayList<>(), false,
            "No valid solution found using Branch and Bound (alpha-beta Minimax).");
    }

    /**
     * Get a single AI move for the current game state using alpha-beta Minimax.
     */
    public int getBranchAndBoundMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }

        Map<String, AlphaBetaResult> memo = new HashMap<>();
        AlphaBetaResult result = alphaBeta(
            gameState,
            0,
            true,
            Integer.MIN_VALUE,
            Integer.MAX_VALUE,
            memo
        );
        return result != null ? result.bestMove : -1;
    }

    // ---------- Core Alpha-Beta Minimax with Memoization ----------

    /**
     * Full-solution alpha-beta Minimax with memoization, returning best
     * score and sequence of moves.
     */
    private AlphaBetaResult alphaBetaSolve(GameState gameState,
                                           int depth,
                                           boolean isMaximizing,
                                           int alpha,
                                           int beta,
                                           Map<String, AlphaBetaResult> memo) {
        String key = generateKey(gameState, depth, isMaximizing);
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        List<Integer> validMoves = getAllValidPositions(gameState);

        // Base case: no valid moves -> current player loses
        if (validMoves.isEmpty()) {
            int score = isMaximizing ? LOSE_SCORE + depth : WIN_SCORE - depth;
            AlphaBetaResult result = new AlphaBetaResult(score, new ArrayList<>(), -1);
            memo.put(key, result);
            return result;
        }

        // Base case: depth limit -> heuristic evaluation
        if (depth >= MAX_DEPTH) {
            int score = evaluateGameState(gameState, isMaximizing);
            AlphaBetaResult result = new AlphaBetaResult(score, new ArrayList<>(), -1);
            memo.put(key, result);
            return result;
        }

        // Heuristic ordering: prefer moves closer to the center
        validMoves.sort((a, b) -> {
            int n = gameState.getN();
            int center = n / 2;
            int distA = Math.abs((a / n) - center) + Math.abs((a % n) - center);
            int distB = Math.abs((b / n) - center) + Math.abs((b % n) - center);
            return Integer.compare(distA, distB);
        });

        AlphaBetaResult bestResult = null;
        int bestScore = isMaximizing ? Integer.MIN_VALUE : Integer.MAX_VALUE;
        int bestMove = -1;

        for (int move : validMoves) {
            GameState newState = makeMove(gameState, move);

            AlphaBetaResult child = alphaBetaSolve(
                newState,
                depth + 1,
                !isMaximizing,
                alpha,
                beta,
                memo
            );

            if (child == null) {
                continue;
            }

            int score = child.score;

            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                    bestResult = child;
                }
                alpha = Math.max(alpha, bestScore);
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                    bestResult = child;
                }
                beta = Math.min(beta, bestScore);
            }

            // Branch and Bound: prune when the interval collapses
            if (beta <= alpha) {
                break;
            }
        }

        if (bestResult != null) {
            List<Integer> sequence = new ArrayList<>();
            sequence.add(bestMove);
            sequence.addAll(bestResult.moveSequence);
            AlphaBetaResult result = new AlphaBetaResult(bestScore, sequence, bestMove);
            memo.put(key, result);
            return result;
        }

        return null;
    }

    /**
     * Alpha-beta Minimax tailored for picking just the next move.
     */
    private AlphaBetaResult alphaBeta(GameState gameState,
                                      int depth,
                                      boolean isMaximizing,
                                      int alpha,
                                      int beta,
                                      Map<String, AlphaBetaResult> memo) {
        String key = generateKey(gameState, depth, isMaximizing);
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        List<Integer> validMoves = getAllValidPositions(gameState);

        // Base: no moves -> current player loses
        if (validMoves.isEmpty()) {
            int score = isMaximizing ? LOSE_SCORE + depth : WIN_SCORE - depth;
            AlphaBetaResult result = new AlphaBetaResult(score, new ArrayList<>(), -1);
            memo.put(key, result);
            return result;
        }

        // Base: depth limit
        if (depth >= MAX_DEPTH) {
            int score = evaluateGameState(gameState, isMaximizing);
            AlphaBetaResult result = new AlphaBetaResult(score, new ArrayList<>(), -1);
            memo.put(key, result);
            return result;
        }

        // Move ordering as above
        validMoves.sort((a, b) -> {
            int n = gameState.getN();
            int center = n / 2;
            int distA = Math.abs((a / n) - center) + Math.abs((a % n) - center);
            int distB = Math.abs((b / n) - center) + Math.abs((b % n) - center);
            return Integer.compare(distA, distB);
        });

        int bestMove = -1;
        int bestScore = isMaximizing ? Integer.MIN_VALUE : Integer.MAX_VALUE;

        for (int move : validMoves) {
            GameState newState = makeMove(gameState, move);

            AlphaBetaResult child = alphaBeta(
                newState,
                depth + 1,
                !isMaximizing,
                alpha,
                beta,
                memo
            );

            if (child == null) {
                continue;
            }

            int score = child.score;

            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, bestScore);
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                beta = Math.min(beta, bestScore);
            }

            if (beta <= alpha) {
                break;
            }
        }

        AlphaBetaResult result = new AlphaBetaResult(bestScore, new ArrayList<>(), bestMove);
        memo.put(key, result);
        return result;
    }

    // ---------- Helper methods (mirroring MinimaxDpSolverService) ----------

    private String generateKey(GameState gameState, int depth, boolean isMaximizing) {
        List<Integer> sortedQueens = new ArrayList<>(gameState.getQueenPositions());
        Collections.sort(sortedQueens);
        return sortedQueens.toString() + "|" + gameState.getCurrentPlayer() + "|" + depth + "|" + isMaximizing;
    }

    private GameState makeMove(GameState gameState, int position) {
        GameState newState = new GameState();
        newState.setN(gameState.getN());
        newState.setRegions(new ArrayList<>(gameState.getRegions()));
        newState.setQueenPositions(new ArrayList<>(gameState.getQueenPositions()));
        newState.getQueenPositions().add(position);
        newState.setCurrentPlayer(gameState.getCurrentPlayer() == 1 ? 2 : 1);
        newState.setGameOver(false);
        newState.setPlayer1Queens(gameState.getPlayer1Queens());
        newState.setPlayer2Queens(gameState.getPlayer2Queens());
        return newState;
    }

    private List<Integer> getAllValidPositions(GameState gameState) {
        List<Integer> validMoves = new ArrayList<>();
        int n = gameState.getN();
        List<Integer> regions = gameState.getRegions();
        List<Integer> queenPositions = gameState.getQueenPositions();

        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {
                int position = row * n + col;
                if (isSafe(queenPositions, position, n, regions)) {
                    validMoves.add(position);
                }
            }
        }

        return validMoves;
    }

    private boolean isSafe(List<Integer> queenPositions, int position, int n, List<Integer> regions) {
        int row = position / n;
        int col = position % n;
        int region = regions.get(position);

        // Region constraint: at most one queen per region
        for (int queenPos : queenPositions) {
            if (regions.get(queenPos) == region) {
                return false;
            }
        }

        // Attacks: row, column, and diagonals
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

    private int evaluateGameState(GameState gameState, boolean isMaximizingPlayer) {
        int n = gameState.getN();
        List<Integer> queenPositions = gameState.getQueenPositions();
        List<Integer> regions = gameState.getRegions();

        // Count available positions for current pattern
        int availablePositions = 0;
        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {
                int position = row * n + col;
                if (isSafe(queenPositions, position, n, regions)) {
                    availablePositions++;
                }
            }
        }

        // Center control heuristic
        int centerControl = 0;
        int center = n / 2;
        for (int pos : queenPositions) {
            int row = pos / n;
            int col = pos % n;
            int distance = Math.abs(row - center) + Math.abs(col - center);
            centerControl += (n - distance);
        }

        int score = availablePositions * 10 + centerControl;
        return isMaximizingPlayer ? score : -score;
    }

    // ---------- Result holder ----------

    private static class AlphaBetaResult {
        int score;
        List<Integer> moveSequence;
        int bestMove;

        AlphaBetaResult(int score, List<Integer> moveSequence, int bestMove) {
            this.score = score;
            this.moveSequence = moveSequence;
            this.bestMove = bestMove;
        }
    }
}

