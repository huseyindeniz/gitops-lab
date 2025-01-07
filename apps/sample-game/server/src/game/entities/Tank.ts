import path from "path";
import Matter, { Body } from "matter-js";
import {
  BULLET_CATEGORY,
  PLAYER_CATEGORY,
  WALL_CATEGORY,
} from "../config/Categories";
import { TankBaseConfig } from "../config/TankBaseConfig";
import { TankTurretConfig } from "../config/TankTurretConfig";
import { Bullet, BulletStatus } from "./Bullet";

import { PhaserMathAngleBetween, PhaserMathAngleWrap } from "../Utils";
import { PlayerActions } from "../config/PlayerCommands";

export class Tank {
  _world: Matter.World;
  _playerId: string;
  _body: Matter.Body;
  _turret: Matter.Body;
  _bullet: Bullet;
  _isReadyToFire: boolean;
  _thrust: number;
  //private _logger;

  constructor(world: Matter.World, playerId: string, x: number, y: number) {
    //this._logger = pinoLogger.child({ name: path.basename(__filename) });
    this._world = world;
    this._playerId = playerId;
    this._isReadyToFire = true;
    this._thrust = 0;
    this._body = Matter.Bodies.rectangle(
      x,
      y,
      TankBaseConfig.width,
      TankBaseConfig.height,
      {
        label: playerId,
        isStatic: false,
        mass: TankBaseConfig.mass,
        restitution: 0,
        friction: TankBaseConfig.friction,
        frictionAir: TankBaseConfig.frictionAir,
        collisionFilter: {
          category: PLAYER_CATEGORY,
          mask: WALL_CATEGORY | BULLET_CATEGORY | PLAYER_CATEGORY,
        },
      }
    );

    this._turret = Matter.Bodies.fromVertices(x, y, TankTurretConfig.vertices, {
      label: playerId,
      isSensor: false,
      isStatic: false,
      mass: TankTurretConfig.mass,
      restitution: 0,
      friction: TankTurretConfig.friction,
      frictionAir: TankTurretConfig.frictionAir,
      collisionFilter: {
        category: PLAYER_CATEGORY,
        mask: WALL_CATEGORY | BULLET_CATEGORY | PLAYER_CATEGORY,
      },
    });

    const offset = TankTurretConfig.offset;
    const originX = this._turret.position.x + offset.x / TankTurretConfig.width;
    const originY =
      this._turret.position.y + offset.y / TankTurretConfig.height;

    Body.setCentre(
      this._turret,
      {
        x: originX,
        y: originY,
      },
      true
    );

    // Add to world
    Matter.World.add(this._world, this._body);
    Matter.World.add(this._world, this._turret);
    // Add constraint
    const constraint = Matter.Constraint.create({
      bodyA: this._body,
      bodyB: this._turret,
      length: 0,
      stiffness: 1,
    });

    Matter.World.add(this._world, constraint);

    this._bullet = new Bullet(this._world, this._playerId);
  }

  public isReadyToFire() {
    return this._isReadyToFire;
  }

  public getState() {
    const state = {
      x: this._body.position.x,
      y: this._body.position.y,
      r: this._body.angle,
      thrust: this._thrust,
      turretR: this._turret.angle,
      isReadyToFire: this._isReadyToFire,
      bulletStatus: this._bullet.status,
      bulletX: this._bullet.body ? this._bullet.body.position.x : 0,
      bulletY: this._bullet.body ? this._bullet.body.position.y : 0,
      bulletR: this._bullet.body ? this._bullet.body.angle : 0,
    };
    return state;
  }

  public executeAction(action: PlayerActions) {
    switch (action) {
      case PlayerActions.NEUTRAL:
        this._thrust = 0;
        break;
      case PlayerActions.MOVE_FORWARD:
        this._moveForward();
        break;
      case PlayerActions.MOVE_BACKWARD:
        this._moveBackward();
        break;
      case PlayerActions.ROTATE_RIGHT:
        this._rotateRight();
        break;
      case PlayerActions.ROTATE_LEFT:
        this._rotateLeft();
        break;
      case PlayerActions.FIRE:
        this._fire();
        break;
      default:
        break;
    }
  }

