import Phaser from 'phaser';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';
import { AdventureLevel, TavernService } from '../services/TavernService';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';
import { ResourcePanelRenderer, ResourceType } from './ResourcePanelRenderer';

/**
 * Component that renders the tavern interface and adventure selection
 */
export class TavernRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private tavernService: TavernService;
  private resourceService: ResourceService | null = null;
  private deckService: DeckService<any> | null = null;
  private playerHandRenderer: PlayerHandRenderer;
  private visible: boolean = false;
  
  private panelX: number;
  private panelY: number;
  private panelWidth: number;
  private panelHeight: number;
  
  // Adventure level card properties
  private levelCardWidth: number = CARD_WIDTH;
  private levelCardHeight: number = CARD_HEIGHT;
  private levelCardSpacing: number = 20;
  private levelsPerRow: number = 4;
  
  // Currently selected adventure level
  private selectedLevel: AdventureLevel | null = null;
  private levelCards: Map<AdventureLevel, Phaser.GameObjects.Container> = new Map();
  
  // Resource panel
  private resourcePanelRenderer: ResourcePanelRenderer | null = null;
  
  // Keyboard controls
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  
  /**
   * Create a new TavernRenderer
   */
  constructor(
    scene: Phaser.Scene,
    panelX: number,
    panelY: number,
    width: number,
    height: number,
    playerHandRenderer: PlayerHandRenderer,
    resourceService?: ResourceService,
    deckService?: DeckService<any>
  ) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = width;
    this.panelHeight = height;
    this.playerHandRenderer = playerHandRenderer;
    this.resourceService = resourceService || null;
    this.deckService = deckService || null;
    this.tavernService = TavernService.getInstance();
    
    // Create container for all UI elements
    this.container = this.scene.add.container();
    this.container.setVisible(false);
    
    // Set a high depth to ensure it renders on top of other UI elements
    this.container.setDepth(1000);
  }
  
  /**
   * Initialize the tavern renderer
   */
  public init(): void {
    // Pass resource service to tavern service if available
    if (this.resourceService) {
      this.tavernService.setResourceService(this.resourceService);
    }
    
    // Register keyboard controls
    if (this.scene.input && this.scene.input.keyboard) {
      this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', this.handleEscKey, this);
    }
    
    // Create background panel
    this.createBackgroundPanel();
    
    // Create resource panel
    this.createResourcePanel();
    
    // Render adventure level cards
    this.renderAdventureLevelCards();
  }
  
  /**
   * Create the background panel for the tavern
   */
  private createBackgroundPanel(): void {
    // Create panel background using nineslice
    const background = this.scene.add['nineslice'](
      this.panelX,
      this.panelY,
      'panel_wood_paper',
      undefined,
      this.panelWidth,
      this.panelHeight,
      20, 20, 20, 20
    );
    background.setOrigin(0,0);
    
    // Add title
    const title = this.scene.add.text(
      this.panelX + this.panelWidth / 2,
      this.panelY + 30,
      'Tavern',
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#000000',
        align: 'center'
      }
    );
    title.setOrigin(0.5, 0.5);
    
    // Add close button
    const closeButton = this.scene.add.image(
      this.panelX + this.panelWidth - 30,
      this.panelY + 30,
      'round_metal_cross'
    );
    closeButton.setScale(1.2);

    closeButton.setDisplaySize(40, 40);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => {
      this.hide();
    });
    // Add hover effects for close button
    closeButton.on('pointerover', () => {
      closeButton.setScale(1.4);
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setScale(1.2);
    });
    
    // Add all elements to container
    this.container.add([background, title, closeButton]);
  }
  
  /**
   * Create the resource panel that shows power and provides action buttons
   */
  private createResourcePanel(): void {
    // Initialize acquiredPower value
    const acquiredPower = this.resourceService ? this.resourceService.getPower() : 0;
    
    // Create the resource panel renderer with the POWER resource type
    this.resourcePanelRenderer = new ResourcePanelRenderer(
      this.scene,
      this.playerHandRenderer,
      ResourceType.POWER,
      acquiredPower,
      'Proceed',
      this.proceedWithAdventure.bind(this)
    );
    
    this.scene.events.on('resourcePanel-playCards', (data: any) => { this.handleResourcePanelPlayCards(data); });
    this.container.add(this.resourcePanelRenderer.getContainer());
  }
  
  /**
   * Update the proceed button state based on current selection and resources
   */
  private updateProceedButtonState(): void {
    if (!this.selectedLevel || !this.resourcePanelRenderer) {
      this.resourcePanelRenderer?.setTarget(false);
      return;
    }
    
    // Set target for the resource panel
    this.resourcePanelRenderer.setTarget(true);
  }
  
  /**
   * Handle resource panel's play cards event
   */
  // TODO this is probably not needed.
  private handleResourcePanelPlayCards(data: { type: ResourceType, value: number, cardIds: string[] }): void {
    if (data.type === ResourceType.POWER && this.resourceService) {
      this.resourceService.addPower(data.value);
    }
  }
  
  /**
   * Update the resource display with current values
   */
  // TODO this is probably not needed.
  private updateResourceDisplay(): void {
    if (!this.resourceService || !this.resourcePanelRenderer) return;
    
    const acquiredPower = this.resourceService.getPower();
    this.resourcePanelRenderer.setAcquiredResourceValue(acquiredPower);
    
    // Update proceed button state based on level selection and resources
    this.updateProceedButtonState();
  }
  
  /**
   * Handle Proceed button click
   */
  private proceedWithAdventure(): void {
    if (!this.selectedLevel) return;

    const option = this.tavernService.getAdventureOption(this.selectedLevel);
    if (!option) throw new Error('No adventure option found');

    this.deselectLevel();
    const success = this.tavernService.attemptAdventure(option);
    this.tavernService.processAdventureResult(option, success);
  }
  
  /**
   * Show the tavern interface
   */
  public show(): void {
    this.visible = true;
    this.container.setVisible(true);
    
    // Update tavern open state in service
    this.tavernService.setTavernOpen(true);
    
    // Refresh the display
    this.renderAdventureLevelCards();
    this.updateResourceDisplay();
    
    // Show the resource panel
    // TODO this is probably not needed.
    this.resourcePanelRenderer?.show();
  }
  
  /**
   * Hide the tavern interface
   */
  public hide(): void {
    this.visible = false;
    this.container.setVisible(false);
    
    // Update tavern open state in service
    this.tavernService.setTavernOpen(false);
    
    // Hide the resource panel
    // TODO this is probably not needed.
    this.resourcePanelRenderer?.hide();
  }
  
  /**
   * Toggle tavern visibility
   */
  public toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Handle ESC key press
   */
  private handleEscKey(): void {
    if (this.visible) {
      this.hide();
    }
  }

  /**
   * Update the tavern renderer (called every frame)
   */
  public update(): void {
    // Only update if visible
    if (!this.visible) {
      return;
    }
    
    // Update resource display
    this.updateResourceDisplay();
  }

  /**
   * Clean up resources when destroying this object
   */
  public destroy(): void {
    // Remove keyboard controls
    if (this.escKey) {
      this.escKey.removeListener('down', this.handleEscKey, this);
      this.escKey.destroy();
      this.escKey = null;
    }
    
    // Remove event listeners
    this.scene.events.off('resourcePanel-playCards', this.handleResourcePanelPlayCards, this);
    
    // Destroy the resource panel
    if (this.resourcePanelRenderer) {
      this.resourcePanelRenderer.destroy();
      this.resourcePanelRenderer = null; // TODO this is probably not needed.
    }
    
    this.container.destroy();
  }
  
  /**
   * Render the adventure level cards
   */
  private renderAdventureLevelCards(): void {
    // Clear existing level cards
    this.levelCards.forEach(card => card.destroy());
    this.levelCards.clear();
    
    // Get available adventure levels
    const levels = this.tavernService.getAvailableAdventureLevels();
    
    // Render each level card
    levels.forEach((level, index) => {
      const row = Math.floor(index / this.levelsPerRow);
      const col = index % this.levelsPerRow;
      
      const cardX = (col + 0.5) * (this.levelCardWidth + this.levelCardSpacing) + 40;
      const cardY = (row + 0.5) * (this.levelCardHeight + this.levelCardSpacing) + 80;
      
      const card = this.createLevelCard(level, cardX, cardY);
      this.levelCards.set(level, card);
      this.container.add(card);
    });
  }

  /**
   * Deselect the currently selected level
   */
  private deselectLevel(): void {
    // If there was a selected level, hide its highlight
    if (this.selectedLevel) {
      const card = this.levelCards.get(this.selectedLevel);
      if (card) {
        const highlight = card.getData('highlight') as Phaser.GameObjects.Image;
        highlight.setVisible(false);
      }
    }
    
    // Deselect the level
    this.selectedLevel = null;
    
    // Update the resource panel target
    this.resourcePanelRenderer?.setTarget(false);
  }
  
  /**
   * Create a visual representation of an adventure level card
   */
  private createLevelCard(
    level: AdventureLevel,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Card background using nineslice
    const background = this.scene.add['nineslice'](
      0, 0,
      'panel_wood_corners_metal',
      undefined,
      this.levelCardWidth, 
      this.levelCardHeight,
      10, 10, 10, 10
    );
    background.setOrigin(0.5, 0.5);
    
    // Set background interactive
    background.setInteractive({ useHandCursor: true });
    background.on('pointerdown', () => {
      this.onLevelCardClicked(level);
    });
    
    // Determine level image and name based on adventure level
    const imageName = 'recruit_card';
    
    // Level image
    // TODO: make it the size of the card
    const image = this.scene.add.image(0, -30, imageName);
    image.setDisplaySize(this.levelCardWidth - 20, 100);
 
    
    // Selection highlight (initially invisible)
    const highlight = this.scene.add.image(0, 0, 'panel_metal_glow');
    highlight.setDisplaySize(this.levelCardWidth + 10, this.levelCardHeight + 10);
    highlight.setVisible(false);
    highlight.setTint(0x00ff00);
    highlight.setAlpha(0.3);
    
    // Add all elements to the container
    container.add([highlight, background, image]);
    
    // Store highlight for later reference
    container.setData('highlight', highlight);
    
    // If this is the currently selected level, show the highlight
    if (this.selectedLevel === level) {
      highlight.setVisible(true);
    }
    
    return container;
  }
  
  /**
   * Handle level card click
   */
  private onLevelCardClicked(level: AdventureLevel): void {
    // If this level is already selected, deselect it
    if (this.selectedLevel === level) {
      this.deselectLevel();
    } else {
      // Deselect previous level if any
      if (this.selectedLevel !== null) {
        const previousCard = this.levelCards.get(this.selectedLevel);
        if (previousCard) {
          const highlight = previousCard.getData('highlight') as Phaser.GameObjects.Image;
          highlight.setVisible(false);
        }
      }
      
      // Select new level
      this.selectedLevel = level;
      
      // Show highlight on the new card
      const card = this.levelCards.get(level);
      if (card) {
        const highlight = card.getData('highlight') as Phaser.GameObjects.Image;
        highlight.setVisible(true);
      }
    }
    
    // Update proceed button state
    this.updateProceedButtonState();
  }
} 