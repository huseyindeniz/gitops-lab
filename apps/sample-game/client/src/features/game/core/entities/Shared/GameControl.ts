export class GameControl {
  private _scene: Phaser.Scene;
  private _onClickMouseLeft: () => void;
  private _onClickMouseRight: (x: number, y: number) => void;
  private _onPressedW: () => void;
  private _onPressedS: () => void;
  private _onPressedD: () => void;
  private _onPressedA: () => void;
  private _onKeyUp: () => void;

  private _keyW?: Phaser.Input.Keyboard.Key;
  private _keyS?: Phaser.Input.Keyboard.Key;
  private _keyD?: Phaser.Input.Keyboard.Key;
  private _keyA?: Phaser.Input.Keyboard.Key;
  private _keyP?: Phaser.Input.Keyboard.Key;

  constructor(
    scene: Phaser.Scene,
    onClickMouseLeft: () => void,
    onClickMouseRight: (x: number, y: number) => void,
    onPressedW: () => void,
    onPressedS: () => void,
    onPressedD: () => void,
    onPressedA: () => void,
    onKeyUp: () => void
  ) {
    this._scene = scene;
    this._onClickMouseLeft = onClickMouseLeft;
    this._onClickMouseRight = onClickMouseRight;
    this._onPressedW = onPressedW;
    this._onPressedS = onPressedS;
    this._onPressedD = onPressedD;
    this._onPressedA = onPressedA;
    this._onKeyUp = onKeyUp;

    this._keyW = this._scene.input?.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.W
    );
    this._keyS = this._scene.input?.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );
    this._keyA = this._scene.input?.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    this._keyD = this._scene.input?.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.D
    );
    this._keyP = this._scene.input?.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.P
    );

    this._keyP?.on('down', () => {
      // take screenshot and download
      this._scene.game.renderer.snapshot(snapshot => {
        this._scene.cameras.main.fadeIn(500, 255, 255, 255);
        const image = snapshot as HTMLImageElement;
        if (image) {
          const snap = this._scene.textures.createCanvas(
            'snap',
            image.width,
            image.height
          );
          snap?.draw(0, 0, image);
          const base64 = snap?.canvas.toDataURL();
          const downloadLink = document.createElement('a');
          downloadLink.id = 'tmpScreenshotLink';
          const fileName = `FallenWars-Snapshot`;
          downloadLink.download = fileName;
          downloadLink.href = `${base64}`;
          downloadLink.click();
          document.getElementById('tmpScreenshotLink')?.remove();
        }
      });
    });

    this._scene.input.on(
      'pointerdown',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pointer: Phaser.Input.Pointer, _gameObject: any) => {
        if (pointer.leftButtonDown()) {
          this._onClickMouseLeft();
        } else if (pointer.rightButtonDown()) {
          this._onClickMouseRight(pointer.worldX + 12, pointer.worldY + 12);
        } else if (pointer.middleButtonDown()) {
          //
        }
      },
      this
    );
  }

  updateGameControl() {
    if (
      this._keyA?.isDown ||
      this._keyD?.isDown ||
      this._keyW?.isDown ||
      this._keyS?.isDown
    ) {
      if (this._keyA?.isDown) {
        this._onPressedA();
      }
      if (this._keyD?.isDown) {
        this._onPressedD();
      }
      if (this._keyW?.isDown) {
        this._onPressedW();
      }
      if (this._keyS?.isDown) {
        this._onPressedS();
      }
    } else {
      this._onKeyUp();
    }
  }
}
