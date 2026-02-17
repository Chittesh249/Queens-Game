
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/game';

interface GameState {
  n: number;
  regions: number[];
  queenPositions: number[];
  currentPlayer: number;
  gameOver: boolean;
  winner: string | null;
  message: string;
  validMoves: number[];
  player1Queens: number;
  player2Queens: number;
}

interface AIMoveRequest {
  gameState: GameState;
  algorithm?: "greedy" | "minimax" | "dp";
}

interface Move {
  position: number;
  player: number;
  gameState: GameState;
}

export const initGame = async (n: number, regions: number[]): Promise<GameState> => {
  const response = await axios.post(`${API_BASE_URL}/init`, { n, regions });
  return response.data;
};

export const makeMove = async (move: Move): Promise<GameState> => {
  const response = await axios.post(`${API_BASE_URL}/move`, move);
  return response.data;
};

interface AIMoveRequest {
  gameState: GameState;
  algorithm?: "greedy" | "minimax" | "dp";
}

export const getAIMove = async (gameState: GameState, algorithm?: "greedy" | "minimax" | "dp"): Promise<GameState> => {
  const request: AIMoveRequest = {
    gameState: gameState,
    algorithm: algorithm
  };
  const response = await axios.post(`${API_BASE_URL}/ai-move`, request);
  return response.data;
};

export const getValidMoves = async (gameState: GameState): Promise<GameState> => {
  const response = await axios.post(`${API_BASE_URL}/valid-moves`, gameState);
  return response.data;
};

export const resetGame = async (gameState: GameState): Promise<GameState> => {
    const response = await axios.post(`${API_BASE_URL}/reset`, gameState);
    return response.data;
};
