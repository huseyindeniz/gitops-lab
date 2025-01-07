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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
};
