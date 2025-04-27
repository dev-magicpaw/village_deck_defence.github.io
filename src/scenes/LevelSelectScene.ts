import Phaser from 'phaser';
import { trackEvent } from '../game';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Add game logo
    const logo = this.add.image(width / 2, height / 3, 'logo');
    logo.setScale(0.5);
    
    // Add play button
    const playButton = this.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x00aa00);
    const playText = this.add.text(width / 2, height / 2 + 50, 'Play Game', { 
      fontSize: '24px', 
      color: '#ffffff' 
    });
    playText.setOrigin(0.5);
    
    // Make button interactive
    playButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Track analytics event
        trackEvent('game_start', { 
          event_category: 'game_flow',
          event_label: 'new_game'
        });
        
        // Transition to the game scene
        this.scene.start('GameScene');
      });
      
    // Button hover effects
    playButton.on('pointerover', () => {
      playButton.fillColor = 0x00ff00;
    });
    
    playButton.on('pointerout', () => {
      playButton.fillColor = 0x00aa00;
    });

    // Add title text
    const titleText = this.add.text(width / 2, height / 5, 'Sticker Village', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    titleText.setOrigin(0.5);
  }
} 