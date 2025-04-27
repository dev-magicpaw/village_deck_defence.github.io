import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Set up loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Progress event callbacks
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    // Load essential assets
    this.load.image('logo', 'assets/images/logo.png');
    this.load.image('button_wood_corners_metal', 'assets/images/ui-pack-adventure/PNG/Default/panel_brown_dark_corners_b.png');
    this.load.image('resource_construction', 'assets/images/fantasyIconPack/64/HammerT1.png');
    this.load.image('resource_invention', 'assets/images/fantasyIconPack/64/Scroll.png');
    this.load.image('resource_power', 'assets/images/fantasyIconPack/64/SwordT1.png');
  }

  create(): void {
    // Transition to the level select scene
    this.scene.start('LevelSelectScene');
  }
} 