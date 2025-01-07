export class RemotePlayerInfo extends Phaser.GameObjects.Container {
  private _playerName: Phaser.GameObjects.Text;
  private _fuel: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    fuel: number
  ) {
    super(scene, x - 50, y - 60);
    this._playerName = scene.add.text(0, 0, name, {
      fontSize: 12,
    });
    this._fuel = scene.add.text(0, 20, `Fuel:${fuel.toFixed()}`, {
      fontSize: 12,
    });
    this.add([this._playerName, this._fuel]);
  }

  public updateRemotePlayerInfo(x: number, y: number, fuel: number) {
    this.setPosition(x - 50, y - 60);
    this._fuel.setText(`Fuel:${fuel.toFixed()}`);
  }
}
