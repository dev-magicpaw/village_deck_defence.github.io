import Phaser from 'phaser';
import { BuildingService } from '../services/BuildingService';
import { DeckService } from '../services/DeckService';
import { InvasionService } from '../services/InvasionService';
import { ResourceService } from '../services/ResourceService';
import { StickerShopService } from '../services/StickerShopService';
import { BuildingsDisplayRenderer } from './BuildingsDisplayRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';

export class GameUI {
  static readonly INVASION_PANEL_HEIGHT_PROPORTION: number = 0.08;
  static readonly PLAYER_HAND_PANEL_HEIGHT_PROPORTION: number = 0.35;
  static readonly INFO_PANEL_WIDTH_PROPORTION: number = 0.3;

  private scene: Phaser.Scene;
  private buildingsDisplayRenderer?: BuildingsDisplayRenderer;
  private buildingService: BuildingService;
  private resourceService: ResourceService;
  private stickerShopService: StickerShopService;
  private playerHandRenderer: PlayerHandRenderer;
  private deckService: DeckService;
  private invasionService: InvasionService;
  private invasionTitle!: Phaser.GameObjects.Text;
  private lastKnownDay: number = 1;
  
  constructor(
    scene: Phaser.Scene, 
    buildingService: BuildingService, 
    resourceService: ResourceService, 
    stickerShopService: StickerShopService,
    playerHandRenderer: PlayerHandRenderer,
    deckService: DeckService,
    invasionService: InvasionService
  ) {
    this.scene = scene;
    this.buildingService = buildingService;
    this.resourceService = resourceService;
    this.stickerShopService = stickerShopService;
    this.playerHandRenderer = playerHandRenderer;
    this.deckService = deckService;
    this.invasionService = invasionService;
  }
  
  /**
   * Create all UI panels
   */
  public createUI(): void {
    this.createInvasionProgressPanel();
    this.createDisplaySpacePanel();
    this.createEntityInfoPanel();
    // Player hand panel is now handled by PlayerHandRenderer
  }
  
  /**
   * Create the invasion progress panel at the top of the screen
   */
  // TODO: move invasion panel and title to a separate class InvasionRenderer
  private createInvasionProgressPanel(): void {
    const { width, height } = this.scene.cameras.main;
    const panelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    
    // Create the panel background using 9-slice
    const invasionPanel = this.scene.add['nineslice'](
      0,
      0,
      'panel_metal_corners_metal',
      undefined,
      width,
      panelHeight,
      20,
      20,
      20,
      20
    );
    
    // Set the origin to the top-left corner
    invasionPanel.setOrigin(0, 0);
    
    // Add the panel title with current day
    this.lastKnownDay = this.invasionService.getCurrentDay();
    this.invasionTitle = this.scene.add.text(width / 2, panelHeight / 2, `Invasion progress track: day ${this.lastKnownDay}`, {
      fontSize: '24px',
      color: '#ffffff'
    });
    this.invasionTitle.setOrigin(0.5, 0.5);
  }
  
  /**
   * Create the main display space panel
   */
  private createDisplaySpacePanel(): void {
    const { width, height } = this.scene.cameras.main;
    const topPanelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    const bottomPanelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const rightPanelWidth = width * GameUI.INFO_PANEL_WIDTH_PROPORTION;
    
    const panelX = 0;
    const panelY = topPanelHeight;
    const panelWidth = width - rightPanelWidth;
    const panelHeight = height - topPanelHeight - bottomPanelHeight;
    
    // Create the panel background using 9-slice
    const displayPanel = this.scene.add['nineslice'](
      panelX,
      panelY,
      'panel_metal_corners_metal',
      undefined,
      panelWidth,
      panelHeight,
      20,
      20,
      20,
      20
    );
    
    // Set the origin to the top-left corner
    displayPanel.setOrigin(0, 0);
    
    // Initialize buildings display if building service is available
    if (this.buildingService) {
      this.buildingsDisplayRenderer = new BuildingsDisplayRenderer(
        this.scene,
        this.buildingService,
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        this.resourceService,
        this.stickerShopService,
        this.playerHandRenderer,
        this.deckService
      );
      
      this.buildingsDisplayRenderer.init();
      this.buildingsDisplayRenderer.render();
    } else {
      throw new Error("No building service");
    }
  }
  
  /**
   * Create the entity info panel on the right
   */
  private createEntityInfoPanel(): void {
    const { width, height } = this.scene.cameras.main;
    const topPanelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    const bottomPanelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const rightPanelWidth = width * GameUI.INFO_PANEL_WIDTH_PROPORTION;
    
    const panelX = width - rightPanelWidth;
    const panelY = topPanelHeight;
    const panelHeight = height - topPanelHeight - bottomPanelHeight;
    
    // Create the panel background using 9-slice
    const infoPanel = this.scene.add['nineslice'](
      panelX,
      panelY,
      'panel_metal_corners_metal',
      undefined,
      rightPanelWidth,
      panelHeight,
      20,
      20,
      20,
      20
    );
    
    // Set the origin to the top-left corner
    infoPanel.setOrigin(0, 0);
   
    // Add the entity info panel text
    const infoText = this.scene.add.text(panelX + rightPanelWidth / 2, panelY + panelHeight / 2, 
      'Selected entity info panel. If some entity is selected (like a card in hand or a building on the map), it\'s details are displayed here',
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: rightPanelWidth - 40 }
      }
    );
    infoText.setOrigin(0.5, 0.5);
  }
  
  /**
   * Get hand panel dimensions
   * @returns Object with panel dimensions and position
   */
  public getHandPanelDimensions(): { x: number, y: number, width: number, height: number } {
    const { width, height } = this.scene.cameras.main;
    const bottomPanelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    
    return {
      x: 0,
      y: height - bottomPanelHeight,
      width: width,
      height: bottomPanelHeight
    };
  }
  
  /**
   * Get display panel dimensions
   * @returns Object with panel dimensions and position
   */
  public getDisplayPanelDimensions(): { x: number, y: number, width: number, height: number } {
    const { width, height } = this.scene.cameras.main;
    const topPanelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    const bottomPanelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const rightPanelWidth = width * GameUI.INFO_PANEL_WIDTH_PROPORTION;
    
    return {
      x: 0,
      y: topPanelHeight,
      width: width - rightPanelWidth,
      height: height - topPanelHeight - bottomPanelHeight
    };
  }
  
  /**
   * Update the UI components
   */
  public update(): void {
    // Update buildings display if it exists
    if (this.buildingsDisplayRenderer) {
      this.buildingsDisplayRenderer.update();
    }
    
    // Update invasion title if day has changed
    const currentDay = this.invasionService.getCurrentDay();
    if (currentDay !== this.lastKnownDay) {
      this.lastKnownDay = currentDay;
      this.invasionTitle.setText(`Invasion progress track: day ${currentDay}`);
    }
  }
} 