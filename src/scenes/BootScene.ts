import Phaser from 'phaser';
import { BuildingRegistry } from '../services/BuildingRegistry';
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
    this.load.image('panel_metal_corners_metal', 'assets/images/ui-pack-adventure/PNG/Default/panel_grey_bolts_dark.png');
    this.load.image('panel_metal_corners_metal_nice', 'assets/images/ui-pack-adventure/PNG/Default/panel_grey_bolts_detail_a.png');
    this.load.image('panel_metal_corners_nice', 'assets/images/ui-pack-adventure/PNG/Default/panel_grey_bolts_detail_a.png');
    this.load.image('panel_wood_corners_metal', 'assets/images/ui-pack-adventure/PNG/Default/panel_brown_dark_corners_b.png');
    this.load.image('panel_wood_paper_damaged', 'assets/images/ui-pack-adventure/PNG/Default/panel_brown_damaged.png');
    this.load.image('panel_wood_arrows', 'assets/images/ui-pack-adventure/PNG/Default/panel_brown_arrows_dark.png');
    this.load.image('panel_wood_paper', 'assets/images/ui-pack-adventure/PNG/Default/panel_brown.png');
    this.load.image('round_wood', 'assets/images/ui-pack-adventure/PNG/Default/round_brown_dark.png');
    this.load.image('round_metal', 'assets/images/ui-pack-adventure/PNG/Default/round_grey_dark.png');
    this.load.image('round_wood_paper', 'assets/images/ui-pack-adventure/PNG/Default/round_brown.png');
    this.load.image('round_metal_cross', 'assets/images/ui-pack-adventure/PNG/Default/checkbox_grey_cross.png');
    

    this.load.image('resource_construction', 'assets/images/fantasyIconPack/64/HammerT1.png');
    this.load.image('resource_invention', 'assets/images/fantasyIconPack/64/TomeYellow.png');
    this.load.image('resource_power', 'assets/images/fantasyIconPack/64/SwordT1.png');

    // Load portraits
    this.load.image('dwarf_builder', 'assets/images/portraits/dwarf_builder.png');
    this.load.image('elf_scout', 'assets/images/portraits/elf_scout.png');
    this.load.image('gnome_student', 'assets/images/portraits/gnome_student.png');
    this.load.image('human_villager', 'assets/images/portraits/human_villager.png');

    this.load.image('physical_card_back', 'assets/images/card_backs/Card_shirt_01.png');
    this.load.image('magic_card_back', 'assets/images/card_backs/Card_shirt_04.png');
    
    // Load individual sticker images
    this.load.image('sticker_power_1', 'assets/images/stickers/Sword1.png');
    this.load.image('sticker_power_2', 'assets/images/stickers/Sword2.png');
    this.load.image('sticker_power_3', 'assets/images/stickers/Sword3.png');
    this.load.image('sticker_construction_1', 'assets/images/stickers/Hammer1.png');
    this.load.image('sticker_construction_2', 'assets/images/stickers/Hammer2.png');
    this.load.image('sticker_construction_3', 'assets/images/stickers/Hammer3.png');
    this.load.image('sticker_invention_1', 'assets/images/stickers/TomeYellow1.png');
    this.load.image('sticker_invention_2', 'assets/images/stickers/TomeYellow2.png');
    this.load.image('sticker_invention_3', 'assets/images/stickers/TomeYellow3.png');

    // Load configuration files
    this.load.json('stickers', 'config/stickers.json');
    this.load.json('cardsConfig', 'config/cards.json'); 
    this.load.json('gameConfig', 'config/game.json');
    this.load.json('buildingsConfig', 'config/buildings.json');
  }

  create(): void {
    // Initialize registries with loaded data
    this.initializeStickerRegistry();
    this.initializeBuildingRegistry();
    
    // Transition to the level select scene
    // this.scene.start('LevelSelectScene');
    this.scene.start('GameScene');
  }
  
  /**
   * Load sticker configs into the global registry
   */
  private initializeStickerRegistry(): void {
    const stickerData = this.cache.json.get('stickers');
    if (stickerData) {
      const registry = StickerRegistry.getInstance();
      registry.loadStickers(stickerData);
    } else {
      console.error('Failed to load stickers.json');
    }
  }

  /**
   * Load building configs into the global registry
   */
  private initializeBuildingRegistry(): void {
    const buildingData = this.cache.json.get('buildingsConfig');
    if (buildingData) {
      const registry = BuildingRegistry.getInstance();
      registry.loadBuildings(buildingData);
    } else {
      console.error('Failed to load buildings.json');
    }
  }
} 