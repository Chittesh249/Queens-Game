package jar.model;

import java.util.List;

public class QueensSolution {
    private List<Integer> queenPositions; // List of queen positions (row * n + col)
    private boolean solved;
    private String message;

    public QueensSolution() {
    }

    public QueensSolution(List<Integer> queenPositions, boolean solved, String message) {
        this.queenPositions = queenPositions;
        this.solved = solved;
        this.message = message;
    }

    public List<Integer> getQueenPositions() {
        return queenPositions;
    }

    public void setQueenPositions(List<Integer> queenPositions) {
        this.queenPositions = queenPositions;
    }

    public boolean isSolved() {
        return solved;
    }

    public void setSolved(boolean solved) {
        this.solved = solved;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

