
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

export const getAIMove = async (gameState: GameState): Promise<GameState> => {
  const response = await axios.post(`${API_BASE_URL}/ai-move`, gameState);
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

export const getBenchmarks = async (): Promise<any[]> => {
  const response = await axios.get(`${API_BASE_URL}/benchmarks`);
  return response.data;
};

export const getBacktrackingSteps = async (n: number, regions: number[]): Promise<any[]> => {
  const response = await axios.post(`http://localhost:8080/api/visualize/backtracking`, { n, regions });
  return response.data;
};
