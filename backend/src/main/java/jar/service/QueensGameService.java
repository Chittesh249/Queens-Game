package jar.service;

import jar.model.GameState;
import jar.model.Move;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/*
 * 2-Player Queens Game Service implementing Minimax DnC Algorithm 
 * ALGORITHMIC REQUIREMENTS:
 * - Minimax DnC Strategy: Uses recursive Minimax with alpha-beta pruning to find optimal moves
 * - Divide and Conquer approach for decision making
 * Time Complexity: O(b^d) where b is branching factor and d is depth
 */
@Service
public class QueensGameService {

    @Autowired
    private MinimaxDnCSolverService minimaxSolver;

    // Start a new game 
    public GameState initializeGame(int n, List<Integer> regions) {
        GameState gameState = new GameState(n, regions);
        gameState.setMessage("Game initialized. Player 1's turn.");
        
        // Calculate initial valid moves
        List<Integer> validMoves = getAllValidPositions(gameState);
        gameState.setValidMoves(validMoves);
        
        return gameState;
    }

    //Make a move (for human player)
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

    /* GREEDY ALGORITHM:
     * Strategy: Select the move that maximizes remaining safe positions
     * This is a greedy approach because it:
     * 1. Makes locally optimal choice at each step
     * 2. Does NOT consider future opponent moves
     * 3. Does NOT use backtracking
     * Time Complexity: O(N³) - O(N²) to check all positions; O(N) to evaluate each position
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

    /* MINIMAX DnC ALGORITHM:
     * Strategy: Uses Minimax with alpha-beta pruning to find optimal move
     * This approach:
     * 1. Looks ahead multiple moves (depth-limited search)
     * 2. Considers opponent's best responses
     * 3. Uses alpha-beta pruning for efficiency
     * Time Complexity: O(b^d) where b is branching factor, d is depth
     */
    public GameState getMinimaxAIMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return gameState;
        }
        
        // Use Minimax DnC solver to get the best move
        int bestPosition = minimaxSolver.getMinimaxMove(gameState);
        
        if (bestPosition == -1) {
            // No valid moves - AI loses
            gameState.setGameOver(true);
            String winner = gameState.getCurrentPlayer() == 1 ? "Player 2" : "Player 1";
            gameState.setWinner(winner);
            gameState.setMessage(winner + " wins! AI has no valid moves.");
            return gameState;
        }
        
        // Make the minimax move
        Move aiMove = new Move(bestPosition, gameState.getCurrentPlayer(), gameState);
        return makeMove(aiMove);
    }

    /* GREEDY FUNCTION: Select best move
     * For each valid position:
     * 1. Simulate placing queen there
     * 2. Count remaining safe positions
     * 3. Choose position with maximum remaining options
     * Maximize immediate future possibilities
     */
    private int greedyMove(GameState gameState) {
        List<Integer> validMoves = getAllValidPositions(gameState);
        
        if (validMoves.isEmpty()) {
            return -1;
        }
        
        int bestPosition = -1;
        int minOpponentMoves = Integer.MAX_VALUE;
        int maxOwnMoves = -1;
        
        for (int position : validMoves) {
            // Simulate AI move
            GameState afterAiMove = simulateMove(gameState, position);
            
            // Count opponent's valid moves (after we switch turns in simulation)
            List<Integer> opponentMoves = getAllValidPositions(afterAiMove);
            int numOpponentMoves = opponentMoves.size();
            
            // Check for instant win
            if (numOpponentMoves == 0) {
                return position; // Checkmate!
            }
            
            // Primary Metric: MINIMIZE opponent moves (Aggressive)
            if (numOpponentMoves < minOpponentMoves) {
                minOpponentMoves = numOpponentMoves;
                bestPosition = position;
                // Reset secondary metric
                maxOwnMoves = countSelfMoves(afterAiMove); 
            } else if (numOpponentMoves == minOpponentMoves) {
                // Tie-breaker: Maximize OWN moves (Flexibility)
                int selfMoves = countSelfMoves(afterAiMove);
                if (selfMoves > maxOwnMoves) {
                    maxOwnMoves = selfMoves;
                    bestPosition = position;
                }
            }
        }
        
        return bestPosition;
    }

    /* EVALUATE MOVE: Count remaining safe positions after placing queen
     * This is the greedy heuristic:
     * 1. Simulates the move
     * 2. Counts how many cells remain safe
     * 3. Returns the count
     * Time Complexity: O(N²) - checks all cells
     */
    private GameState simulateMove(GameState original, int position) {
        GameState clone = new GameState(original.getN(), original.getRegions());
        clone.setQueenPositions(new ArrayList<>(original.getQueenPositions()));
        clone.getQueenPositions().add(position);
        
        // Toggle player (simulating turn switch)
        clone.setCurrentPlayer(original.getCurrentPlayer() == 1 ? 2 : 1);
        
        // Update counts (just for completeness, not used in logic much)
        if (original.getCurrentPlayer() == 1) {
            clone.setPlayer1Queens(original.getPlayer1Queens() + 1);
            clone.setPlayer2Queens(original.getPlayer2Queens());
        } else {
             clone.setPlayer1Queens(original.getPlayer1Queens());
             clone.setPlayer2Queens(original.getPlayer2Queens() + 1);
        }
        return clone;
    }

    /**
     * Helper to count how many moves the AI would have if it were its turn again.
     * Used as a tie-breaker.
     */
    private int countSelfMoves(GameState state) {
        // 'state' has the opponent as current player. 
        // We want to check valid moves for the AI (who just moved).
        int playerWhoJustMoved = state.getCurrentPlayer() == 1 ? 2 : 1;
        
        // Create a temp state where it's the AI's turn again
        GameState temp = new GameState(state.getN(), state.getRegions());
        temp.setQueenPositions(new ArrayList<>(state.getQueenPositions()));
        temp.setCurrentPlayer(playerWhoJustMoved);
        
        return getAllValidPositions(temp).size();
    }

    // Get all valid moves for current state
    public GameState getAllValidMoves(GameState gameState) {
        List<Integer> validMoves = getAllValidPositions(gameState);
        gameState.setValidMoves(validMoves);
        gameState.setMessage(validMoves.size() + " valid moves available.");
        return gameState;
    }

    // Get all valid positions (not attacked and region not occupied)
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

    /* Check if position is safe for placing a queen
     * Conditions:
     * 1. Not attacked by existing queens (row, column, diagonals)
     * 2. Region not already occupied by another queen
     */
    private boolean isSafe(GameState gameState, int position) {
        return isSafePosition(position, gameState.getQueenPositions(), gameState.getN()) &&
               !isRegionOccupied(position, gameState);
    }

     /* Check if position is attacked by any existing queen
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
    
     // Check if region already has a queen
    private boolean isRegionOccupied(int position, GameState gameState) {
        if (gameState.getRegions() == null || gameState.getRegions().isEmpty()) {
            return false;                             // No region constraints
        }
        
        int region = gameState.getRegions().get(position);
        
        for (int queenPos : gameState.getQueenPositions()) {
            if (gameState.getRegions().get(queenPos) == region) {
                return true;                         // Region already has a queen
            }
        }
        
        return false;
    }
}
