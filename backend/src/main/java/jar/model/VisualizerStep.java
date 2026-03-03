package jar.model;

import java.util.List;

public class VisualizerStep {
    private String type; // TRY, PLACE, REMOVE, CONFLICT, SUCCESS, BACKTRACK
    private int position;
    private List<Integer> queens;
    private String message;

    public VisualizerStep(String type, int position, List<Integer> queens, String message) {
        this.type = type;
        this.position = position;
        this.queens = queens;
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public List<Integer> getQueens() {
        return queens;
    }

    public void setQueens(List<Integer> queens) {
        this.queens = queens;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
