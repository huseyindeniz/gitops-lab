import { SCENES } from '../config/Scenes';
import { Preloader } from '../utils/Preloader';

export class SceneBoot extends Preloader {
  constructor() {
    super(SCENES.BOOT);
  }

  preload() {
    super.preload();
    this.load.setBaseURL('assets/game');
  }

  create() {
    this.scene.start(SCENES.HOME);
  }
}
