package jar.service;

import jar.model.GameState;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Pure Branch and Bound for Two-Player Queens Game
 * 
 * Uses bounds to prune unpromising moves without Minimax:
 * 1. BOUND: If move gives opponent instant win, skip
 * 2. BOUND: If move leaves opponent with many options, skip  
 * 3. BOUND: If move limits opponent to few options, keep
 * 
 * Strategy: Find move that minimizes opponent's future moves
 */
@Service
public class PureBranchAndBoundTwoPlayerService {

    private static final int MAX_BOUND_DEPTH = 3; // How deep to check bounds

    /**
     * Get best move using pure Branch and Bound
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
        for (int pos : currentQueens) {
            usedRegions.add(regions.get(pos));
        }

        int currentRow = currentQueens.size();
        
        // Find best move using Branch and Bound
        return branchAndBound(currentRow, n, currentQueens, usedRegions, regions, 0);
    }

    /**
     * Pure Branch and Bound - no minimax, just bounds
     */
    private int branchAndBound(int row, int n, List<Integer> currentQueens,
                               Set<Integer> usedRegions, List<Integer> regions, int depth) {
        
        // Get all valid moves in current row
        List<Integer> validMoves = getValidMoves(row, n, currentQueens, usedRegions, regions);
        
        if (validMoves.isEmpty()) {
            return -1; // No valid move
        }

        // If only one move, return it
        if (validMoves.size() == 1) {
            return validMoves.get(0);
        }

        int bestMove = -1;
        int bestOpponentMoves = Integer.MAX_VALUE; // We want to MINIMIZE opponent's moves

        // BRANCH: Try each valid move
        for (int move : validMoves) {
            
            // BOUND 1: Check if this move wins immediately
            if (isWinningMove(move, row, n, currentQueens, usedRegions, regions)) {
                return move; // Instant win!
            }

            // BOUND 2: Calculate opponent's options after this move
            int opponentMoves = countOpponentMoves(move, row, n, currentQueens, usedRegions, regions, depth);
            
            // BOUND 3: Prune moves that give opponent too many options
            if (opponentMoves > bestOpponentMoves && opponentMoves > 3) {
                continue; // Skip - gives opponent too much freedom
            }

            // Update best move (minimize opponent's moves)
            if (opponentMoves < bestOpponentMoves) {
                bestOpponentMoves = opponentMoves;
                bestMove = move;
            }
        }

        // If all moves pruned, return first valid
        if (bestMove == -1) {
            return validMoves.get(0);
        }

        return bestMove;
    }

    /**
     * BOUND: Check if move wins immediately (opponent has no moves)
     */
    private boolean isWinningMove(int move, int row, int n, List<Integer> currentQueens,
                                  Set<Integer> usedRegions, List<Integer> regions) {
        
        // Simulate placing queen
        List<Integer> newQueens = new ArrayList<>(currentQueens);
        Set<Integer> newUsedRegions = new HashSet<>(usedRegions);
        
        newQueens.add(move);
        newUsedRegions.add(regions.get(move));
        
        // Check if opponent has any valid moves in next row
        List<Integer> opponentMoves = getValidMoves(row + 1, n, newQueens, newUsedRegions, regions);
        
        return opponentMoves.isEmpty(); // True = we win!
    }

    /**
     * BOUND: Count opponent's future moves (with depth limit)
     */
    private int countOpponentMoves(int move, int row, int n, List<Integer> currentQueens,
                                   Set<Integer> usedRegions, List<Integer> regions, int depth) {
        
        // Simulate placing our queen
        List<Integer> newQueens = new ArrayList<>(currentQueens);
        Set<Integer> newUsedRegions = new HashSet<>(usedRegions);
        
        newQueens.add(move);
        newUsedRegions.add(regions.get(move));
        
        // Count opponent's immediate moves
        List<Integer> opponentMoves = getValidMoves(row + 1, n, newQueens, newUsedRegions, regions);
        int count = opponentMoves.size();
        
        // BOUND: Don't recurse too deep
        if (depth >= MAX_BOUND_DEPTH || opponentMoves.isEmpty()) {
            return count;
        }
        
        // For each opponent move, count our responses (bounded recursion)
        int worstCase = 0;
        for (int oppMove : opponentMoves) {
            List<Integer> afterOpp = new ArrayList<>(newQueens);
            Set<Integer> afterOppRegions = new HashSet<>(newUsedRegions);
            
            afterOpp.add(oppMove);
            afterOppRegions.add(regions.get(oppMove));
            
            List<Integer> ourResponses = getValidMoves(row + 2, n, afterOpp, afterOppRegions, regions);
            
            // BOUND: If opponent can leave us with no moves, this is bad
            if (ourResponses.isEmpty()) {
                return Integer.MAX_VALUE; // Opponent can win - prune this branch
            }
            
            worstCase = Math.max(worstCase, ourResponses.size());
        }
        
        return count + worstCase;
    }

    /**
     * Get valid moves in a row
     */
    private List<Integer> getValidMoves(int row, int n, List<Integer> currentQueens,
                                       Set<Integer> usedRegions, List<Integer> regions) {
        List<Integer> validMoves = new ArrayList<>();
        
        if (row >= n) {
            return validMoves;
        }

        for (int col = 0; col < n; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);
            
            // Region constraint
            if (usedRegions.contains(region)) {
                continue;
            }
            
            // Attack constraints
            boolean valid = true;
            for (int queenPos : currentQueens) {
                int qRow = queenPos / n;
                int qCol = queenPos % n;
                
                if (col == qCol) { // Same column
                    valid = false;
                    break;
                }
                if (Math.abs(row - qRow) == Math.abs(col - qCol)) { // Diagonal
                    valid = false;
                    break;
                }
            }
            
            if (valid) {
                validMoves.add(pos);
            }
        }
        
        return validMoves;
    }

    /**
     * Get AI move for game service
     */
    public int getAIMove(GameState gameState) {
        return getBestMove(gameState);
    }
}
