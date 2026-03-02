package jar.service;

import jar.model.GameState;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Pure two-player backtracking (no alpha-beta, no heuristics).
 *
 * Game rules:
 * - Players alternate placing a queen ANYWHERE on the board
 * - A move is legal if it doesn't conflict by:
 *      row, column, diagonal
 *   and uses a region that hasn't been used
 * - If a player has NO legal move on their turn -> they LOSE (last move wins)
 *
 * Core logic:
 *   win(state) = exists move m such that !win(state after m)
 *   base: if no moves -> win(state) = false
 */
@Service
public class PureBacktrackingTwoPlayerService {

    /**
     * Returns a winning move if one exists, else returns any legal move, else -1.
     * pos encoding: pos = row*n + col
     */
    public int getMove(GameState gameState) {
        if (gameState == null || gameState.isGameOver()) return -1;

        int n = gameState.getN();
        List<Integer> regions = gameState.getRegions();
        List<Integer> queens = new ArrayList<>(gameState.getQueenPositions());

        // Build usedRegions + used squares set
        Set<Integer> usedRegions = new HashSet<>();
        Set<Integer> occupied = new HashSet<>(queens);
        for (int q : queens) usedRegions.add(regions.get(q));

        List<Integer> moves = getAllLegalMoves(n, regions, queens, usedRegions, occupied);
        if (moves.isEmpty()) return -1;

        // Try to find a WINNING move: one that makes opponent lose
        for (int move : moves) {
            int reg = regions.get(move);

            // DO
            queens.add(move);
            occupied.add(move);
            usedRegions.add(reg);

            boolean opponentCanWin = canCurrentPlayerWin(n, regions, queens, usedRegions, occupied);

            // UNDO
            queens.remove(queens.size() - 1);
            occupied.remove(move);
            usedRegions.remove(reg);

            if (!opponentCanWin) {
                return move; // winning move
            }
        }

        // No winning move exists -> return any legal move
        return moves.get(0);
    }

    /**
     * Returns true if the player to move can force a win from this state.
     * Pure win/lose propagation:
     *  - if no legal moves -> losing -> false
     *  - if exists a move that makes opponent lose -> true
     *  - else false
     */
    private boolean canCurrentPlayerWin(int n,
                                        List<Integer> regions,
                                        List<Integer> queens,
                                        Set<Integer> usedRegions,
                                        Set<Integer> occupied) {

        List<Integer> moves = getAllLegalMoves(n, regions, queens, usedRegions, occupied);

        // Base case: no move -> current player loses
        if (moves.isEmpty()) return false;

        // Try moves: if any move leaves opponent losing, current player is winning
        for (int move : moves) {
            int reg = regions.get(move);

            // DO
            queens.add(move);
            occupied.add(move);
            usedRegions.add(reg);

            boolean opponentWins = canCurrentPlayerWin(n, regions, queens, usedRegions, occupied);

            // UNDO
            queens.remove(queens.size() - 1);
            occupied.remove(move);
            usedRegions.remove(reg);

            // If opponent cannot win, we found a winning move
            if (!opponentWins) return true;
        }

        // All moves let opponent win -> losing
        return false;
    }

    /**
     * Generate ALL legal moves anywhere on the board.
     */
    private List<Integer> getAllLegalMoves(int n,
                                          List<Integer> regions,
                                          List<Integer> queens,
                                          Set<Integer> usedRegions,
                                          Set<Integer> occupied) {
        List<Integer> moves = new ArrayList<>();

        for (int pos = 0; pos < n * n; pos++) {
            if (occupied.contains(pos)) continue;

            int row = pos / n;
            int col = pos % n;
            int reg = regions.get(pos);

            if (isValidMoveAny(row, col, pos, reg, n, queens, usedRegions)) {
                moves.add(pos);
            }
        }
        return moves;
    }

    /**
     * Check constraints: region unused + no attack by existing queens (row/col/diagonal).
     */
    private boolean isValidMoveAny(int row, int col, int pos, int reg, int n,
                                   List<Integer> queens,
                                   Set<Integer> usedRegions) {

        if (usedRegions.contains(reg)) return false;

        for (int q : queens) {
            int qr = q / n;
            int qc = q % n;

            // same row
            if (qr == row) return false;

            // same column
            if (qc == col) return false;

            // diagonal
            if (Math.abs(qr - row) == Math.abs(qc - col)) return false;
        }

        return true;
    }
}
