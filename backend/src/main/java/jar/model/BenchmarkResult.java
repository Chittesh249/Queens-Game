package jar.model;

public class BenchmarkResult {
    private String algorithm;
    private int n;
    private long timeMs;
    private int statesExplored;
    private double spaceComplexity; // In appropriate units, e.g., memory used or relative recursion depth

    public BenchmarkResult(String algorithm, int n, long timeMs, int statesExplored, double spaceComplexity) {
        this.algorithm = algorithm;
        this.n = n;
        this.timeMs = timeMs;
        this.statesExplored = statesExplored;
        this.spaceComplexity = spaceComplexity;
    }

    // Getters and Setters
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
    public int getN() { return n; }
    public void setN(int n) { this.n = n; }
    public long getTimeMs() { return timeMs; }
    public void setTimeMs(long timeMs) { this.timeMs = timeMs; }
    public int getStatesExplored() { return statesExplored; }
    public void setStatesExplored(int statesExplored) { this.statesExplored = statesExplored; }
    public double getSpaceComplexity() { return spaceComplexity; }
    public void setSpaceComplexity(double spaceComplexity) { this.spaceComplexity = spaceComplexity; }
}
