package jar.controller;

import jar.model.GameState;
import jar.model.Move;
import jar.service.AlgorithmBenchmarkService;
import jar.service.QueensGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class QueensGameController {

    @Autowired
    private QueensGameService gameService;

    @Autowired
    private AlgorithmBenchmarkService benchmarkService;

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
     * Get Pure Backtracking AI's best move
     */
    @PostMapping("/ai-move")
    public GameState getAIMove(@RequestBody GameState gameState) {
        return gameService.getBacktrackingAIMove(gameState);
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
     * Benchmark all algorithms and return results for graph
     */
    @GetMapping("/benchmark")
    public Map<String, Object> runBenchmark(
            @RequestParam(defaultValue = "4,5,6,7,8") String sizes) {
        
        // Parse board sizes
        String[] sizeArray = sizes.split(",");
        int[] boardSizes = new int[sizeArray.length];
        for (int i = 0; i < sizeArray.length; i++) {
            boardSizes[i] = Integer.parseInt(sizeArray[i].trim());
        }
        
        // Run benchmark
        Map<Integer, List<AlgorithmBenchmarkService.BenchmarkResult>> results = 
            benchmarkService.runBenchmarkRange(boardSizes);
        
        // Format for response
        Map<String, Object> response = new HashMap<>();
        response.put("csvData", benchmarkService.formatResultsForGraph(results));
        
        // Format for Chart.js
        List<String> labels = new ArrayList<>();
        Map<String, List<Double>> datasets = new HashMap<>();
        String[] algorithms = {"Greedy", "Backtracking", "Branch and Bound", 
                              "Divide and Conquer", "Dynamic Programming"};
        
        for (String algo : algorithms) {
            datasets.put(algo, new ArrayList<>());
        }
        
        for (int size : boardSizes) {
            labels.add("N=" + size);
            List<AlgorithmBenchmarkService.BenchmarkResult> sizeResults = results.get(size);
            
            for (String algo : algorithms) {
                double time = sizeResults.stream()
                    .filter(r -> r.algorithm.equals(algo))
                    .mapToDouble(r -> r.timeMillis)
                    .findFirst()
                    .orElse(0.0);
                datasets.get(algo).add(time);
            }
        }
        
        response.put("labels", labels);
        response.put("datasets", datasets);
        response.put("rawResults", results);
        
        // Print to console
        for (List<AlgorithmBenchmarkService.BenchmarkResult> resultList : results.values()) {
            benchmarkService.printResults(resultList);
        }
        
        return response;
    }
}