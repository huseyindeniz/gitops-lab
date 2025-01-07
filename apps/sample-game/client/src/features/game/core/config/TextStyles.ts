export const FontFamily: string = 'Monaco, Courier, monospace';
export const FontSize: number = 24;

export interface GAME_TEXT_STYLE
  extends Phaser.Types.GameObjects.Text.TextStyle {
  hover?: Phaser.Types.GameObjects.Text.TextStyle;
  active?: Phaser.Types.GameObjects.Text.TextStyle;
}
export const SCENE_TITLE_TEXT_STYLE: GAME_TEXT_STYLE = {
  fontFamily: 'Monaco, Courier, monospace',
  fontSize: 20,
  color: '#ff0000',
};

export const HUD_MENU_ITEM_TEXT_STYLE: GAME_TEXT_STYLE = {
  fontFamily: 'Monaco, Courier, monospace',
  color: '#ababab',
  fontStyle: 'bold',
  hover: {
    color: '#ff0000',
  },
};

export const HUD_SUBTITLE_TEXT_STYLE: GAME_TEXT_STYLE = {
  fontFamily: 'Monaco, Courier, monospace',
  fontSize: 10,
  color: '#ff0000',
  align: 'center',
};
export const HUD_CONTENT_TEXT_STYLE: GAME_TEXT_STYLE = {
  fontFamily: 'Monaco, Courier, monospace',
  fontSize: 10,
  color: '#efefef',
  align: 'center',
};

export const TANK_PLAYER_INFO_TEXT_STYLE: GAME_TEXT_STYLE = {
  fontFamily: 'Monaco, Courier, monospace',
  fontSize: 12,
  color: '#efefef',
  align: 'center',
};

export const TANK_GAUGES_TEXT_STYLE: GAME_TEXT_STYLE = {
  color: '#dca01c',
  stroke: '#2c3731',
  strokeThickness: 2,
  fontFamily: 'Monaco, Courier, monospace',
  fontSize: 16,
  align: 'center',
};
