package jar.service;

import jar.model.GameState;
import jar.model.Move;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 2-Player Queens Game Service implementing Greedy Algorithm
 * 
 * ALGORITHMIC REQUIREMENTS:
 * - Greedy Strategy: At each turn, select the position that maximizes future safe positions
 * - No backtracking or exhaustive search
 * - Locally optimal decision making
 * - Time Complexity: O(N³) per move evaluation
 */
@Service
public class QueensGameService {

    /**
     * Initialize a new game
     */
    public GameState initializeGame(int n, List<Integer> regions) {
        GameState gameState = new GameState(n, regions);
        gameState.setMessage("Game initialized. Player 1's turn.");
        
        // Calculate initial valid moves
        List<Integer> validMoves = getAllValidPositions(gameState);
        gameState.setValidMoves(validMoves);
        
        return gameState;
    }

    /**
     * Make a move (human player)
     */
    public GameState makeMove(Move move) {
        GameState gameState = move.getGameState();
        int position = move.getPosition();
        
        // Validate move
        if (!isSafe(gameState, position)) {
            gameState.setMessage("Invalid move! Queen would be under attack.");
            return gameState;
        }
        
        // Place queen
        gameState.getQueenPositions().add(position);
        
        // Update player queen counts
        if (gameState.getCurrentPlayer() == 1) {
            gameState.setPlayer1Queens(gameState.getPlayer1Queens() + 1);
        } else {
            gameState.setPlayer2Queens(gameState.getPlayer2Queens() + 1);
        }
        
        // Check if game is over
        List<Integer> validMoves = getAllValidPositions(gameState);
        
        if (validMoves.isEmpty()) {
            // Current player loses (no moves available for next player)
            gameState.setGameOver(true);
            String winner = gameState.getCurrentPlayer() == 1 ? "Player 1" : "Player 2";
            gameState.setWinner(winner);
            gameState.setMessage(winner + " wins! Opponent has no valid moves.");
        } else {
            // Switch player
            gameState.setCurrentPlayer(gameState.getCurrentPlayer() == 1 ? 2 : 1);
            gameState.setValidMoves(validMoves);
            gameState.setMessage("Player " + gameState.getCurrentPlayer() + "'s turn. " + 
                                validMoves.size() + " valid moves available.");
        }
        
        return gameState;
    }

    /**
     * GREEDY ALGORITHM: Get AI's best move
     * 
     * Strategy: Select the move that maximizes remaining safe positions
     * This is a GREEDY approach because it:
     * 1. Makes locally optimal choice at each step
     * 2. Does NOT consider future opponent moves
     * 3. Does NOT use backtracking
     * 
     * Time Complexity: O(N³)
     * - O(N²) to check all positions
     * - O(N) to evaluate each position
     */
    public GameState getGreedyAIMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return gameState;
        }
        
        int bestPosition = greedyMove(gameState);
        
        if (bestPosition == -1) {
            // No valid moves - AI loses
            gameState.setGameOver(true);
            String winner = gameState.getCurrentPlayer() == 1 ? "Player 2" : "Player 1";
            gameState.setWinner(winner);
            gameState.setMessage(winner + " wins! AI has no valid moves.");
            return gameState;
        }
        
        // Make the greedy move
        Move aiMove = new Move(bestPosition, gameState.getCurrentPlayer(), gameState);
        return makeMove(aiMove);
    }

    /**
     * CORE GREEDY FUNCTION: Select best move
     * 
     * For each valid position:
     * 1. Simulate placing queen there
     * 2. Count remaining safe positions
     * 3. Choose position with MAXIMUM remaining options
     * 
     * This demonstrates GREEDY choice: maximize immediate future possibilities
     */
    private int greedyMove(GameState gameState) {
        List<Integer> validMoves = getAllValidPositions(gameState);
        
        if (validMoves.isEmpty()) {
            return -1;
        }
        
        int bestPosition = -1;
        int maxFutureOptions = -1;
        
        // Evaluate each candidate position
        for (int position : validMoves) {
            // evaluateMove: counts safe positions after this move
            int futureOptions = evaluateMove(gameState, position);
            
            // Greedy choice: select move with most future possibilities
            if (futureOptions > maxFutureOptions) {
                maxFutureOptions = futureOptions;
                bestPosition = position;
            }
        }
        
        return bestPosition;
    }

    /**
     * EVALUATE MOVE: Count remaining safe positions after placing queen
     * 
     * This is the GREEDY HEURISTIC:
     * - Simulates the move
     * - Counts how many cells remain safe
     * - Returns the count (higher is better)
     * 
     * Time Complexity: O(N²) - checks all cells
     */
    private int evaluateMove(GameState gameState, int position) {
        // Create temporary state with queen placed
        List<Integer> tempQueens = new ArrayList<>(gameState.getQueenPositions());
        tempQueens.add(position);
        
        int n = gameState.getN();
        int safeCount = 0;
        
        // Count remaining safe positions
        for (int i = 0; i < n * n; i++) {
            if (!tempQueens.contains(i) && isSafePosition(i, tempQueens, n)) {
                safeCount++;
            }
        }
        
        return safeCount;
    }

    /**
     * Get all valid moves for current state
     */
    public GameState getAllValidMoves(GameState gameState) {
        List<Integer> validMoves = getAllValidPositions(gameState);
        gameState.setValidMoves(validMoves);
        gameState.setMessage(validMoves.size() + " valid moves available.");
        return gameState;
    }

    /**
     * Get all valid positions (not attacked and region not occupied)
     */
    private List<Integer> getAllValidPositions(GameState gameState) {
        List<Integer> validPositions = new ArrayList<>();
        int n = gameState.getN();
        
        for (int i = 0; i < n * n; i++) {
            if (isSafe(gameState, i)) {
                validPositions.add(i);
            }
        }
        
        return validPositions;
    }

    /**
     * IS SAFE: Check if position is safe for placing a queen
     * 
     * Conditions:
     * 1. Not attacked by existing queens (row, column, diagonals)
     * 2. Region not already occupied by another queen
     */
    private boolean isSafe(GameState gameState, int position) {
        return isSafePosition(position, gameState.getQueenPositions(), gameState.getN()) &&
               !isRegionOccupied(position, gameState);
    }

    /**
     * Check if position is attacked by any existing queen
     * Checks: same row, same column, both diagonals
     */
    private boolean isSafePosition(int position, List<Integer> queenPositions, int n) {
        int row = position / n;
        int col = position % n;
        
        for (int queenPos : queenPositions) {
            int qRow = queenPos / n;
            int qCol = queenPos % n;
            
            // Same row
            if (row == qRow) return false;
            
            // Same column
            if (col == qCol) return false;
            
            // Diagonal (top-left to bottom-right)
            if (Math.abs(row - qRow) == Math.abs(col - qCol)) return false;
        }
        
        return true;
    }

    /**
     * Check if region already has a queen
     */
    private boolean isRegionOccupied(int position, GameState gameState) {
        if (gameState.getRegions() == null || gameState.getRegions().isEmpty()) {
            return false; // No region constraints
        }
        
        int region = gameState.getRegions().get(position);
        
        for (int queenPos : gameState.getQueenPositions()) {
            if (gameState.getRegions().get(queenPos) == region) {
                return true; // Region already has a queen
            }
        }
        
        return false;
    }
}
