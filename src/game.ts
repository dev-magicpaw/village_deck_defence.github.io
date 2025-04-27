import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, LevelSelectScene, GameScene]
};

// Initialize the game
window.addEventListener('load', () => {
  new Phaser.Game(config);
});

// Analytics event tracking helper
export function trackEvent(eventName: string, eventParams?: object): void {
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventParams);
  } else {
    console.log('Analytics event:', eventName, eventParams);
  }
} 