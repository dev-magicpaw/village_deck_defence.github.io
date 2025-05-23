import Phaser from 'phaser';
import { BuildingService } from '../services/BuildingService';
import { DeckService } from '../services/DeckService';
import { InvasionService } from '../services/InvasionService';
import { RecruitService } from '../services/RecruitService';
import { ResourceService } from '../services/ResourceService';
import { StickerShopService } from '../services/StickerShopService';
import { TavernService } from '../services/TavernService';
import { BuildingMenuRenderer } from './BuildingMenuRenderer';
import { BuildingsDisplayRenderer, RecruitAgencyRendererFactory } from './BuildingsDisplayRenderer';
import { InfoPanelRenderer } from './InfoPanelRenderer';
import { InvasionRenderer } from './InvasionRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';
import { RecruitAgencyRenderer, RecruitOption } from './RecruitAgencyRenderer';
import { StickerShopRenderer } from './StickerShopRenderer';
import { TavernRenderer } from './TavernRenderer';

export class GameUI {
  static readonly INVASION_PANEL_HEIGHT_PROPORTION: number = 0.08;
  // Keep info area in 1x0.75 proportion (standard card) for a 16:9 screen
  static readonly PLAYER_HAND_PANEL_HEIGHT_PROPORTION: number = 0.35;
  static readonly INFO_PANEL_WIDTH_PROPORTION: number = 0.24;

  private middlePanelX: number;
  private middlePanelY: number;
  private middlePanelWidth: number;
  private middlePanelHeight: number;

  private scene: Phaser.Scene;
  private buildingsDisplayRenderer?: BuildingsDisplayRenderer;
  private buildingService: BuildingService;
  private resourceService: ResourceService;
  private stickerShopService: StickerShopService;
  private playerHandRenderer: PlayerHandRenderer;
  private deckService: DeckService;
  private invasionService: InvasionService;
  private tavernService: TavernService;
  private invasionRenderer!: InvasionRenderer;
  private stickerShopRenderer!: StickerShopRenderer;
  private tavernRenderer!: TavernRenderer;
  private buildingMenuRenderer!: BuildingMenuRenderer;
  private recruitService: RecruitService;
  private infoPanelRenderer!: InfoPanelRenderer;
  
  constructor(
    scene: Phaser.Scene, 
    buildingService: BuildingService, 
    resourceService: ResourceService, 
    stickerShopService: StickerShopService,
    playerHandRenderer: PlayerHandRenderer,
    deckService: DeckService,
    invasionService: InvasionService,
    tavernService: TavernService,
    recruitService: RecruitService
  ) {
    this.scene = scene;
    this.buildingService = buildingService;
    this.resourceService = resourceService;
    this.stickerShopService = stickerShopService;
    this.playerHandRenderer = playerHandRenderer;
    this.deckService = deckService;
    this.invasionService = invasionService;
    this.tavernService = tavernService;
    this.recruitService = recruitService;

    const { width, height } = this.scene.cameras.main;
    const topPanelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    const bottomPanelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const rightPanelWidth = width * GameUI.INFO_PANEL_WIDTH_PROPORTION;

    this.middlePanelX = 0;
    this.middlePanelY = topPanelHeight;
    this.middlePanelWidth = width - rightPanelWidth;
    this.middlePanelHeight = height - topPanelHeight - bottomPanelHeight;
  }
  
  /**
   * Create all UI panels
   */
  public createUI(): void {
    this.createInvasionProgressPanel();
    this.createDisplaySpacePanel();
    // this.createEntityInfoPanel();
  }
  
  /**
   * Create the invasion progress panel at the top of the screen
   */
  private createInvasionProgressPanel(): void {
    const { width, height } = this.scene.cameras.main;
    const panelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    
    // Create the invasion renderer
    this.invasionRenderer = new InvasionRenderer(
      this.scene,
      this.invasionService,
      0,
      0,
      width,
      panelHeight
    );
  }
  
  /**
   * Create a factory method that returns a new RecruitAgencyRenderer
   * @returns A factory function that creates a new RecruitAgencyRenderer
   */
  private createRecruitAgencyRendererFactory(): RecruitAgencyRendererFactory {
    return (recruitOptions: RecruitOption[], buildingName: string): RecruitAgencyRenderer => {
      return new RecruitAgencyRenderer(
        this.scene,
        this.resourceService,
        this.recruitService,
        this.playerHandRenderer,
        this.deckService,
        recruitOptions,
        this.middlePanelX,
        this.middlePanelY,
        this.middlePanelWidth,
        this.middlePanelHeight,
        buildingName
      );
    };
  }
  
  /**
   * Create the main display space panel
   */
  // TODO use here middlePanelX, middlePanelY, middlePanelWidth, middlePanelHeight
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
    
    // Create the sticker shop renderer
    this.stickerShopRenderer = new StickerShopRenderer(
      this.scene,
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      this.resourceService,
      this.stickerShopService,
      this.playerHandRenderer,
      this.deckService
    );
    this.stickerShopRenderer.init();
    
    // Create the tavern renderer
    this.tavernRenderer = new TavernRenderer(
      this.scene,
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      this.playerHandRenderer,
      this.tavernService,
      this.resourceService
    );

    // Create the info panel renderer
    this.infoPanelRenderer = new InfoPanelRenderer(this.scene);
    
    // Create the building menu renderer
    this.buildingMenuRenderer = new BuildingMenuRenderer(
      this.scene,
      this.buildingService,
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      this.playerHandRenderer,
      this.resourceService,
      this.infoPanelRenderer
    );
    
    // Initialize buildings display if building service is available
    if (this.buildingService) {
      this.buildingsDisplayRenderer = new BuildingsDisplayRenderer(
        this.scene,
        this.buildingService,
        panelX,
        panelY,
        this.stickerShopRenderer,
        this.tavernRenderer,
        this.buildingMenuRenderer,
        this.tavernService,
        this.stickerShopService,
        this.recruitService,
        this.resourceService,
        this.playerHandRenderer,
        this.createRecruitAgencyRendererFactory()
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
    
    // Update invasion renderer
    this.invasionRenderer.update();
  }
} 