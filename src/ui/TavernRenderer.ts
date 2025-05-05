import Phaser from 'phaser';
import { ResourceType } from '../entities/Types';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';
import { AdventureLevel, TavernService } from '../services/TavernService';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';
import { ResourcePanelRenderer } from './ResourcePanelRenderer';
import { SimpleCardRenderer } from './SimpleCardRenderer';

/**
 * Component that renders the tavern interface and adventure selection
 */
export class TavernRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private tavernService: TavernService;
  private resourceService: ResourceService;
  private deckService: DeckService<any> | null = null; // TODO remove not used
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
  private levelCards: Map<AdventureLevel, SimpleCardRenderer> = new Map();
  
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
    tavernService: TavernService,
    resourceService: ResourceService,
    deckService?: DeckService<any>
  ) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = width;
    this.panelHeight = height;
    this.playerHandRenderer = playerHandRenderer;
    this.resourceService = resourceService;
    this.deckService = deckService || null;
    this.tavernService = tavernService;
    
    // Create container for all UI elements
    this.container = this.scene.add.container();
    this.container.setVisible(false);
    
    // Set a high depth to ensure it renders on top of other UI elements
    this.container.setDepth(1000);

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
      'panel_metal_corners_metal_nice',
      undefined,
      this.panelWidth,
      this.panelHeight,
      20, 20, 20, 20
    );
    background.setOrigin(0,0);
    background.setTint(0x666666); // Dark grey tint

    
    // Add title
    const title = this.scene.add.text(
      this.panelX + this.panelWidth / 2,
      this.panelY + 30,
      'Tavern',
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
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
    this.resourcePanelRenderer = new ResourcePanelRenderer(
      this.scene,
      this.playerHandRenderer,
      ResourceType.Power,
      'Proceed',
      () => this.proceedWithAdventure(),
      this.resourceService
    );
    
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
   * Update the resource display with current values
   */
  private updateResourceDisplay(): void {
    if (!this.resourcePanelRenderer) return;
    
    // Update proceed button state based on level selection and resources
    this.updateProceedButtonState();
  }
  
  /**
   * Handle Proceed button click
   */
  private proceedWithAdventure(): void {
    console.log('proceedWithAdventure');
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
    
    // Destroy all level cards
    this.levelCards.forEach(card => card.destroy());
    this.levelCards.clear();
    
    // Destroy the resource panel
    if (this.resourcePanelRenderer) {
      this.resourcePanelRenderer.destroy();
      this.resourcePanelRenderer = null; // TODO this is probably not needed.
    }
    
    this.container.destroy();
  }
  
  /**
   * Handle card selection events
   */
  private handleCardSelected(data: { card: SimpleCardRenderer, selected: boolean }): void {
    // Find the level associated with this card
    let selectedLevelKey: AdventureLevel | null = null;
    
    for (const [level, card] of this.levelCards.entries()) {
      if (card === data.card) {
        selectedLevelKey = level;
        break;
      }
    }
    
    if (!selectedLevelKey) return;
    
    // If this level is already selected and was just deselected, clear selection
    if (this.selectedLevel === selectedLevelKey && !data.selected) {
      this.selectedLevel = null;
    } 
    // If a new card was selected, deselect previous card if any
    else if (data.selected) {
      // Deselect previously selected card if different
      if (this.selectedLevel !== null && this.selectedLevel !== selectedLevelKey) {
        const prevCard = this.levelCards.get(this.selectedLevel);
        if (prevCard) {
          prevCard.setSelected(false);
        }
      }
      
      // Set new selection
      this.selectedLevel = selectedLevelKey;
    }
    
    // Update proceed button state, by setting the target
    this.updateProceedButtonState();
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
    
    levels.forEach((level, index) => {
      const row = Math.floor(index / this.levelsPerRow);
      const col = index % this.levelsPerRow;
      
      const cardX = this.panelX + (col + 0.5) * (this.levelCardWidth + this.levelCardSpacing) + 40;
      const cardY = this.panelY + (row + 0.5) * (this.levelCardHeight + this.levelCardSpacing) + 80;
      
      // Create card using SimpleCardRenderer
      const card = new SimpleCardRenderer(
        this.scene,
        cardX,
        cardY,
        'panel_wood_corners_metal',
        'recruit_card',
        1,
        true,
        () => this.onLevelCardClicked(level)
      );
      
      // If this is the previously selected level, select it
      if (this.selectedLevel === level) {
        card.setSelected(true);
      }
      
      this.levelCards.set(level, card);
      this.container.add(card.getContainer());
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
        card.setSelected(false);
      }
    }
    
    // Deselect the level
    this.selectedLevel = null;
    
    // Update the resource panel target
    this.resourcePanelRenderer?.setTarget(false);
  }
  
  private onLevelCardClicked(level: AdventureLevel): void {        
    this.selectedLevel = level;    
    this.updateProceedButtonState();
  }
} 