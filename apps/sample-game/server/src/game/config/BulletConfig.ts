export type BulletConfigProps = {
  name: string;
  width: number;
  height: number;
  mass: number;
  friction: number;
  frictionAir: number;
  thrust: number;
};

export const BulletConfig: BulletConfigProps = {
  name: "tank-bullet",
  width: 30,
  height: 7,
  mass: 200,
  friction: 0.1,
  frictionAir: 0.01,
  thrust: 1,
};
