import Phaser from 'phaser';

import { SceneBoot } from './scenes/Boot';
import { SceneHome } from './scenes/Home';

export const engineConfig: Phaser.Types.Core.GameConfig = {
  title: 'Sample Phaser 3 Game',
  version: '0.0.1',
  banner: {
    hidePhaser: false,
  },
  type: Phaser.WEBGL,
  parent: 'phaser-container',
  backgroundColor: '#101010',
  scale: {
    mode: Phaser.Scale.NONE,
    width: 900,
    height: 600,
    parent: 'phaser-container',
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    antialiasGL: true,
    pixelArt: false,
    roundPixels: true,
  },
  //canvasStyle: `display: block; width: 100%; height: 100%;`,
  autoFocus: true,
  audio: {
    disableWebAudio: false,
  },
  scene: [SceneBoot, SceneHome],
};
