package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Pure Backtracking Solver for Queens Game - Alternative Implementation
 * 
 * Simple backtracking without any complex optimizations:
 * 1. Try placing a queen in a valid position
 * 2. Recursively solve the rest
 * 3. If failed, backtrack and try next position
 */
@Service
public class PureBacktrackingSolverService {

    private int n;
    private List<Integer> regions;
    private List<Integer> currentSolution;
    private boolean solutionFound;

    /**
     * Solve the Queens puzzle using pure backtracking
     */
    public QueensSolution solve(int boardSize, List<Integer> regionList) {
        this.n = boardSize;
        this.regions = regionList;
        this.currentSolution = new ArrayList<>();
        this.solutionFound = false;
        
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false,
                "Invalid regions array. Expected size: " + (n * n));
        }
        
        // Start backtracking from first row
        Set<Integer> usedRegions = new HashSet<>();
        backtrack(0, usedRegions);
        
        if (solutionFound) {
            return new QueensSolution(new ArrayList<>(currentSolution), true,
                "Solved using Pure Backtracking");
        } else {
            return new QueensSolution(new ArrayList<>(), false,
                "No solution found");
        }
    }
    
    /**
     * Core backtracking logic
     */
    private void backtrack(int row, Set<Integer> usedRegions) {
        // Base case: all rows filled
        if (row == n) {
            solutionFound = true;
            return;
        }
        
        // Try each column in current row
        for (int col = 0; col < n && !solutionFound; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);
            
            // Check if valid placement
            if (!isSafe(pos, row, col, usedRegions)) {
                continue;
            }
            
            // Place queen
            currentSolution.add(pos);
            usedRegions.add(region);
            
            // Recurse to next row
            backtrack(row + 1, usedRegions);
            
            // If solution found, don't backtrack
            if (solutionFound) {
                return;
            }
            
            // Backtrack: remove queen
            currentSolution.remove(currentSolution.size() - 1);
            usedRegions.remove(region);
        }
    }
    
    /**
     * Check if position is safe
     */
    private boolean isSafe(int pos, int row, int col, Set<Integer> usedRegions) {
        int region = regions.get(pos);
        
        // Check region constraint
        if (usedRegions.contains(region)) {
            return false;
        }
        
        // Check against all placed queens
        for (int queenPos : currentSolution) {
            int qRow = queenPos / n;
            int qCol = queenPos % n;
            
            // Same column
            if (col == qCol) return false;
            
            // Same diagonal
            if (Math.abs(row - qRow) == Math.abs(col - qCol)) return false;
        }
        
        return true;
    }
    
    /**
     * Get AI move for current game state
     */
    public int getMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }
        
        int boardSize = gameState.getN();
        List<Integer> currentQueens = gameState.getQueenPositions();
        
        // Determine current row
        int currentRow = currentQueens.size();
        if (currentRow >= boardSize) {
            return -1;
        }
        
        // Build used regions
        Set<Integer> usedRegions = new HashSet<>();
        for (int pos : currentQueens) {
            usedRegions.add(gameState.getRegions().get(pos));
        }
        
        // Find valid move in current row
        for (int col = 0; col < boardSize; col++) {
            int pos = currentRow * boardSize + col;
            
            if (isValidMove(pos, currentRow, col, boardSize, currentQueens, usedRegions, gameState.getRegions())) {
                return pos;
            }
        }
        
        return -1;
    }
    
    /**
     * Check if a move is valid
     */
    private boolean isValidMove(int pos, int row, int col, int boardSize,
                                List<Integer> existingQueens, Set<Integer> usedRegions,
                                List<Integer> regionList) {
        int region = regionList.get(pos);
        
        // Region check
        if (usedRegions.contains(region)) {
            return false;
        }
        
        // Attack check
        for (int queenPos : existingQueens) {
            int qRow = queenPos / boardSize;
            int qCol = queenPos % boardSize;
            
            if (col == qCol) return false;
            if (Math.abs(row - qRow) == Math.abs(col - qCol)) return false;
        }
        
        return true;
    }
}
