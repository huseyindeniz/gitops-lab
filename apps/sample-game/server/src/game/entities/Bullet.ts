import path from "path";
import Matter, { Body } from "matter-js";
import {
  BULLET_CATEGORY,
  PLAYER_CATEGORY,
  WALL_CATEGORY,
} from "../config/Categories";
import { BulletConfig } from "../config/BulletConfig";

export enum BulletStatus {
  IDLE = 1,
  FIRED = 2,
  EXPLODED = 3,
}

export class Bullet {
  world: Matter.World;
  playerId: string;
  body: Matter.Body;
  status: BulletStatus;
  lastFired: number;
  rotation: number;
  //private _logger;

  constructor(world: Matter.World, playerId: string) {
    //this._logger = pinoLogger.child({ name: path.basename(__filename) });
    this.world = world;
    this.playerId = playerId;
    this.status = BulletStatus.IDLE;
    this.lastFired = 0;
    this.rotation = 0;
  }

  public fire(x: number, y: number, r: number) {
    this.rotation = r;
    this.body = Matter.Bodies.rectangle(
      x,
      y,
      BulletConfig.width / 2,
      BulletConfig.height / 2,
      {
        label: this.playerId,
        isStatic: false,
        mass: BulletConfig.mass,
        restitution: 0,
        friction: BulletConfig.friction,
        frictionAir: BulletConfig.frictionAir,
        collisionFilter: {
          category: BULLET_CATEGORY,
          mask: WALL_CATEGORY | PLAYER_CATEGORY,
        },
      }
    );
    // Add to world
    Matter.World.add(this.world, this.body);

    Body.setAngularVelocity(this.body, 0);
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.rotate(this.body, r);
  }

  public move() {
    const forceX = Math.cos(this.rotation) * BulletConfig.thrust;
    const forceY = Math.sin(this.rotation) * BulletConfig.thrust;
    //this._logger.debug(`force applied to bullet: fx: ${forceX}, fy:${forceY}`);
    Body.applyForce(this.body, this.body.position, {
      x: forceX,
      y: forceY,
    });
  }

  public explode() {
    if (this.body) {
      Body.setSpeed(this.body, 0);
      Body.setAngularSpeed(this.body, 0);
      Matter.World.remove(this.world, this.body);
      this.body = null;
    }
  }
}
