package jar.model;

import java.util.ArrayList;
import java.util.List;

public class GameState {
    private int n; // Board size
    private List<Integer> regions; // Region mapping for each cell
    private List<Integer> queenPositions; // Positions of all placed queens
    private int currentPlayer; // 1 or 2
    private boolean gameOver;
    private String winner; // "Player 1", "Player 2", or "Draw"
    private String message;
    private List<Integer> validMoves; // Available moves for current player
    private int player1Queens; // Count of queens placed by player 1
    private int player2Queens; // Count of queens placed by player 2

    public GameState() {
        this.queenPositions = new ArrayList<>();
        this.validMoves = new ArrayList<>();
    }

    public GameState(int n, List<Integer> regions) {
        this.n = n;
        this.regions = regions;
        this.queenPositions = new ArrayList<>();
        this.currentPlayer = 1;
        this.gameOver = false;
        this.validMoves = new ArrayList<>();
        this.player1Queens = 0;
        this.player2Queens = 0;
    }

    // Getters and Setters
    public int getN() {
        return n;
    }

    public void setN(int n) {
        this.n = n;
    }

    public List<Integer> getRegions() {
        return regions;
    }

    public void setRegions(List<Integer> regions) {
        this.regions = regions;
    }

    public List<Integer> getQueenPositions() {
        return queenPositions;
    }

    public void setQueenPositions(List<Integer> queenPositions) {
        this.queenPositions = queenPositions;
    }

    public int getCurrentPlayer() {
        return currentPlayer;
    }

    public void setCurrentPlayer(int currentPlayer) {
        this.currentPlayer = currentPlayer;
    }

    public boolean isGameOver() {
        return gameOver;
    }

    public void setGameOver(boolean gameOver) {
        this.gameOver = gameOver;
    }

    public String getWinner() {
        return winner;
    }

    public void setWinner(String winner) {
        this.winner = winner;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<Integer> getValidMoves() {
        return validMoves;
    }

    public void setValidMoves(List<Integer> validMoves) {
        this.validMoves = validMoves;
    }

    public int getPlayer1Queens() {
        return player1Queens;
    }

    public void setPlayer1Queens(int player1Queens) {
        this.player1Queens = player1Queens;
    }

    public int getPlayer2Queens() {
        return player2Queens;
    }

    public void setPlayer2Queens(int player2Queens) {
        this.player2Queens = player2Queens;
    }
}
