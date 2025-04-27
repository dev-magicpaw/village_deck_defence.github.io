import Phaser from 'phaser';
import { trackEvent } from '../game';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Add game title
    const titleText = this.add.text(width / 2, 50, 'Sticker Village Game', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    titleText.setOrigin(0.5);
    
    // Add placeholder text for game mechanics
    const placeholderText = this.add.text(width / 2, height / 2, 'Game Scene Placeholder\nDeck and card mechanics will be implemented here', {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    });
    placeholderText.setOrigin(0.5);
    
    // Add back button
    const backButton = this.add.rectangle(100, 50, 150, 40, 0xaa0000);
    const backText = this.add.text(100, 50, 'Back to Menu', {
      fontSize: '16px',
      color: '#ffffff'
    });
    backText.setOrigin(0.5);
    
    // Make button interactive
    backButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Track analytics event
        trackEvent('return_to_menu', {
          event_category: 'navigation',
          event_label: 'from_game'
        });
        
        // Transition back to level select
        this.scene.start('LevelSelectScene');
      });
      
    // Button hover effects
    backButton.on('pointerover', () => {
      backButton.fillColor = 0xff0000;
    });
    
    backButton.on('pointerout', () => {
      backButton.fillColor = 0xaa0000;
    });
    
    // Track scene load for analytics
    trackEvent('scene_enter', {
      event_category: 'navigation',
      event_label: 'game_scene'
    });
  }
} 