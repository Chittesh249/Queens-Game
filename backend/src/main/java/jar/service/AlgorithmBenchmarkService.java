package jar.service;

import jar.model.GameState;
import jar.model.QueensSolution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Benchmark Service to compare algorithm performance
 * 
 * Measures time taken for:
 * - Greedy
 * - Backtracking
 * - Branch and Bound
 * - Divide and Conquer
 * - Dynamic Programming
 */
@Service
public class AlgorithmBenchmarkService {

    @Autowired
    private GreedySolverService greedySolver;

    @Autowired
    private BacktrackingSolverService backtrackingSolver;

    @Autowired
    private BranchAndBoundSolverService branchAndBoundSolver;

    @Autowired
    private DnCBacktrackingSolverService dncSolver;

    @Autowired
    private MinimaxDpSolverService minimaxDpSolver;

    /**
     * Benchmark result holder
     */
    public static class BenchmarkResult {
        public String algorithm;
        public int boardSize;
        public long timeNanos;
        public double timeMillis;
        public boolean success;
        public int queensPlaced;
        public String message;

        public BenchmarkResult(String algorithm, int boardSize, long timeNanos, 
                              boolean success, int queensPlaced, String message) {
            this.algorithm = algorithm;
            this.boardSize = boardSize;
            this.timeNanos = timeNanos;
            this.timeMillis = timeNanos / 1_000_000.0;
            this.success = success;
            this.queensPlaced = queensPlaced;
            this.message = message;
        }
    }

    /**
     * Run benchmark for all algorithms
     */
    public List<BenchmarkResult> runBenchmark(int boardSize, List<Integer> regions) {
        List<BenchmarkResult> results = new ArrayList<>();

        // 1. Greedy
        results.add(benchmarkGreedy(boardSize, regions));

        // 2. Backtracking
        results.add(benchmarkBacktracking(boardSize, regions));

        // 3. Branch and Bound
        results.add(benchmarkBranchAndBound(boardSize, regions));

        // 4. Divide and Conquer
        results.add(benchmarkDnC(boardSize, regions));

        // 5. Dynamic Programming (Minimax)
        results.add(benchmarkDP(boardSize, regions));

        return results;
    }

    /**
     * Benchmark multiple board sizes
     */
    public Map<Integer, List<BenchmarkResult>> runBenchmarkRange(int[] boardSizes) {
        Map<Integer, List<BenchmarkResult>> allResults = new LinkedHashMap<>();

        for (int size : boardSizes) {
            // Generate regions for this board size
            List<Integer> regions = generateRegions(size);
            allResults.put(size, runBenchmark(size, regions));
        }

        return allResults;
    }

    /**
     * Benchmark Greedy algorithm
     */
    private BenchmarkResult benchmarkGreedy(int boardSize, List<Integer> regions) {
        long start = System.nanoTime();
        
        try {
            QueensSolution solution = greedySolver.solveGreedy(boardSize, regions);
            long end = System.nanoTime();
            
            return new BenchmarkResult(
                "Greedy",
                boardSize,
                end - start,
                solution.isSolved(),
                solution.getQueenPositions().size(),
                solution.getMessage()
            );
        } catch (Exception e) {
            long end = System.nanoTime();
            return new BenchmarkResult(
                "Greedy",
                boardSize,
                end - start,
                false,
                0,
                "Error: " + e.getMessage()
            );
        }
    }

    /**
     * Benchmark Backtracking algorithm
     */
    private BenchmarkResult benchmarkBacktracking(int boardSize, List<Integer> regions) {
        long start = System.nanoTime();
        
        try {
            QueensSolution solution = backtrackingSolver.solveBacktracking(boardSize, regions);
            long end = System.nanoTime();
            
            return new BenchmarkResult(
                "Backtracking",
                boardSize,
                end - start,
                solution.isSolved(),
                solution.getQueenPositions().size(),
                solution.getMessage()
            );
        } catch (Exception e) {
            long end = System.nanoTime();
            return new BenchmarkResult(
                "Backtracking",
                boardSize,
                end - start,
                false,
                0,
                "Error: " + e.getMessage()
            );
        }
    }

