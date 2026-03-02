package jar.service;

import jar.model.GameState;
import jar.model.Move;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Two-Player Branch and Bound Solver for Queens Game
 * 
 * In two-player mode:
 * - Players alternate placing queens
 * - Last player to place a queen WINS
 * - Goal: Force opponent into position with no valid moves
 * 
 * Strategy:
 * 1. BOUND: Calculate if this move leads to a winning position
 * 2. BRANCH: Try moves that limit opponent's options
 * 3. PRUNE: Skip moves that give opponent advantage
 */
@Service
public class TwoPlayerBranchAndBoundService {

    private static final int WIN_SCORE = 1000;
    private static final int LOSE_SCORE = -1000;
    private static final int MAX_DEPTH = 4; // Limit search depth for performance

    /**
     * Get best move for AI using Branch and Bound
     */
    public int getBestMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }

        int n = gameState.getN();
        List<Integer> currentQueens = gameState.getQueenPositions();
        List<Integer> regions = gameState.getRegions();

        // Build current state
        Set<Integer> usedRegions = new HashSet<>();
        long cols = 0, diag1 = 0, diag2 = 0;
        
        for (int pos : currentQueens) {
            int row = pos / n;
            int col = pos % n;
            usedRegions.add(regions.get(pos));
            cols |= (1L << col);
            diag1 |= (1L << (row - col + n - 1));
            diag2 |= (1L << (row + col));
        }

        // Use Branch and Bound to find best move
        MoveResult result = branchAndBoundTwoPlayer(
            gameState, 
            currentQueens.size(), // current row
            cols, diag1, diag2, 
            usedRegions, 
            0, // current depth
            Integer.MIN_VALUE, // alpha
            Integer.MAX_VALUE  // beta
        );

        return result.bestMove;
    }

    /**
     * Branch and Bound for two-player game
     * 
     * Returns best move and its score
     */
    private MoveResult branchAndBoundTwoPlayer(
            GameState gameState,
            int row,
            long cols,
            long diag1, 
            long diag2,
            Set<Integer> usedRegions,
            int depth,
            int alpha,
            int beta) {

        int n = gameState.getN();
        List<Integer> regions = gameState.getRegions();

        // BOUND 1: Max depth reached - evaluate position
        if (depth >= MAX_DEPTH) {
            return new MoveResult(-1, evaluatePosition(gameState, row, usedRegions));
        }

        // BOUND 2: Check if game is over (no valid moves)
        List<Integer> validMoves = getValidMovesInRow(row, n, cols, diag1, diag2, usedRegions, regions);
        
        if (validMoves.isEmpty()) {
            // Current player loses - previous player wins
            return new MoveResult(-1, LOSE_SCORE + depth); // Prefer faster wins
        }

        // BOUND 3: Alpha-Beta pruning
        // If we found a winning move, no need to search further
        
        int bestMove = -1;
        int bestScore = LOSE_SCORE;

        // BRANCH: Try each valid move
        for (int move : validMoves) {
            int col = move % n;
            int region = regions.get(move);

            // DO: Make move
            long newCols = cols | (1L << col);
            long newDiag1 = diag1 | (1L << (row - col + n - 1));
            long newDiag2 = diag2 | (1L << (row + col));
            Set<Integer> newUsedRegions = new HashSet<>(usedRegions);
            newUsedRegions.add(region);

            // RECURSE: Opponent's turn
            MoveResult opponentResult = branchAndBoundTwoPlayer(
                gameState,
                row + 1,
                newCols,
                newDiag1,
                newDiag2,
                newUsedRegions,
                depth + 1,
                -beta,   // Negate for minimax
                -alpha   // Negate for minimax
            );

            // Our score is opposite of opponent's score
            int score = -opponentResult.score;

            // UNDO: Not needed due to immutable state (new variables)

            // Update best move
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }

            // Alpha-Beta pruning (BOUND)
            alpha = Math.max(alpha, score);
            if (alpha >= beta) {
                break; // PRUNE: Opponent won't choose this path
            }
        }

        return new MoveResult(bestMove, bestScore);
    }

    /**
     * Get all valid moves in current row
     */
    private List<Integer> getValidMovesInRow(int row, int n, long cols, long diag1, long diag2,
                                             Set<Integer> usedRegions, List<Integer> regions) {
        List<Integer> validMoves = new ArrayList<>();

        for (int col = 0; col < n; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);

            // Check region constraint
            if (usedRegions.contains(region)) {
                continue;
            }

            // Check column constraint
            if ((cols & (1L << col)) != 0) {
                continue;
            }

            // Check diagonal constraints
            int d1 = row - col + n - 1;
            int d2 = row + col;
            if ((diag1 & (1L << d1)) != 0 || (diag2 & (1L << d2)) != 0) {
                continue;
            }

            validMoves.add(pos);
        }

        return validMoves;
    }

    /**
     * Evaluate position at leaf node
     * 
     * Heuristic: Count available moves for current player vs opponent
     */
    private int evaluatePosition(GameState gameState, int currentRow, Set<Integer> usedRegions) {
        int n = gameState.getN();
        List<Integer> regions = gameState.getRegions();

        // Simple heuristic: more remaining regions = better position
        int remainingRegions = n - usedRegions.size();
        int remainingRows = n - currentRow;

        // If more regions than rows, likely to have moves
        if (remainingRegions >= remainingRows) {
            return 10 * remainingRegions;
        } else {
            return -10 * (remainingRows - remainingRegions);
        }
    }

    /**
     * Get AI move for game service
     */
    public int getAIMove(GameState gameState) {
        return getBestMove(gameState);
    }

    /**
     * Helper class to store move and score
     */
    private static class MoveResult {
        int bestMove;
        int score;

        MoveResult(int bestMove, int score) {
            this.bestMove = bestMove;
            this.score = score;
        }
    }
}
