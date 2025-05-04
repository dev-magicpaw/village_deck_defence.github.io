import Phaser from 'phaser';
import { BuildingRegistry } from '../services/BuildingRegistry';
import { RecruitCardRegistry } from '../services/RecruitCardRegistry';
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
    
    // Load ui elements
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
    this.load.image('round_wood_cross', 'assets/images/ui-pack-adventure/PNG/Default/checkbox_brown_cross.png');
    this.load.image('close_button', 'assets/images/ui-pack-adventure/PNG/Default/button_close.png');
    this.load.image('button_wood', 'assets/images/ui-pack-adventure/PNG/Default/button_brown.png');
    
    // Load resource images
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
    this.load.image('recruit_card', 'assets/images/card_backs/recruit_card.png');

    // Load building card images
    this.load.image('building_tavern', 'assets/images/buildings/building_tavern.jpg');
    this.load.image('building_workshop', 'assets/images/buildings/building_workshop.jpg');
    this.load.image('building_wooden_gates', 'assets/images/buildings/building_wooden_gates.jpg');
    this.load.image('building_wooden_wall', 'assets/images/buildings/building_wooden_wall.jpg');
    
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
    this.load.json('recruitCardsConfig', 'config/recruit_cards.json');
    this.load.json('levelsConfig', 'config/levels.json');
  }

  create(): void {
    // Initialize registries with loaded data
    this.initializeStickerRegistry();
    this.initializeBuildingRegistry();
    this.initializeRecruitCardRegistry();
    
    // Get level ID from levels config
    const currentLevelId = this.getCurrentLevelId();
    
    // Transition to the game scene with level ID
    this.scene.start('GameScene', { levelId: currentLevelId });
  }
  
  /**
   * Get the current level ID to load
   * Currently selects the first level from the config
   */
  private getCurrentLevelId(): string {
    const levelsData = this.cache.json.get('levelsConfig');
    if (levelsData && levelsData.levels && levelsData.levels.length > 0) {
      return levelsData.levels[0].id; // Return the first level ID
    }
    // Fallback to default level ID if levels config is not valid
    return 'level_1';
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

  /**
   * Load recruit card configs into the global registry
   */
  private initializeRecruitCardRegistry(): void {
    const recruitCardData = this.cache.json.get('recruitCardsConfig');
    if (recruitCardData) {
      const registry = RecruitCardRegistry.getInstance();
      registry.loadRecruitCards(recruitCardData);
    } else {
      console.error('Failed to load recruit_cards.json');
    }
  }
} 