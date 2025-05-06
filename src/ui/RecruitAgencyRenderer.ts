import Phaser from 'phaser';
import { ResourceType } from '../entities/Types';
import { ResourceService } from '../services/ResourceService';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';
import { CostRenderer } from './CostRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';
import { ResourcePanelRenderer } from './ResourcePanelRenderer';
import { SimpleCardRenderer } from './SimpleCardRenderer';

/**
 * Events emitted by the RecruitAgencyRenderer
 */
export enum RecruitAgencyRendererEvents {
  STATE_CHANGED = 'recruit_agency_state_changed'
}

/**
 * Interface for recruit options that will be displayed in the UI
 */
export interface RecruitOption {
  id: string;
  image: string;
  cost: number;
  name: string;
}

/**
 * Component for rendering recruitment UI for buildings that allow recruitment
 */
export class RecruitAgencyRenderer extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private resourceService: ResourceService;
  private playerHandRenderer: PlayerHandRenderer;
  private visible: boolean = false;
  
  // Panel dimensions and position
  private panelX: number;
  private panelY: number;
  private panelWidth: number;
  private panelHeight: number;
  private panelTitle: string;
  
  // Background elements
  private background!: Phaser.GameObjects.NineSlice;
  private title!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Image;
  private inputBlocker!: Phaser.GameObjects.Rectangle;
  
  // Recruit options
  private recruitOptions: RecruitOption[];
  private recruitCards: SimpleCardRenderer[] = [];
  private recruitCostRenderers: CostRenderer[] = [];
  
  // Card properties
  private cardWidth: number = CARD_WIDTH;
  private cardHeight: number = CARD_HEIGHT;
  private cardSpacing: number = 20;
  private cardsPerRow: number = 4;
  
  // Resource panel
  private resourcePanelRenderer!: ResourcePanelRenderer;
  
  // Keyboard controls
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  
  /**
   * Create a new RecruitAgencyRenderer
   * @param scene The Phaser scene to render in
   * @param resourceService Service for managing resources
   * @param playerHandRenderer Component for handling player hand cards
   * @param recruitOptions List of available recruit options (pre-filtered)
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel
   * @param panelHeight Height of the panel
   * @param panelTitle The title to display at the top of the panel
   */
  constructor(
    scene: Phaser.Scene,
    resourceService: ResourceService,
    playerHandRenderer: PlayerHandRenderer,
    recruitOptions: RecruitOption[],
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    panelTitle: string
  ) {
    super();
    this.scene = scene;
    this.resourceService = resourceService;
    this.playerHandRenderer = playerHandRenderer;
    this.recruitOptions = recruitOptions;
    
    // Store panel dimensions
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelTitle = panelTitle;
    
    // Create container for all UI elements
    this.container = this.scene.add.container(0, 0);
    this.container.setVisible(false);
    
    // Create UI elements
    // TODO create element that will intercept clicks on the background
    this.createInputBlocker();
    this.createBackground();
    this.createTitle();
    this.createResourcePanel();
    this.createCloseButton();
    this.createEscapeKeyHandler();
    
    // Render recruit options
    this.renderRecruitOptions();
  }
  
  /**
   * Create the background panel
   */

  private createInputBlocker(): void {
    this.inputBlocker = this.scene.add.rectangle(
      this.panelX, 
      this.panelY, 
      this.panelWidth, 
      this.panelHeight, 
      0x000000, 
      0.01
    );
    this.inputBlocker.setOrigin(0, 0);
    this.inputBlocker.setInteractive();
    
    this.container.add(this.inputBlocker);
  }
  
  private createBackground(): void {
    this.background = this.scene.add['nineslice'](
      this.panelX, 
      this.panelY,
      'panel_metal_corners_metal_nice', 
      undefined,
      this.panelWidth, 
      this.panelHeight,
      20, 20, 20, 20
    );
    this.background.setOrigin(0, 0);
    this.background.setTint(0x666666);

    
    // Add to container
    this.container.add(this.background);
  }
  
  /**
   * Create the panel title
   */
  private createTitle(): void {
    const titleText = this.scene.add.text(
      this.panelX + this.panelWidth / 2,
      this.panelY + 30,
      this.panelTitle,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    titleText.setOrigin(0.5, 0.5);
    
    // Add to container
    this.container.add(titleText);
  }
  
  /**
   * Create the resource panel
   */
  private createResourcePanel(): void {
    // Create resource panel for Power
    this.resourcePanelRenderer = new ResourcePanelRenderer(
      this.scene,
      this.playerHandRenderer,
      ResourceType.Power,
      'Recruit',
      () => this.onRecruitButtonClicked(),
      this.resourceService
    );
    
    // Get the container - ResourcePanelRenderer always creates a container in its constructor
    // so we can safely add it to our container even though TypeScript doesn't know this
    const resourcePanelContainer = this.resourcePanelRenderer.getContainer();
    // @ts-ignore - We know this container is not null
    this.container.add(resourcePanelContainer);
    
    // Position the panel - using x/y properties to avoid setPosition method
    // @ts-ignore - We know these properties exist
    resourcePanelContainer.x = this.panelX + this.panelWidth - 20;
    // @ts-ignore - We know these properties exist
    resourcePanelContainer.y = this.panelY + 60;
  }
  
  /**
   * Create the close button
   */
  private createCloseButton(): void {
    this.closeButton = this.scene.add.image(
      this.panelX + this.panelWidth - 20,
      this.panelY + 20,
      'round_metal_cross'
    );
    this.closeButton.setOrigin(1, 0);
    this.closeButton.setScale(0.8);
    
    // Add interactivity
    this.closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.hide())
      .on('pointerover', () => this.closeButton.setScale(0.9))
      .on('pointerout', () => this.closeButton.setScale(0.8));
    
    // Add to container
    this.container.add(this.closeButton);
  }
  
  /**
   * Create the escape key handler
   */
  private createEscapeKeyHandler(): void {
      // Setup Escape key to close menu
    if (this.scene.input && this.scene.input.keyboard) {
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', this.handleEscapeKey, this);
      }

  }

  private handleEscapeKey(): void {
    if (this.visible) {
      this.hide();
    }
  }
  
  /**
   * Render all available recruit options
   */
  private renderRecruitOptions(): void {
    // Clear any existing cards
    this.recruitCards.forEach(card => card.destroy());
    this.recruitCards = [];
    this.recruitCostRenderers = [];
    
    // Calculate card positions
    const startY = this.panelY + 100;
    const startX = this.panelX + 50;
    
    // Create a card for each recruit option
    this.recruitOptions.forEach((option, index) => {
      const row = Math.floor(index / this.cardsPerRow);
      const col = index % this.cardsPerRow;
      
      const x = startX + col * (this.cardWidth + this.cardSpacing);
      const y = startY + row * (this.cardHeight + this.cardSpacing);
      
      this.renderRecruitOption(option, x, y, index);
    });
  }
  
  /**
   * Render a single recruit option
   * @param option The recruit option to render
   * @param x The x position
   * @param y The y position
   * @param index The index in the options array
   */
  private renderRecruitOption(
    option: RecruitOption, 
    x: number, 
    y: number, 
    index: number
  ): void {
    // Calculate if the player can afford this recruit
    const canAfford = this.resourceService.getPower() >= option.cost;
    
    // Create callback for recruitment
    const onRecruitSelected = canAfford 
      ? () => this.selectRecruitOption(option) 
      : undefined;
    
    // Create card
    const card = new SimpleCardRenderer(
      this.scene,
      x + this.cardWidth / 2,
      y + this.cardHeight / 2,
      'panel_wood_paper',
      option.image,
      1,
      canAfford,
      onRecruitSelected
    );
    
    // Add recruit name text
    const nameText = this.scene.add.text(
      0,
      this.cardHeight / 2 - 30,
      option.name,
      {
        fontSize: '16px',
        color: '#000000',
        fontStyle: 'bold'
      }
    );
    nameText.setOrigin(0.5, 1);
    card.getContainer().add(nameText);
    
    // Add cost renderer
    const costRenderer = new CostRenderer(
      this.scene,
      option.cost,
      0,
      this.cardHeight / 2 + 20,
      ResourceType.Power
    );
    costRenderer.setAffordable(canAfford);
    card.getContainer().add(costRenderer.getContainer());
    
    // Add to container and tracking arrays
    this.container.add(card.getContainer());
    this.recruitCards.push(card);
    this.recruitCostRenderers.push(costRenderer);
  }
  
  /**
   * Handle recruit button clicked
   */
  private onRecruitButtonClicked(): void {
    // This would use the selected recruit option and Power resource
    // to recruit a unit
    console.log('Recruit button clicked');
  }
  
  /**
   * Select a recruit option
   * @param option The selected recruit option
   */
  private selectRecruitOption(option: RecruitOption): void {
    // Set target in resource panel
    this.resourcePanelRenderer.setTarget(true, option.cost);
    
    console.log(`Selected recruit option: ${option.name}`);
  }
  
  /**
   * Show the recruit agency UI
   */
  public show(): void {
    this.visible = true;
    this.container.setVisible(true);
    
    // Emit state change event
    this.emit(RecruitAgencyRendererEvents.STATE_CHANGED, true);
    
    // Update cost renderers based on current resources
    this.updateCostRenderers();
  }
  
  /**
   * Hide the recruit agency UI
   */
  public hide(): void {
    this.visible = false;
    this.container.setVisible(false);
    
    // Emit state change event
    this.emit(RecruitAgencyRendererEvents.STATE_CHANGED, false);
    
    // Clear any selected target
    this.resourcePanelRenderer.setTarget(false);
  }
  
  /**
   * Update the cost renderers based on player's current resources
   */
  private updateCostRenderers(): void {
    const availablePower = this.resourceService.getPower();
    
    this.recruitOptions.forEach((option, index) => {
      const canAfford = availablePower >= option.cost;
      this.recruitCostRenderers[index].setAffordable(canAfford);
    });
  }
  
  /**
   * Get whether the UI is visible
   */
  public isVisible(): boolean {
    return this.visible;
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clean up cards
    this.recruitCards.forEach(card => card.destroy());
    this.recruitCards = [];
    this.recruitCostRenderers = [];
    
    // Clean up resource panel
    if (this.resourcePanelRenderer) {
      this.resourcePanelRenderer.destroy();
    }
    
    // Clean up key bindings
    if (this.escKey) {
      this.escKey.removeAllListeners();
      this.escKey = null;
    }
    
    // Remove all listeners from this emitter
    this.removeAllListeners();
    
    // Clean up container and ensure all child objects are properly destroyed
    if (this.container && this.container.scene) {
      // Make sure the container is no longer visible before destroying
      this.container.setVisible(false);
      this.container.destroy();
    }
    
    this.visible = false;
  }
} 