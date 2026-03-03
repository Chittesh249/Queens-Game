package jar.service;

import jar.model.VisualizerStep;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class BacktrackingVisualizerService {

    private static final int MAX_STEPS = 5000;

    public List<VisualizerStep> getVisualizationSteps(int n, List<Integer> regions) {
        List<VisualizerStep> steps = new ArrayList<>();
        solve(n, regions, new ArrayList<>(), new HashSet<>(), steps);
        return steps;
    }

    private boolean solve(int n, List<Integer> regions, List<Integer> queens, Set<Integer> usedRegions, List<VisualizerStep> steps) {
        if (steps.size() >= MAX_STEPS) {
            steps.add(new VisualizerStep("BACKTRACK", -1, new ArrayList<>(queens), "Step limit reached. Stopping."));
            return false;
        }

        int row = queens.size();
        if (row == n) {
            steps.add(new VisualizerStep("SUCCESS", -1, new ArrayList<>(queens), "Solution found!"));
            return true;
        }

        for (int col = 0; col < n; col++) {
            int pos = row * n + col;
            int region = regions.get(pos);

            if (isSafe(row, col, pos, region, n, queens, usedRegions)) {
                queens.add(pos);
                usedRegions.add(region);
                steps.add(new VisualizerStep("PLACE", pos, new ArrayList<>(queens), "Placed queen at row " + row + ", col " + col + " (region " + region + ")"));

                if (solve(n, regions, queens, usedRegions, steps)) {
                    return true;
                }

                queens.remove(queens.size() - 1);
                usedRegions.remove(region);
                steps.add(new VisualizerStep("BACKTRACK", pos, new ArrayList<>(queens), "Backtracking from row " + row + ", col " + col));
            }
        }

        return false;
    }

    private boolean isSafe(int row, int col, int pos, int reg, int n, List<Integer> queens, Set<Integer> usedRegions) {
        if (usedRegions.contains(reg)) return false;

        for (int q : queens) {
            int qr = q / n;
            int qc = q % n;

            // Row is handled by the recursion level (one queen per row)
            if (qr == row) return false;
            // Column
            if (qc == col) return false;
            // Diagonal
            if (Math.abs(qr - row) == Math.abs(qc - col)) return false;
        }

        return true;
    }
}
