import Phaser from 'phaser';
import { trackEvent } from '../game';
import { GameUI } from '../ui/GameUI';

export class GameScene extends Phaser.Scene {
  private gameUI!: GameUI;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize the UI manager
    this.gameUI = new GameUI(this);
    
    // Create all UI panels
    this.gameUI.createUI();
    
    // Track scene load for analytics
    trackEvent('scene_enter', {
      event_category: 'navigation',
      event_label: 'game_scene'
    });
  }
} 