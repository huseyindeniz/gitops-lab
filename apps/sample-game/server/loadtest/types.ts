export enum EGameState {
  IDLE,
  WAITING_PLAYERS,
  ON_COUNT_DOWN,
  PLAYING,
  ENDED,
}

export interface GameState {
  state: EGameState;
  maxPlayers: number;
  countDown: number;
}

export interface PlayerState {
  playerId: string;
  isOn: boolean;
  isReadyToFire: boolean;
  fuel: number;
  x: number;
  y: number;
  r: number;
  thrust: number;
  turretR: number;
  targetX: number;
  targetY: number;
  bulletStatus: number;
  bulletX: number;
  bulletY: number;
  bulletR: number;
}

export interface TestRoomState {
  gameState: GameState;
  players: Map<string, PlayerState>;
}

export enum PlayerCommands {
  ENGINE_OFF = 1,
  ENGINE_ON = 2,
  SET_TARGET = 3,
  ACTION = 4,
}

export enum PlayerActions {
  NEUTRAL = 1,
  MOVE_FORWARD = 2,
  MOVE_BACKWARD = 3,
  ROTATE_LEFT = 4,
  ROTATE_RIGHT = 5,
  FIRE = 6,
}

export type PlayerCommand = {
  type: PlayerCommands;
  action?: PlayerActions;
  params?: any;
};
