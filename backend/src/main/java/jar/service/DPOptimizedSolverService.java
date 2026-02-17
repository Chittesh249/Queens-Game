package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DPOptimizedSolverService {
    
    // Cache for attack patterns from single queens
    private Map<Integer, Set<Integer>> attackPatternCache = new HashMap<>();
    
    // Cache for game states (key: canonical state representation)
    private Map<String, DPResult> gameStateCache = new HashMap<>();
    
    // Cache for region-based optimizations
    private Map<Long, Set<Integer>> regionMoveCache = new HashMap<>();
    
    /**
     * Initialize attack pattern cache for faster calculations
     */
    public void initializeAttackCache(int n) {
        for (int pos = 0; pos < n * n; pos++) {
            Set<Integer> attacked = calculateAttackedPositions(pos, n);
            attackPatternCache.put(pos, attacked);
        }
    }
    
    /**
     * Precompute all positions attacked by a queen at given position
     */
    private Set<Integer> calculateAttackedPositions(int position, int n) {
        Set<Integer> attacked = new HashSet<>();
        int row = position / n;
        int col = position % n;
        
        // Same row
        for (int c = 0; c < n; c++) {
            attacked.add(row * n + c);
        }
        
        // Same column
        for (int r = 0; r < n; r++) {
            attacked.add(r * n + col);
        }
        
        // Diagonals
        for (int d = 1; d < n; d++) {
            // Top-left to bottom-right
            if (row + d < n && col + d < n) {
                attacked.add((row + d) * n + (col + d));
            }
            if (row - d >= 0 && col - d >= 0) {
                attacked.add((row - d) * n + (col - d));
            }
            
            // Top-right to bottom-left
            if (row + d < n && col - d >= 0) {
                attacked.add((row + d) * n + (col - d));
            }
            if (row - d >= 0 && col + d < n) {
                attacked.add((row - d) * n + (col + d));
            }
        }
        
        attacked.remove(position); // Don't attack yourself
        return attacked;
    }
    
    /**
     * DP-optimized solve method using memoization
     */
    public QueensSolution solveDPOptimized(int n, List<Integer> regions) {
        if (regions == null || regions.size() != n * n) {
            return new QueensSolution(new ArrayList<>(), false, 
                "Invalid regions array. Expected size: " + (n * n));
        }
        
        // Initialize attack cache
        initializeAttackCache(n);
        
        GameState initial = new GameState(n, regions);
        DPResult result = solveWithMemoization(initial, new HashMap<>());
        
        if (result != null && result.solved) {
            return new QueensSolution(result.queenPositions, true, 
                "Successfully solved using DP optimization with " + result.cacheHits + " cache hits");
        }
        
        return new QueensSolution(new ArrayList<>(), false, 
            "No solution found using DP optimization");
    }
    
    /**
     * Recursive solver with memoization
     */
    private DPResult solveWithMemoization(GameState state, Map<String, DPResult> memo) {
        String stateKey = createStateKey(state);
        
        // Check cache first
        if (memo.containsKey(stateKey)) {
            DPResult cached = memo.get(stateKey);
            cached.cacheHits++; // Track cache usage
            return cached;
        }
        
        List<Integer> validMoves = getAllValidPositions(state);
        
        // Base cases
        if (validMoves.isEmpty()) {
            boolean solved = state.getQueenPositions().size() == state.getN();
            DPResult result = new DPResult(
                new ArrayList<>(state.getQueenPositions()), 
                solved, 
                1, // 1 cache hit for this lookup
                solved ? "Solution found" : "No valid moves"
            );
            memo.put(stateKey, result);
            return result;
        }
        
        // Try each valid move
        DPResult bestResult = null;
        int maxQueens = -1;
        
        for (int move : validMoves) {
            GameState newState = makeMove(state, move);
            DPResult subResult = solveWithMemoization(newState, memo);
            
            if (subResult.solved && subResult.queenPositions.size() > maxQueens) {
                maxQueens = subResult.queenPositions.size();
                bestResult = subResult;
            }
        }
        
        // Create result
        DPResult finalResult;
        if (bestResult != null) {
            finalResult = new DPResult(
                bestResult.queenPositions,
                true,
                bestResult.cacheHits + 1,
                "Solution with " + bestResult.queenPositions.size() + " queens"
            );
        } else {
            finalResult = new DPResult(
                new ArrayList<>(state.getQueenPositions()),
                false,
                1,
                "No solution found from this state"
            );
        }
        
        memo.put(stateKey, finalResult);
        return finalResult;
    }
    
    /**
     * Get DP-optimized AI move for gameplay
     */
    public int getDPOptimizedMove(GameState gameState) {
        if (gameState.isGameOver()) {
            return -1;
        }
        
        String stateKey = createStateKey(gameState);
        
        // Check if we have cached optimal move for this state
        if (gameStateCache.containsKey(stateKey)) {
            return gameStateCache.get(stateKey).bestMove;
        }
        
        // Calculate optimal move using DP approach
        List<Integer> validMoves = getAllValidPositions(gameState);
        if (validMoves.isEmpty()) {
            return -1;
        }
        
        int bestMove = -1;
        int bestScore = Integer.MIN_VALUE;
        
        // Evaluate each move with look-ahead
        for (int move : validMoves) {
            GameState afterMove = makeMove(gameState, move);
            int score = evaluatePosition(afterMove);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        // Cache the result
        gameStateCache.put(stateKey, new DPResult(
            new ArrayList<>(gameState.getQueenPositions()),
            !gameState.isGameOver(),
            0,
            bestMove
        ));
        
        return bestMove;
    }
    
    /**
     * Region-based DP optimization for faster move selection
     */
    public int getRegionOptimizedMove(GameState gameState) {
        // Create region occupancy bitmask
        long regionMask = 0;
        Set<Integer> occupiedRegions = new HashSet<>();
        
        for (int queenPos : gameState.getQueenPositions()) {
            int region = gameState.getRegions().get(queenPos);
            occupiedRegions.add(region);
            regionMask |= (1L << region);
        }
        
        // Check region cache
        if (regionMoveCache.containsKey(regionMask)) {
            Set<Integer> validRegionMoves = regionMoveCache.get(regionMask);
            if (!validRegionMoves.isEmpty()) {
                return validRegionMoves.iterator().next(); // Return first valid move
            }
        }
        
        // Calculate and cache region-based moves
        List<Integer> validMoves = getAllValidPositions(gameState);
        Set<Integer> regionMoves = new HashSet<>();
        
        // Filter moves by region constraints
        for (int move : validMoves) {
            int moveRegion = gameState.getRegions().get(move);
            if (!occupiedRegions.contains(moveRegion)) {
                regionMoves.add(move);
            }
        }
        
        regionMoveCache.put(regionMask, regionMoves);
        
        return regionMoves.isEmpty() ? -1 : regionMoves.iterator().next();
    }
    
    // -------- Helper Methods --------
    
    private String createStateKey(GameState state) {
        List<Integer> sortedQueens = new ArrayList<>(state.getQueenPositions());
        Collections.sort(sortedQueens);
        return state.getN() + "_" + sortedQueens.toString() + "_" + 
               state.getCurrentPlayer() + "_" + getRegionPattern(state);
    }
    
    private String getRegionPattern(GameState state) {
        Set<Integer> occupiedRegions = new HashSet<>();
        for (int queenPos : state.getQueenPositions()) {
            occupiedRegions.add(state.getRegions().get(queenPos));
        }
        return occupiedRegions.toString();
    }
    
    private GameState makeMove(GameState state, int position) {
        GameState newState = new GameState();
        newState.setN(state.getN());
        newState.setRegions(new ArrayList<>(state.getRegions()));
        newState.setQueenPositions(new ArrayList<>(state.getQueenPositions()));
        newState.getQueenPositions().add(position);
        newState.setCurrentPlayer(state.getCurrentPlayer() == 1 ? 2 : 1);
        newState.setGameOver(false);
        return newState;
    }
    
    private List<Integer> getAllValidPositions(GameState gameState) {
        List<Integer> validMoves = new ArrayList<>();
        int n = gameState.getN();
        List<Integer> regions = gameState.getRegions();
        List<Integer> queenPositions = gameState.getQueenPositions();
        
        for (int pos = 0; pos < n * n; pos++) {
            if (isSafe(queenPositions, pos, n, regions)) {
                validMoves.add(pos);
            }
        }
        
        return validMoves;
    }
    
    private boolean isSafe(List<Integer> queenPositions, int position, int n, List<Integer> regions) {
        // Check region constraint
        int region = regions.get(position);
        for (int queenPos : queenPositions) {
            if (regions.get(queenPos) == region) {
                return false;
            }
        }
        
        // Check attacks using cached patterns
        if (attackPatternCache.containsKey(position)) {
            Set<Integer> attacked = attackPatternCache.get(position);
            for (int queenPos : queenPositions) {
                if (attacked.contains(queenPos)) {
                    return false;
                }
            }
        } else {
            // Fallback to direct calculation
            int row = position / n;
            int col = position % n;
            for (int queenPos : queenPositions) {
                int qRow = queenPos / n;
                int qCol = queenPos % n;
                                
                if (row == qRow || col == qCol || 
                    (row - col) == (qRow - qCol) || 
                    (row + col) == (qRow + qCol)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    private int evaluatePosition(GameState state) {
        // Simple heuristic: more valid moves = better position
        List<Integer> validMoves = getAllValidPositions(state);
        return validMoves.size() * 10 + state.getQueenPositions().size();
    }
    
    // -------- Cache Statistics --------
    
    public Map<String, Object> getCacheStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("attackCacheSize", attackPatternCache.size());
        stats.put("gameStateCacheSize", gameStateCache.size());
        stats.put("regionCacheSize", regionMoveCache.size());
        stats.put("totalCacheHits", gameStateCache.values().stream()
            .mapToInt(r -> r.cacheHits).sum());
        return stats;
    }
    
    public void clearCache() {
        attackPatternCache.clear();
        gameStateCache.clear();
        regionMoveCache.clear();
    }
    
    // -------- Helper Classes --------
    
    private static class DPResult {
        List<Integer> queenPositions;
        boolean solved;
        int cacheHits;
        String message;
        int bestMove;
        
        DPResult(List<Integer> queenPositions, boolean solved, int cacheHits, String message) {
            this.queenPositions = queenPositions;
            this.solved = solved;
            this.cacheHits = cacheHits;
            this.message = message;
            this.bestMove = -1;
        }
        
        DPResult(List<Integer> queenPositions, boolean solved, int cacheHits, int bestMove) {
            this.queenPositions = queenPositions;
            this.solved = solved;
            this.cacheHits = cacheHits;
            this.bestMove = bestMove;
            this.message = "Optimal move: " + bestMove;
        }
    }
}