  public update(targetX: number, targetY: number) {
    this._updateTurret(targetX, targetY);
    this._updateBullet();
  }

  public explode() {
    Matter.Composite.remove(this._world, [this._body, this._turret]);
  }

  public explodeBullet() {
    this._bullet.explode();
    this._bullet.status = BulletStatus.EXPLODED;
    //this._logger.debug("BULLET STATUS CHANGED TO: EXPLODED");
  }

  private _updateTurret(targetX: number, targetY: number) {
    const angleToPointer = PhaserMathAngleBetween(
      this._turret.position.x,
      this._turret.position.y,
      targetX,
      targetY
    );
    const angleDelta = PhaserMathAngleWrap(angleToPointer - this._turret.angle);
    if (Math.abs(angleDelta) < TankTurretConfig.rotationTolerance) {
      this._turret.angle = angleToPointer;
      Body.setAngularVelocity(this._turret, 0);
    } else {
      if (angleDelta > 0) {
        Body.setAngularVelocity(this._turret, TankTurretConfig.rotationSpeed);
      } else if (angleDelta < 0) {
        Body.setAngularVelocity(this._turret, -TankTurretConfig.rotationSpeed);
      }
    }
  }

  private _updateBullet() {
    if (this._bullet.status === BulletStatus.FIRED) {
      this._bullet.lastFired += 1;
      this._bullet.move();
    } else if (this._bullet.status === BulletStatus.EXPLODED) {
      this._bullet.lastFired += 1;
    }

    if (this._bullet.lastFired > 130) {
      // if it's not exploded until now, it should explode first
      if (this._bullet.status === BulletStatus.FIRED) {
        this.explodeBullet();
      }
      if (this._bullet.status === BulletStatus.EXPLODED) {
        this._isReadyToFire = true;
        this._bullet.lastFired = 0;
        this._bullet.status = BulletStatus.IDLE;
        //this._logger.debug("BULLET STATUS CHANGED TO: IDLE");
      }
    }
  }

  private _moveForward() {
    this._thrust = TankBaseConfig.forwardThrust;
    const forceX = Math.cos(this._body.angle) * TankBaseConfig.forwardThrust;
    const forceY = Math.sin(this._body.angle) * TankBaseConfig.forwardThrust;
    Body.applyForce(this._body, this._body.position, {
      x: forceX,
      y: forceY,
    });
  }

  private _moveBackward() {
    this._thrust = TankBaseConfig.backwardThrust;
    const forceX = Math.cos(this._body.angle) * TankBaseConfig.backwardThrust;
    const forceY = Math.sin(this._body.angle) * TankBaseConfig.backwardThrust;
    Body.applyForce(this._body, this._body.position, {
      x: -forceX,
      y: -forceY,
    });
  }

  private _rotateLeft() {
    Body.setAngularVelocity(this._body, -TankBaseConfig.rotationSpeed);
  }

  private _rotateRight() {
    Body.setAngularVelocity(this._body, TankBaseConfig.rotationSpeed);
  }

  private _fire() {
    if (this._isReadyToFire) {
      this._isReadyToFire = false;
      const direction = Matter.Vector.create(
        Math.cos(this._turret.angle),
        Math.sin(this._turret.angle)
      );
      const ox = this._turret.position.x + direction.x * TankTurretConfig.width;
      const oy = this._turret.position.y + direction.y * TankTurretConfig.width;
      //this._logger.debug(`fire pos: ${ox}, ${oy}, ${this._turret.angle}`);
      this._bullet.fire(ox, oy, this._turret.angle);
      this._bullet.status = BulletStatus.FIRED;
      //this._logger.debug("BULLET STATUS CHANGED TO: FIRED");
    }
  }
}
