import path from "path";
import fs from "fs";
import Matter, { Bodies, Body } from "matter-js";
import {
  BULLET_CATEGORY,
  PLAYER_CATEGORY,
  WALL_CATEGORY,
} from "../config/Categories";
import { MapConfig } from "../config/MapConfig";

export class GameMap {
  private _world: Matter.World;
  private _mapWidth: number = MapConfig.width;
  private _mapHeight: number = MapConfig.height;
  private _spawnPoints: { x: number; y: number }[];
  //private _logger;

  constructor(world: Matter.World) {
    //this._logger = pinoLogger.child({ name: path.basename(__filename) });
    this._world = world;
    this._spawnPoints = MapConfig.spawnPoints;
    this._init();
  }

  public getRandomSpawnPoint() {
    const spawnPointIndex = Math.ceil(
      Math.random() * this._spawnPoints.length - 1
    );
    //this._logger.debug(spawnPointIndex);
    const spawnPoint = this._spawnPoints[spawnPointIndex];
    return spawnPoint;
  }

  private _init() {
    this._setWalls();
    this._loadBasicMap();
  }

  private _setWalls() {
    // walls
    Matter.Composite.add(this._world, [
      // top
      Bodies.rectangle(this._mapWidth / 2, -15, this._mapWidth, 20, {
        isStatic: true,
        restitution: 0,
        collisionFilter: {
          category: WALL_CATEGORY,
          mask: WALL_CATEGORY | BULLET_CATEGORY | PLAYER_CATEGORY,
        },
      }),
      // bottom
      Bodies.rectangle(
        this._mapWidth / 2,
        this._mapHeight + 15,
        this._mapWidth,
        20,
        {
          isStatic: true,
          restitution: 0,
          collisionFilter: {
            category: WALL_CATEGORY,
            mask: WALL_CATEGORY | BULLET_CATEGORY | PLAYER_CATEGORY,
          },
        }
      ),
      // right
      Bodies.rectangle(
        this._mapWidth + 15,
        this._mapHeight / 2,
        20,
        this._mapHeight,
        {
          isStatic: true,
          restitution: 0,
          collisionFilter: {
            category: WALL_CATEGORY,
            mask: WALL_CATEGORY | BULLET_CATEGORY | PLAYER_CATEGORY,
          },
        }
      ),
      // left
      Bodies.rectangle(-15, this._mapHeight / 2, 20, this._mapHeight, {
        isStatic: true,
        restitution: 0,
        collisionFilter: {
          category: WALL_CATEGORY,
          mask: WALL_CATEGORY | BULLET_CATEGORY | PLAYER_CATEGORY,
        },
      }),
    ]);
  }

  private _loadBasicMap() {
    const mapDataRaw = fs.readFileSync("maps/basic/basicBodies.json", "utf8");
    const mapData = JSON.parse(mapDataRaw);
    mapData.forEach((data: any) => {
      const newBody = Bodies.rectangle(
        data.pixelX,
        data.pixelY,
        data.width,
        data.height,
        {
          label: "wall",
          isStatic: true,
          isSensor: false,
          mass: 500,
          restitution: 0,
          collisionFilter: {
            category: WALL_CATEGORY,
            mask: WALL_CATEGORY | BULLET_CATEGORY | PLAYER_CATEGORY,
          },
        }
      );
      Body.setCentre(newBody, data.rotationPoint, false);
      Body.rotate(newBody, data.rotation);
      Matter.World.add(this._world, newBody);
    });
  }
}
