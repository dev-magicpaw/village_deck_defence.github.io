import Phaser from 'phaser';
import { trackEvent } from '../game';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Add game logo
    const logo = this.add.image(width / 2, height / 3 + 80, 'logo');
    logo.setScale(0.5);
    
    const playButton = this.add['nineslice'](
      width / 2, 
      height / 2 + 280, 
      'button_wood_corners_metal', // texture key
      undefined, // frame
      200, // width
      50, // height
      20, // leftWidth
      20, // rightWidth
      20, // topHeight
      20  // bottomHeight
    );
    
    const playText = this.add.text(width / 2, height / 2 + 280, 'Play', { 
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
      playButton.setScale(1.05);
    });
    
    playButton.on('pointerout', () => {
      playButton.setScale(1.0);
    });
  }
} 