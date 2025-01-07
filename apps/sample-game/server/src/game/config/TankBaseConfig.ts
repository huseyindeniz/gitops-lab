export type TankBaseConfigProps = {
  name: string;
  width: number;
  height: number;
  mass: number;
  friction: number;
  frictionAir: number;
  forwardThrust: number;
  backwardThrust: number;
  rotationSpeed: number;
  fuelMax: number;
  fuelConsumptionIdle: number;
  fuelConsumptionPerThrust: number;
};

export const TankBaseConfig: TankBaseConfigProps = {
  name: "tank-base",
  width: 66,
  height: 52,
  mass: 50000,
  friction: 0.8,
  frictionAir: 0.8,
  forwardThrust: 500,
  backwardThrust: 300,
  rotationSpeed: 0.1,
  fuelMax: 1000,
  fuelConsumptionIdle: 1 / 60,
  fuelConsumptionPerThrust: 0.00025,
};
