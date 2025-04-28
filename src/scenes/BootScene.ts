import Phaser from 'phaser';
import { StickerRegistry } from '../services/StickerRegistry';

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
    this.load.image('panel_wood_corners_metal', 'assets/images/ui-pack-adventure/PNG/Default/panel_brown_dark_corners_b.png');
    this.load.image('panel_metal_corners_metal', 'assets/images/ui-pack-adventure/PNG/Default/panel_grey_bolts_dark.png');
    this.load.image('panel_wood_paper_damaged', 'assets/images/ui-pack-adventure/PNG/Default/panel_brown_damaged.png');
    this.load.image('panel_wood_paper', 'assets/images/ui-pack-adventure/PNG/Default/panel_brown.png');

    this.load.image('resource_construction', 'assets/images/fantasyIconPack/64/HammerT1.png');
    this.load.image('resource_invention', 'assets/images/fantasyIconPack/64/TomeYellow.png');
    this.load.image('resource_power', 'assets/images/fantasyIconPack/64/SwordT1.png');

    // Load configuration files
    this.load.json('stickers', 'config/stickers.json');
    this.load.json('cards', 'config/cards.json'); 
    this.load.json('game', 'config/game.json');
    
    // Load individual sticker images
    this.load.image('sticker_power_1', 'assets/images/stickers/SwordPlus1.png');
    this.load.image('sticker_power_3', 'assets/images/stickers/SwordPlus3.png');
    this.load.image('sticker_construction_1', 'assets/images/stickers/HammerPlus1.png');
    this.load.image('sticker_construction_3', 'assets/images/stickers/HammerPlus1.png');
    this.load.image('sticker_invention_1', 'assets/images/stickers/TomeYellowPlus1.png');
    this.load.image('sticker_invention_3', 'assets/images/stickers/TomeYellowPlus3.png');
  }

  create(): void {
    // Initialize sticker registry with loaded data
    this.initializeStickerRegistry();
    
    // Transition to the level select scene
    this.scene.start('LevelSelectScene');
  }
  
  /**
   * Load sticker configs into the global registry
   */
  private initializeStickerRegistry(): void {
    const stickerData = this.cache.json.get('stickers');
    if (stickerData) {
      const registry = StickerRegistry.getInstance();
      registry.loadStickers(stickerData);
      console.log('Sticker registry initialized with', stickerData.length, 'stickers');
    } else {
      console.error('Failed to load stickers.json');
    }
  }
} 