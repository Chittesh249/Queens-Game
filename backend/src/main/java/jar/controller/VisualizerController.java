package jar.controller;

import jar.model.GameState;
import jar.model.VisualizerStep;
import jar.service.BacktrackingVisualizerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visualize")
@CrossOrigin(origins = "*")
public class VisualizerController {

    @Autowired
    private BacktrackingVisualizerService visualizerService;

    @PostMapping("/backtracking")
    public List<VisualizerStep> getBacktrackingSteps(@RequestBody GameState gameState) {
        return visualizerService.getVisualizationSteps(gameState.getN(), gameState.getRegions());
    }
}
