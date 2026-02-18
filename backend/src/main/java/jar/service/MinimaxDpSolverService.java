package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MinimaxDpSolverService {

    private static final int WIN_SCORE = 10000;
    private static final int LOSE_SCORE = -10000;
    private static final int MAX_DEPTH = 6; // Limit search depth for performance

    /**
     * Minimax-based Dynamic Programming solver for the Queens game.
     * Uses recursive Minimax with alpha-beta pruning to find optimal moves.
     */
    /**
     * Minimax-based Dynamic Programming solver for the Queens game.
     * Uses recursive Minimax with alpha-beta pruning to find optimal moves.
     */
    public QueensSolution solveMinimax(int n, List<Integer> regions) {
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                "Invalid regions array. Expected size: " + (n * n));
        }

        // Create initial game state
        GameState gameState = new GameState(n, regions);
        
        // Find optimal solution using Minimax with Memoization
        Map<String, MinimaxResult> memo = new HashMap<>();
        MinimaxResult result = minimaxSolve(gameState, 0, true, Integer.MIN_VALUE, Integer.MAX_VALUE, memo);
        
        if (result != null && result.moveSequence != null) {
            return new QueensSolution(result.moveSequence, true,
                "Solved using Minimax-based Dynamic Programming with score: " + result.score);
        }
        
        return new QueensSolution(new ArrayList<>(), false,
            "No valid solution found using Minimax-based Dynamic Programming.");
    }

    /**
     * Get Minimax AI move for the current game state
     */
    public int getMinimaxMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }
        
        Map<String, MinimaxResult> memo = new HashMap<>();
        MinimaxResult result = minimax(gameState, 0, true, Integer.MIN_VALUE, Integer.MAX_VALUE, memo);
        return result != null ? result.bestMove : -1;
    }

    // -------- Core Minimax Dynamic Programming Implementation --------

    /**
     * Main Minimax solver - uses dynamic programming with memoization to optimize recursive calls
     */
    private MinimaxResult minimaxSolve(GameState gameState, int depth, boolean isMaximizing, int alpha, int beta, Map<String, MinimaxResult> memo) {
        // Generate key for memoization
        String key = generateKey(gameState, depth, isMaximizing);
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        // Base case: no valid moves
        List<Integer> validMoves = getAllValidPositions(gameState);
        if (validMoves.isEmpty()) {
            // Current player loses
            int score = isMaximizing ? LOSE_SCORE + depth : WIN_SCORE - depth;
            MinimaxResult result = new MinimaxResult(score, new ArrayList<>(), -1);
            memo.put(key, result);
            return result;
        }

        // Base case: maximum depth reached
        if (depth >= MAX_DEPTH) {
            // Heuristic evaluation
            int score = evaluateGameState(gameState, isMaximizing);
            MinimaxResult result = new MinimaxResult(score, new ArrayList<>(), -1);
            memo.put(key, result);
            return result;
        }

        // Generate all valid moves from current state
        if (validMoves.size() == 1) {
            // Simple case: only one move available
            int move = validMoves.get(0);
            GameState newState = makeMove(gameState, move);
            MinimaxResult childResult = minimaxSolve(newState, depth + 1, !isMaximizing, alpha, beta, memo);
            
            if (childResult != null) {
                List<Integer> sequence = new ArrayList<>();
                sequence.add(move);
                sequence.addAll(childResult.moveSequence);
                MinimaxResult result = new MinimaxResult(childResult.score, sequence, move);
                memo.put(key, result);
                return result;
            }
            return null;
        }

        // Recursively evaluate each resulting board state
        MinimaxResult bestResult = null;
        int bestScore = isMaximizing ? Integer.MIN_VALUE : Integer.MAX_VALUE;
        int bestMove = -1;

        // Sort moves for better pruning (heuristic: prefer center positions)
        validMoves.sort((a, b) -> {
            int n = gameState.getN();
            int center = n / 2;
            int distA = Math.abs((a / n) - center) + Math.abs((a % n) - center);
            int distB = Math.abs((b / n) - center) + Math.abs((b % n) - center);
            return Integer.compare(distA, distB);
        });

        for (int move : validMoves) {
            GameState newState = makeMove(gameState, move);
            
            // Recursive call with memoization
            MinimaxResult childResult = minimaxSolve(newState, depth + 1, !isMaximizing, alpha, beta, memo);
            
            if (childResult != null) {
                int score = childResult.score;
                
                // Minimax logic
                if (isMaximizing) {
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = move;
                        bestResult = childResult;
                        alpha = Math.max(alpha, score);
                    }
                } else {
                    if (score < bestScore) {
                        bestScore = score;
                        bestMove = move;
                        bestResult = childResult;
                        beta = Math.min(beta, score);
                    }
                }
                
                // Alpha-beta pruning
                if (beta <= alpha) {
                    break;
                }
            }
        }

        // Return the optimal result
        if (bestResult != null) {
            List<Integer> sequence = new ArrayList<>();
            sequence.add(bestMove);
            sequence.addAll(bestResult.moveSequence);
            MinimaxResult result = new MinimaxResult(bestScore, sequence, bestMove);
            memo.put(key, result);
            return result;
        }
        
        return null; // Should ideally not be reached if valid moves exist
    }

    /**
     * Standard Minimax for single move selection
     */
    private MinimaxResult minimax(GameState gameState, int depth, boolean isMaximizing, int alpha, int beta, Map<String, MinimaxResult> memo) {
        // Generate key for memoization
        String key = generateKey(gameState, depth, isMaximizing);
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        // Base case: no valid moves
        List<Integer> validMoves = getAllValidPositions(gameState);
        if (validMoves.isEmpty()) {
            // Current player loses
            int score = isMaximizing ? LOSE_SCORE + depth : WIN_SCORE - depth;
            MinimaxResult result = new MinimaxResult(score, new ArrayList<>(), -1);
            memo.put(key, result);
            return result;
        }

        // Base case: maximum depth
        if (depth >= MAX_DEPTH) {
            int score = evaluateGameState(gameState, isMaximizing);
            MinimaxResult result = new MinimaxResult(score, new ArrayList<>(), -1);
            memo.put(key, result);
            return result;
        }

        int bestMove = -1;
        int bestScore = isMaximizing ? Integer.MIN_VALUE : Integer.MAX_VALUE;

        for (int move : validMoves) {
            GameState newState = makeMove(gameState, move);
            MinimaxResult result = minimax(newState, depth + 1, !isMaximizing, alpha, beta, memo);
            
            if (result != null) {
                int score = result.score;
                
                if (isMaximizing) {
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = move;
                        alpha = Math.max(alpha, score);
                    }
                } else {
                    if (score < bestScore) {
                        bestScore = score;
                        bestMove = move;
                        beta = Math.min(beta, score);
                    }
                }
                
                if (beta <= alpha) {
                    break; // Pruning
                }
            }
        }

        MinimaxResult result = new MinimaxResult(bestScore, new ArrayList<>(), bestMove);
        memo.put(key, result);
        return result;
    }

    // Generate unique key for game state
    private String generateKey(GameState gameState, int depth, boolean isMaximizing) {
        List<Integer> sortedQueens = new ArrayList<>(gameState.getQueenPositions());
        Collections.sort(sortedQueens);
        return sortedQueens.toString() + "|" + gameState.getCurrentPlayer() + "|" + depth + "|" + isMaximizing;
    }

    // -------- Helper Methods --------

    /**
     * Create new game state after making a move
     */
    private GameState makeMove(GameState gameState, int position) {
        GameState newState = new GameState();
        newState.setN(gameState.getN());
        newState.setRegions(new ArrayList<>(gameState.getRegions()));
        newState.setQueenPositions(new ArrayList<>(gameState.getQueenPositions()));
        newState.getQueenPositions().add(position);
        newState.setCurrentPlayer(gameState.getCurrentPlayer() == 1 ? 2 : 1);
        newState.setGameOver(false);
        return newState;
    }

    /**
     * Get all valid positions for current game state
     */
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

    /**
     * Check if a position is safe
     */
    private boolean isSafe(List<Integer> queenPositions, int position, int n, List<Integer> regions) {
        int row = position / n;
        int col = position % n;
        int region = regions.get(position);
        
        // Check region constraint
        for (int queenPos : queenPositions) {
            if (regions.get(queenPos) == region) {
                return false;
            }
        }
        
        // Check attacks
        for (int queenPos : queenPositions) {
            int qRow = queenPos / n;
            int qCol = queenPos % n;
            
            if (row == qRow || col == qCol || 
                (row - col) == (qRow - qCol) || 
                (row + col) == (qRow + qCol)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Heuristic evaluation of game state
     */
    private int evaluateGameState(GameState gameState, boolean isMaximizingPlayer) {
        int n = gameState.getN();
        List<Integer> queenPositions = gameState.getQueenPositions();
        List<Integer> regions = gameState.getRegions();
        
        // Count available positions for current player
        int availablePositions = 0;
        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {
                int position = row * n + col;
                if (isSafe(queenPositions, position, n, regions)) {
                    availablePositions++;
                }
            }
        }
        
        // Prefer states with more available moves
        // Also consider center control as a secondary factor
        int centerControl = 0;
        int center = n / 2;
        for (int pos : queenPositions) {
            int row = pos / n;
            int col = pos % n;
            int distance = Math.abs(row - center) + Math.abs(col - center);
            centerControl += (n - distance); // Higher for positions closer to center
        }
        
        int score = availablePositions * 10 + centerControl;
        return isMaximizingPlayer ? score : -score;
    }

    // -------- Helper Classes --------

    /**
     * Result class for Minimax algorithm
     */
    private static class MinimaxResult {
        int score;
        List<Integer> moveSequence;
        int bestMove;

        MinimaxResult(int score, List<Integer> moveSequence, int bestMove) {
            this.score = score;
            this.moveSequence = moveSequence;
            this.bestMove = bestMove;
        }
    }
}
