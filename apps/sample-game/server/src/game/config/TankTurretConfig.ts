export type TankTurretConfigProps = {
  name: string;
  width: number;
  height: number;
  offset: {
    x: number;
    y: number;
  };
  mass: number;
  friction: number;
  frictionAir: number;
  rotationSpeed: number;
  rotationTolerance: number;
  vertices: Matter.Vector[][];
};

export const TankTurretConfig: TankTurretConfigProps = {
  name: "tank-turret",
  width: 69,
  height: 31,
  offset: {
    x: -4,
    y: 0,
  },
  mass: 2,
  friction: 0.8,
  frictionAir: 0.8,
  rotationSpeed: 0.2,
  rotationTolerance: 0.02,
  vertices: [
    [
      {
        x: 0,
        y: 0,
      },
      {
        x: 39,
        y: 0,
      },
      {
        x: 39,
        y: 31,
      },
      {
        x: 0,
        y: 31,
      },
    ],
    [
      {
        x: 39,
        y: 12,
      },
      {
        x: 69,
        y: 12,
      },
      {
        x: 69,
        y: 19,
      },
      {
        x: 39,
        y: 19,
      },
    ],
  ],
};
