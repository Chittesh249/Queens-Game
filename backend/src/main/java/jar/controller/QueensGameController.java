package jar.controller;

import jar.model.GameState;
import jar.model.Move;
import jar.service.QueensGameService;
import jar.service.QueensSolverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class QueensGameController {

    @Autowired
    private QueensGameService gameService;
    
    @Autowired
    private QueensSolverService solverService;

    /**
     * Initialize a new game with given board size and regions
     */
    @PostMapping("/init")
    public GameState initGame(@RequestBody GameState request) {
        return gameService.initializeGame(request.getN(), request.getRegions());
    }

    /**
     * Make a move (human or AI)
     */
    @PostMapping("/move")
    public GameState makeMove(@RequestBody Move move) {
        return gameService.makeMove(move);
    }

    /**
     * Get AI move - can be greedy, minimax, or DP based on request
     */
    @PostMapping("/ai-move")
    public GameState getAIMove(@RequestBody AIMoveRequest request) {
        GameState gameState = request.getGameState();
        String algorithm = request.getAlgorithm() != null ? request.getAlgorithm() : "greedy";
        
        switch (algorithm.toLowerCase()) {
            case "minimax":
                return gameService.getMinimaxAIMove(gameState);
            case "dp":
                return gameService.getDPOptimizedAIMove(gameState);
            case "greedy":
            default:
                return gameService.getGreedyAIMove(gameState);
        }
    }

    /**
     * Get all valid moves for current state
     */
    @PostMapping("/valid-moves")
    public GameState getValidMoves(@RequestBody GameState gameState) {
        return gameService.getAllValidMoves(gameState);
    }

    /**
     * Reset game
     */
    @PostMapping("/reset")
    public GameState resetGame(@RequestBody GameState gameState) {
        return gameService.initializeGame(gameState.getN(), gameState.getRegions());
    }
    
    /**
     * Solve puzzle using specified algorithm
     */
    @PostMapping("/solve")
    public jar.model.QueensSolution solvePuzzle(@RequestBody SolveRequest request) {
        int n = request.getN();
        java.util.List<Integer> regions = request.getRegions();
        String algorithm = request.getAlgorithm() != null ? request.getAlgorithm() : "greedy";
        
        switch (algorithm.toLowerCase()) {
            case "minimax":
                return solverService.solveMinimaxDnC(n, regions);
            case "dp":
                return solverService.solveDPOptimized(n, regions);
            case "greedy":
            default:
                return solverService.solveGreedy(n, regions);
        }
    }
    
    /**
     * Get DP cache statistics
     */
    @GetMapping("/dp-stats")
    public java.util.Map<String, Object> getDPStats() {
        return solverService.getDPStatistics();
    }
    
    /**
     * Clear DP caches
     */
    @PostMapping("/clear-dp-cache")
    public String clearDPCache() {
        solverService.clearDPCache();
        return "DP cache cleared successfully";
    }
    
    // Request DTOs
    public static class AIMoveRequest {
        private GameState gameState;
        private String algorithm; // "greedy", "minimax", or "dp"
        
        public GameState getGameState() { return gameState; }
        public void setGameState(GameState gameState) { this.gameState = gameState; }
        public String getAlgorithm() { return algorithm; }
        public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
    }
    
    public static class SolveRequest {
        private int n;
        private java.util.List<Integer> regions;
        private String algorithm; // "greedy", "minimax", or "dp"
        
        public int getN() { return n; }
        public void setN(int n) { this.n = n; }
        public java.util.List<Integer> getRegions() { return regions; }
        public void setRegions(java.util.List<Integer> regions) { this.regions = regions; }
        public String getAlgorithm() { return algorithm; }
        public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
    }
}
