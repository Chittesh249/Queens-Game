package jar.model;

public class Move {
    private int position; // Cell position (row * n + col)
    private int player; // Which player is making the move
    private GameState gameState; // Current game state

    public Move() {
    }

    public Move(int position, int player, GameState gameState) {
        this.position = position;
        this.player = player;
        this.gameState = gameState;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public int getPlayer() {
        return player;
    }

    public void setPlayer(int player) {
        this.player = player;
    }

    public GameState getGameState() {
        return gameState;
    }

    public void setGameState(GameState gameState) {
        this.gameState = gameState;
    }
}
