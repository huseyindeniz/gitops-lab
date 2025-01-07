import { Schema, type } from "@colyseus/schema";

export enum EGameState {
  IDLE,
  WAITING_PLAYERS,
  ON_COUNT_DOWN,
  PLAYING,
  ENDED,
}

export class GameState extends Schema {
  @type("number") state: EGameState = EGameState.IDLE;
  @type("number") maxPlayers: number = -1;
  @type("number") countDown: number = 0;
}
