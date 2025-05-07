import Phaser from 'phaser';
import { ResourceType } from '../entities/Types';
import { CardRegistry } from '../services/CardRegistry';
import { DeckService } from '../services/DeckService';
import { RecruitService } from '../services/RecruitService';
import { ResourceService, ResourceServiceEvents } from '../services/ResourceService';
import { CARD_HEIGHT, CARD_SPACING_X, CARD_WIDTH, CardRenderer } from './CardRenderer';
import { CostRenderer } from './CostRenderer';
import { PlayerHandRenderer, PlayerHandRendererEvents } from './PlayerHandRenderer';
import { ResourcePanelRenderer } from './ResourcePanelRenderer';

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
  private recruitService: RecruitService;
  private playerHandRenderer: PlayerHandRenderer;
  private cardRegistry: CardRegistry;
  private deckService: DeckService;
  private visible: boolean = false;
  private selectedOption: RecruitOption | null = null;
  private selectedOptionRenderer: CardRenderer | null = null;
  
  // Panel dimensions and position
  private panelX: number;
  private panelY: number;
  private panelWidth: number;
  private panelHeight: number;
  private panelTitle: string;
  
  // Background elements
  private background!: Phaser.GameObjects.NineSlice;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Image;
  private inputBlocker!: Phaser.GameObjects.Rectangle;
  
  // Recruit options
  private recruitOptions: RecruitOption[];
  private recruitCards: CardRenderer[] = [];
  private recruitCostRenderers: CostRenderer[] = [];
  
  // Card properties
  private cardWidth: number = CARD_WIDTH;
  private cardHeight: number = CARD_HEIGHT;
  private cardSpacing: number = CARD_SPACING_X;
  private cardsPerRow: number = 4;
  
  // Resource panel
  private resourcePanelRenderer!: ResourcePanelRenderer;
  
  // Keyboard controls
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  
  /**
   * Create a new RecruitAgencyRenderer
   * @param scene The Phaser scene to render in
   * @param resourceService Service for managing resources
   * @param recruitService Service for recruiting cards
   * @param playerHandRenderer Component for handling player hand cards
   * @param deckService Service for managing the deck
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
    recruitService: RecruitService,
    playerHandRenderer: PlayerHandRenderer,
    deckService: DeckService,
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
    this.recruitService = recruitService;
    this.playerHandRenderer = playerHandRenderer;
    this.recruitOptions = recruitOptions;
    this.cardRegistry = CardRegistry.getInstance();
    this.deckService = deckService;
    
    // Store panel dimensions
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelTitle = panelTitle;
    
    // Create container for all UI elements
    this.container = this.scene.add.container(0, 0);
    this.container.setVisible(false);
    
    this.createInputBlocker(); // keep this first so other elements are on top for input system
    this.createBackground();
    this.createTitle();
    this.createResourcePanel();
    this.createCloseButton();
    this.renderRecruitOptions();

    // Subscribe to player hand card selection changes
    this.playerHandRenderer.on(PlayerHandRendererEvents.SELECTION_CHANGED, this.onCardSelectionChanged, this);
    // Subscribe to resource changes to update cost renderers
    this.resourceService.on(ResourceServiceEvents.RESOURCE_CHANGED, this.onResourceChanged, this);
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
    this.title = this.scene.add.text(
      this.panelX + this.panelWidth / 2,
      this.panelY + 30,
      this.panelTitle,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.title.setOrigin(0.5, 0.5);
    
    // Add subtitle for deck size
    this.subtitle = this.scene.add.text(
      this.panelX + this.panelWidth / 2,
      this.panelY + 60,
      '',
      {
        fontSize: '16px',
        color: '#ffffff'
      }
    );
    this.subtitle.setOrigin(0.5, 0.5);
    
    // Add to container
    this.container.add(this.title);
    this.container.add(this.subtitle);
  }
  
  /**
   * Create the resource panel
   */
  private createResourcePanel(): void {
    this.resourcePanelRenderer = new ResourcePanelRenderer(
      this.scene,
      this.playerHandRenderer,
      ResourceType.Power,
      'Recruit',
      () => this.onRecruitButtonClicked(),
      this.resourceService
    );    
    
    // Hide initially, will be shown when the recruit agency is shown
    this.resourcePanelRenderer.hide();
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
    // TODO use some constants for consistency with building menu
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
    
    // Create a Card object from the RecruitOption using the card registry
    const card = this.cardRegistry.createCardInstance(option.id);
    if (!card) {
      throw new Error(`Failed to create card instance for ${option.id}`);
    }
    
    // Create card renderer
    const cardRenderer = new CardRenderer(
      this.scene,
      card,
      x + this.cardWidth / 2,
      y + this.cardHeight / 2,
      index,
      () => this.onRecruitSelected(option, cardRenderer),
      1, // default scale
      true, // change scale on hover
      false, // don't change sticker scale on hover
      false, // not selectable sticker
      undefined, // no sticker click callback
      false // not in discard pile
    );
    
    // Add cost renderer
    const costRenderer = new CostRenderer(
      this.scene,
      option.cost,
      0,
      this.cardHeight / 2 + 30,
      ResourceType.Power
    );
    costRenderer.setAffordable(canAfford);
    cardRenderer.getContainer().add(costRenderer.getContainer());
    
    // Add to container and tracking arrays
    this.container.add(cardRenderer.getContainer());
    this.recruitCards.push(cardRenderer);
    this.recruitCostRenderers.push(costRenderer);
  }
  
  /**
   * Handle recruit button clicked
   */
  private onRecruitButtonClicked(): void {
    if (!this.selectedOption) return;
    
    // Recruit the card
    const card = this.recruitService.recruit(this.selectedOption.id);
    
    // Reset selection and update UI
    this.selectedOption = null;
    this.selectedOptionRenderer = null;
    this.resourcePanelRenderer.setTarget(false);
    this.updateCostRenderers();
    this.updateSubtitleText();
  }
  
  /**
   * Select a recruit option
   * @param option The selected recruit option
   * @param renderer The card renderer that was clicked
   */
  private onRecruitSelected(option: RecruitOption, renderer: CardRenderer): void {
    // Deselect the option
    if (this.selectedOption && this.selectedOption.id === option.id) {
      this.selectedOption = null;
      this.selectedOptionRenderer?.setSelected(false);
      this.selectedOptionRenderer = null;
      this.resourcePanelRenderer.setTarget(false);
      return;
    } 
    
    // Deselect previously selected card if any
    if (this.selectedOptionRenderer) {
      this.selectedOptionRenderer.setSelected(false);
    }

    this.selectedOption = option;
    this.selectedOptionRenderer = renderer;
    this.resourcePanelRenderer.setTarget(true, option.cost);
    renderer.setSelected(true);
  }
  
  /**
   * Show the recruit agency UI
   */
  public show(): void {
    this.visible = true;
    this.container.setVisible(true);
    
    // Show the resource panel
    this.resourcePanelRenderer.show();
    
    // Update deck size text
    this.updateSubtitleText();
    
    // Bring to top to ensure it's above other elements
    this.container.setDepth(1000);
    
    // Setup Esc key to close the shop
    if (this.scene.input.keyboard) {
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        if (this.escKey) {
        // Use a named method instead of an inline arrow function for better cleanup
        this.escKey.on('down', this.handleEscapeKey, this);
        }
    }

    // Emit state change event
    this.emit(RecruitAgencyRendererEvents.STATE_CHANGED, true);
    
    // Notify the recruit service that the menu is open
    this.recruitService.openMenu();

    // Update target construction cost to none initially
    this.resourcePanelRenderer.setTarget(false, 0);
    
    // Update cost renderers based on current resources
    this.updateCostRenderers();
  }
  
  /**
   * Hide the recruit agency UI
   */
  public hide(): void {
    this.visible = false;
    this.container.setVisible(false);

    // Remove Esc key listener
    if (this.escKey) {
        this.escKey.removeListener('down', this.handleEscapeKey, this);
        this.escKey = null;
    }
    
    // Emit state change event
    this.emit(RecruitAgencyRendererEvents.STATE_CHANGED, false);
    
    // Notify the recruit service that the menu is closed
    this.recruitService.closeMenu();
    
    // Clear any selected target
    this.resourcePanelRenderer.setTarget(false);
    // Hide the resource panel
    this.resourcePanelRenderer.hide();
  }
  
  /**
   * Update the cost renderers based on player's current resources
   */
  private updateCostRenderers(): void {
    const totalAvailable = this.resourcePanelRenderer.totalAvailable();

    
    this.recruitOptions.forEach((option, index) => {
      const canAfford = totalAvailable >= option.cost;
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
   * Handle card selection changes
   */
  private onCardSelectionChanged(): void {
    // Update the cost display colors for all recruit options
    this.updateCostRenderers();
  }

  private onResourceChanged(): void {
    this.updateCostRenderers();
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
    
    // Remove event listeners
    this.playerHandRenderer.off(PlayerHandRendererEvents.SELECTION_CHANGED, this.onCardSelectionChanged, this);
    this.resourceService.off(ResourceServiceEvents.RESOURCE_CHANGED, this.onResourceChanged, this);
    
    // Remove all listeners from this emitter
    this.removeAllListeners();
    
    // Clean up container and ensure all child objects are properly destroyed
    if (this.container && this.container.scene) {
      // Make sure the container is no longer visible before destroying
      this.container.setVisible(false);
      this.container.destroy();
    }
    
    this.selectedOption = null;
    this.selectedOptionRenderer = null;
    this.visible = false;
  }

  private updateSubtitleText(): void {
    const currentSize = this.deckService.getTotalDeckSize();
    const deckLimit = this.deckService.deckLimit();
    this.subtitle.setText(`${currentSize}/${deckLimit} cards in the deck`);
  }
} 