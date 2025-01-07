import log from 'loglevel';

const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Monaco, Courier, monospace',
  color: '#ababab',
  fontStyle: 'bold',
};

export class Preloader extends Phaser.Scene {
  constructor(key: string) {
    super({ key });
  }

  preload() {
    const fontSize = (textStyle.fontSize as number) ?? 20;

    // setup loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    // const { width: gameWidth, height: gameHeight } = this.cameras.main;
    const gameWidth = screen.width;
    const gameHeight = screen.height;

    const barPositionX = Math.ceil((gameWidth - gameWidth * 0.7) / 2);
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      barPositionX,
      Math.ceil(gameHeight / 6),
      Math.ceil(gameWidth * 0.7),
      Math.ceil(gameHeight / 10)
    );

    const loadingText = this.add.text(
      gameWidth / 2,
      Math.ceil(gameHeight / 10),
      'loading...',
      textStyle
    );

    loadingText.setOrigin(0.5);
    //loadingText.setResolution(30);

    const percentText = this.add.text(
      gameWidth / 2,
      Math.ceil(gameHeight / 6 + fontSize / 2 + gameHeight / 60),
      '0%',
      textStyle
    );

    percentText.setOrigin(0.5);
    //percentText.setResolution(30);

    const assetText = this.add.text(
      gameWidth / 2,
      Math.ceil(gameHeight / 3),
      '',
      textStyle
    );

    assetText.setOrigin(0.5, 0.5);
    assetText.setResolution(30);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        barPositionX,
        Math.ceil(gameHeight / 6),
        Math.ceil(gameWidth * 0.7) * value,
        Math.ceil(gameHeight / 10)
      );
      percentText.setText(`${(value * 100).toFixed(0)}%`);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.load.on('fileprogress', (file: any) => {
      assetText.setText(`loading asset: ${file.key}`);
      log.debug(file.src);
    });

    this.load.on('complete', () => {
      loadingText.destroy();
      progressBar.destroy();
      progressBox.destroy();
      percentText.destroy();
      assetText.destroy();
      log.debug('complete');
    });

    this.load.setBaseURL('assets/game');
  }
}