    /**
     * Benchmark Branch and Bound algorithm
     */
    private BenchmarkResult benchmarkBranchAndBound(int boardSize, List<Integer> regions) {
        long start = System.nanoTime();
        
        try {
            // Use the solve method if available, otherwise skip
            var solution = branchAndBoundSolver.solve(boardSize, regions);
            long end = System.nanoTime();
            
            return new BenchmarkResult(
                "Branch and Bound",
                boardSize,
                end - start,
                solution.isSolved(),
                solution.getQueenPositions().size(),
                solution.getMessage()
            );
        } catch (Exception e) {
            long end = System.nanoTime();
            return new BenchmarkResult(
                "Branch and Bound",
                boardSize,
                end - start,
                false,
                0,
                "Error: " + e.getMessage()
            );
        }
    }

    /**
     * Benchmark Divide and Conquer algorithm
     */
    private BenchmarkResult benchmarkDnC(int boardSize, List<Integer> regions) {
        long start = System.nanoTime();
        
        try {
            QueensSolution solution = dncSolver.solveDnC(boardSize, regions);
            long end = System.nanoTime();
            
            return new BenchmarkResult(
                "Divide and Conquer",
                boardSize,
                end - start,
                solution.isSolved(),
                solution.getQueenPositions().size(),
                solution.getMessage()
            );
        } catch (Exception e) {
            long end = System.nanoTime();
            return new BenchmarkResult(
                "Divide and Conquer",
                boardSize,
                end - start,
                false,
                0,
                "Error: " + e.getMessage()
            );
        }
    }

    /**
     * Benchmark Dynamic Programming (Minimax) algorithm
     */
    private BenchmarkResult benchmarkDP(int boardSize, List<Integer> regions) {
        long start = System.nanoTime();
        
        try {
            QueensSolution solution = minimaxDpSolver.solveMinimax(boardSize, regions);
            long end = System.nanoTime();
            
            return new BenchmarkResult(
                "Dynamic Programming",
                boardSize,
                end - start,
                solution.isSolved(),
                solution.getQueenPositions().size(),
                solution.getMessage()
            );
        } catch (Exception e) {
            long end = System.nanoTime();
            return new BenchmarkResult(
                "Dynamic Programming",
                boardSize,
                end - start,
                false,
                0,
                "Error: " + e.getMessage()
            );
        }
    }

    /**
     * Generate regions for benchmarking
     */
    private List<Integer> generateRegions(int n) {
        List<Integer> regions = new ArrayList<>();
        Random random = new Random(42); // Fixed seed for reproducibility
        
        for (int i = 0; i < n * n; i++) {
            regions.add(random.nextInt(n));
        }
        
        return regions;
    }

    /**
     * Format results for display/graph
     */
    public String formatResultsForGraph(Map<Integer, List<BenchmarkResult>> results) {
        StringBuilder sb = new StringBuilder();
        
        // Header
        sb.append("Board Size");
        String[] algorithms = {"Greedy", "Backtracking", "Branch and Bound", 
                              "Divide and Conquer", "Dynamic Programming"};
        for (String algo : algorithms) {
            sb.append(",").append(algo).append(" (ms)");
        }
        sb.append("\n");
        
        // Data rows
        for (Map.Entry<Integer, List<BenchmarkResult>> entry : results.entrySet()) {
            sb.append(entry.getKey());
            
            for (String algo : algorithms) {
                double time = entry.getValue().stream()
                    .filter(r -> r.algorithm.equals(algo))
                    .mapToDouble(r -> r.timeMillis)
                    .findFirst()
                    .orElse(0.0);
                sb.append(",").append(String.format("%.3f", time));
            }
            sb.append("\n");
        }
        
        return sb.toString();
    }

    /**
     * Print results in table format
     */
    public void printResults(List<BenchmarkResult> results) {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("ALGORITHM PERFORMANCE COMPARISON");
        System.out.println("=".repeat(80));
        System.out.printf("%-20s %-10s %-12s %-10s %-10s\n", 
                         "Algorithm", "Board", "Time (ms)", "Success", "Queens");
        System.out.println("-".repeat(80));
        
        for (BenchmarkResult r : results) {
            System.out.printf("%-20s %-10d %-12.3f %-10s %-10d\n",
                            r.algorithm, r.boardSize, r.timeMillis, 
                            r.success ? "Yes" : "No", r.queensPlaced);
        }
        System.out.println("=".repeat(80));
    }
}
