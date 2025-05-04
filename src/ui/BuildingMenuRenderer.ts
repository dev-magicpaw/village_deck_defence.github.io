import Phaser from 'phaser';
import { BuildingService } from '../services/BuildingService';

/**
 * Component for rendering the building construction menu
 * Displays when a building slot is clicked
 */
export class BuildingMenuRenderer {
  private scene: Phaser.Scene;
  private buildingService: BuildingService;
  private menuContainer: Phaser.GameObjects.Container;
  private backgroundPanel: Phaser.GameObjects.NineSlice;
  private titleText: Phaser.GameObjects.Text;
  private closeButton: Phaser.GameObjects.Image;
  private buildingButtons: Phaser.GameObjects.Container[] = [];
  
  // Menu dimensions and position
  private menuWidth: number = 400;
  private menuHeight: number = 500;
  private menuX: number;
  private menuY: number;
  private isVisible: boolean = false;
  private currentSlotUniqueId: string = '';
  
  /**
   * Create a new building menu renderer
   * @param scene The Phaser scene to render in
   * @param buildingService The building service to interact with
   */
  constructor(
    scene: Phaser.Scene,
    buildingService: BuildingService
  ) {
    this.scene = scene;
    this.buildingService = buildingService;
    
    // Center the menu in the screen
    this.menuX = this.scene.cameras.main.width / 2;
    this.menuY = this.scene.cameras.main.height / 2;
    
    // Create the menu container
    this.menuContainer = this.scene.add.container(this.menuX, this.menuY);
    this.menuContainer.setVisible(false);
    
    // Create the background panel
    this.backgroundPanel = this.scene.add['nineslice'](
      0,
      0,
      'panel_wood_corners_metal',
      undefined,
      this.menuWidth,
      this.menuHeight,
      20,
      20,
      20,
      20
    );
    this.backgroundPanel.setOrigin(0.5, 0.5);
    
    // Create title text
    this.titleText = this.scene.add.text(
      0,
      -this.menuHeight / 2 + 40,
      'Building Menu',
      {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center'
      }
    );
    this.titleText.setOrigin(0.5, 0.5);
    
    // Create close button
    this.closeButton = this.scene.add.image(
      this.menuWidth / 2 - 30,
      -this.menuHeight / 2 + 30,
      'close_button'
    );
    this.closeButton.setOrigin(0.5, 0.5);
    this.closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.hide();
      });
    
    // Add elements to container
    this.menuContainer.add(this.backgroundPanel);
    this.menuContainer.add(this.titleText);
    this.menuContainer.add(this.closeButton);
    
    // Add the container to the scene
    this.scene.add.existing(this.menuContainer);
  }
  
  /**
   * Show the building menu for a specific slot
   * @param slotUniqueId The unique ID of the building slot to display the menu for
   */
  public show(slotUniqueId: string): void {
    this.currentSlotUniqueId = slotUniqueId;
    
    // Get the building slot data
    const slot = this.buildingService.getBuildingSlotByUniqueId(slotUniqueId);
    if (!slot) {
      // Try fallback to legacy ID for backward compatibility
      const slotByLegacyId = this.buildingService.getBuildingSlotById(slotUniqueId);
      if (slotByLegacyId) {
        console.warn(`Using legacy slot ID ${slotUniqueId} instead of unique_id`);
        this.show(slotByLegacyId.unique_id);
        return;
      }
      
      console.error(`Building slot with unique ID ${slotUniqueId} not found`);
      return;
    }
    
    // Update title with slot ID (using a shorter version of the unique_id for display)
    this.titleText.setText(`Building Options - Slot ${slotUniqueId.substring(0, 8)}...`);
    
    // Clear any existing building buttons
    this.clearBuildingButtons();
    
    // Create buttons for each available building
    this.createBuildingButtons(slot.available_for_construction);
    
    // Show the menu
    this.menuContainer.setVisible(true);
    this.isVisible = true;
    
    // Bring to top to ensure it's above other elements
    this.menuContainer.setDepth(1000);
  }
  
  /**
   * Hide the building menu
   */
  public hide(): void {
    this.menuContainer.setVisible(false);
    this.isVisible = false;
    this.currentSlotUniqueId = '';
  }
  
  /**
   * Check if the menu is currently visible
   */
  public isMenuVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * Create buttons for each available building
   * @param availableBuildingIds Array of building IDs available for construction
   */
  private createBuildingButtons(availableBuildingIds: string[]): void {
    if (!availableBuildingIds || availableBuildingIds.length === 0) {
      // No buildings available, show a message
      const noOptionsText = this.scene.add.text(
        0,
        0,
        'No buildings available for construction',
        {
          fontSize: '18px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: this.menuWidth - 60 }
        }
      );
      noOptionsText.setOrigin(0.5, 0.5);
      
      this.menuContainer.add(noOptionsText);
      this.buildingButtons.push(this.scene.add.container(0, 0).add(noOptionsText));
      return;
    }
    
    // Calculate button height and spacing
    const buttonHeight = 80;
    const buttonSpacing = 10;
    const buttonWidth = this.menuWidth - 60;
    
    // Create a button for each available building
    availableBuildingIds.forEach((buildingId, index) => {
      // Get building config
      const buildingConfig = this.buildingService.getBuildingConfig(buildingId);
      if (!buildingConfig) return;
      
      // Create a container for the button
      const buttonContainer = this.scene.add.container(
        0,
        -this.menuHeight / 2 + 100 + index * (buttonHeight + buttonSpacing)
      );
      
      // Create button background
      const buttonBackground = this.scene.add['nineslice'](
        0,
        0,
        'button_wood',
        undefined,
        buttonWidth,
        buttonHeight,
        10,
        10,
        10,
        10
      );
      buttonBackground.setOrigin(0.5, 0.5);
      
      // Make button interactive
      buttonBackground.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.onBuildingSelected(buildingId);
        });
      
      // Add hover effects
      buttonBackground.on('pointerover', () => {
        buttonBackground.setTint(0xcccccc);
      });
      
      buttonBackground.on('pointerout', () => {
        buttonBackground.clearTint();
      });
      
      // Create text for building name
      const nameText = this.scene.add.text(
        -buttonWidth / 2 + 15,
        -15,
        buildingConfig.name,
        {
          fontSize: '18px',
          color: '#ffffff',
          align: 'left'
        }
      );
      nameText.setOrigin(0, 0.5);
      
      // Create text for building description
      const descText = this.scene.add.text(
        -buttonWidth / 2 + 15,
        15,
        buildingConfig.description,
        {
          fontSize: '14px',
          color: '#cccccc',
          align: 'left',
          wordWrap: { width: buttonWidth - 30 }
        }
      );
      descText.setOrigin(0, 0.5);
      
      // Add elements to container
      buttonContainer.add(buttonBackground);
      buttonContainer.add(nameText);
      buttonContainer.add(descText);
      
      // Add button container to menu container
      this.menuContainer.add(buttonContainer);
      
      // Save reference to button container
      this.buildingButtons.push(buttonContainer);
    });
  }
  
  /**
   * Called when a building is selected from the menu
   * @param buildingId The ID of the selected building
   */
  private onBuildingSelected(buildingId: string): void {
    console.log(`Building selected: ${buildingId} for slot ${this.currentSlotUniqueId}`);
    
    // Construct the building in the selected slot
    if (this.currentSlotUniqueId) {
      const constructed = this.buildingService.constructBuilding(buildingId, this.currentSlotUniqueId);
      if (constructed) {
        console.log(`Successfully constructed building ${buildingId} in slot ${this.currentSlotUniqueId}`);
        
        // Dispatch an event to notify other components
        const event = new CustomEvent('building:constructed', {
          detail: {
            buildingId,
            slotUniqueId: this.currentSlotUniqueId
          }
        });
        window.dispatchEvent(event);
      } else {
        console.error(`Failed to construct building ${buildingId} in slot ${this.currentSlotUniqueId}`);
      }
    }
    
    // Hide the menu
    this.hide();
  }
  
  /**
   * Clear all building buttons
   */
  private clearBuildingButtons(): void {
    this.buildingButtons.forEach(container => {
      container.destroy();
    });
    this.buildingButtons = [];
  }
  
  /**
   * Handle window resize
   */
  public resize(): void {
    // Update menu position to center
    this.menuX = this.scene.cameras.main.width / 2;
    this.menuY = this.scene.cameras.main.height / 2;
    this.menuContainer.setPosition(this.menuX, this.menuY);
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.menuContainer.destroy();
  }
} 