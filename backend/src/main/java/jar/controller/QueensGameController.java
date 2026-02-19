package jar.controller;

import jar.model.GameState;
import jar.model.Move;
import jar.service.QueensGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class QueensGameController {

    @Autowired
    private QueensGameService gameService;

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
     * Get AI's best move (solver selected by type)
     */
    @PostMapping("/ai-move")
    public GameState getAIMove(@RequestBody GameState gameState) {
        return gameService.getAIMove(gameState);
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
}
