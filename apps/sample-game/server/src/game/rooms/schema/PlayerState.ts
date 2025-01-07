import { Schema, type } from "@colyseus/schema";
import { PlayerActions } from "../../config/PlayerCommands";

export class PlayerState extends Schema {
  @type("string") playerId: string;
  @type("boolean") isOn: boolean;
  @type("boolean") isReadyToFire: boolean;
  @type("number") fuel: number;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") r: number;
  @type("number") thrust: number;
  @type("number") turretR: number;
  @type("number") targetX: number;
  @type("number") targetY: number;
  @type("number") bulletStatus: number;
  @type("number") bulletX: number;
  @type("number") bulletY: number;
  @type("number") bulletR: number;
  actionQueue: PlayerActions[] = [];

  constructor(playerId: string) {
    super();
    this.playerId = playerId;
    this.isOn = false;
    this.isReadyToFire = false;
    this.fuel = 1000;
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.thrust = 0;
    this.turretR = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.bulletStatus = 0;
    this.bulletX = 0;
    this.bulletY = 0;
    this.bulletR = 0;
  }
}
