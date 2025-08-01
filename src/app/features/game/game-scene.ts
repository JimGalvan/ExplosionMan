import { HomePageComponent } from '../home/pages/homepage.component';
import Phaser from 'phaser';
import { MobileButtonManager } from './mobile-button-manager';
import { Player } from './entities/player';
import { Bomb } from './entities/bomb';
import { CollisionManager } from './managers/collision-manager';
import { LevelManager } from './managers/level-manager';
import { UIManager } from './managers/ui-manager';
import { ExplosionManager } from './managers/explosion-manager';

export class GameScene extends Phaser.Scene {
  // Game state
  private isPlayerAlive: boolean = true;

  // Game entities and managers
  private player!: Player;
  private bombs: Bomb[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // Physics groups
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private explosions!: Phaser.Physics.Arcade.StaticGroup;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bombsGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Managers
  private mobileButtonManager!: MobileButtonManager;
  private collisionManager!: CollisionManager;
  private levelManager!: LevelManager;
  private uiManager!: UIManager;
  private explosionManager!: ExplosionManager;

  // Mobile input states
  private mobileInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    bomb: false
  };


  // Game configuration - moved from scattered locations
  private readonly gameConfig = {
    SCALES: {
      enemy: 0.04,
      wall: 0.06,
      block: 0.07,
      player: 0.04,
      bomb: 0.04,
      explosion: 0.04,
    },
    TIMINGS: {
      bombExplosionDelay: 2000,
      explosionDuration: 1000,
    },
    GAME_CONFIG: {
      playerSpeed: 150,
      bombOverlapDistance: 40,
      explosionRange: 3,
      gridSize: 50,
      worldWidth: 1600,
      worldHeight: 1200,
      playerStartX: 32 + 16,
      playerStartY: 32 + 16,
      physicsBodySize: 45,
      tileSize: 48,
      wallImageSize: 800,
      blockImageSize: 600,
    }
  };

  constructor(private component: HomePageComponent) {
    super({key: 'MyScene'});
  }

  preload() {
    // load assets
    this.load.image('block', 'block.png');
    this.load.image('wall', 'wall.png');
    this.load.image('player', 'player.png');
    this.load.image('bomb', 'bomb.png');
    this.load.image('explosion', 'explosion.png');
    this.load.image('grass', 'grass.png');
    this.load.image('enemy', 'enemy.png');

    // Load mobile button assets
    this.load.image('up_button', 'buttons/up_button.png');
    this.load.image('down_button', 'buttons/down_button.png');
    this.load.image('left_button', 'buttons/left_button.png');
    this.load.image('right_button', 'buttons/right_button.png');
    this.load.image('place_bomb_button', 'buttons/place_bomb_button.png');
  }

  create() {
    // Initialize managers
    this.levelManager = new LevelManager(this, this.gameConfig);
    this.collisionManager = new CollisionManager(this, this.handlePlayerDeath.bind(this));
    this.uiManager = new UIManager(this);
    this.explosionManager = new ExplosionManager(this, this.gameConfig);

    // Setup world and camera
    this.setupWorldAndCamera();

    // Create input
    this.setupInput();

    // Create physics groups
    this.createPhysicsGroups();

    // Create level and entities
    this.createLevel();

    // Setup mobile controls
    this.setupMobileControls();

    // Setup collisions
    this.setupCollisions();
  }

  private setupWorldAndCamera(): void {
    const { worldWidth, worldHeight } = this.gameConfig.GAME_CONFIG;
    const middleX = ((this.component.width / 2)) * -1;
    const middleY = ((this.component.height / 2) / 3) * -1;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(middleX, middleY, worldWidth, worldHeight);

    // Create grass background
    this.add.tileSprite(middleX, middleY, worldWidth, worldHeight, 'grass')
      .setOrigin(0, 0);

    this.scale.on('resize', this.handleResize, this);
  }

  private setupInput(): void {
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  private createPhysicsGroups(): void {
    this.bombsGroup = this.physics.add.staticGroup();
    this.walls = this.physics.add.staticGroup();
    this.explosions = this.physics.add.staticGroup();
    this.blocks = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
  }

  private createLevel(): void {
    const { player } = this.levelManager.createLevel(this.walls, this.blocks, this.enemies);
    if (player) {
      this.player = player;
      this.cameras.main.startFollow(this.player.getSprite());
    }
  }

  private setupMobileControls(): void {
    this.mobileButtonManager = new MobileButtonManager(this, this.mobileInput);
    this.mobileButtonManager.createMobileButtons();
  }

  private setupCollisions(): void {
    this.collisionManager.setupCollisions(
      this.player,
      this.enemies,
      this.walls,
      this.blocks,
      this.bombsGroup,
      this.explosions
    );

  }








  private handleResize(): void {
    this.mobileButtonManager?.updateButtonPositions();
  }


  override update() {
    if (!this.isPlayerAlive || !this.player) return;

    // Update player movement
    this.player.update(this.cursors, this.mobileInput);

    // Handle bomb placement
    if (this.spaceKey.isDown || this.mobileInput.bomb) {
      this.handleBombPlacement();
    }
  }

  private handleBombPlacement(): void {
    const playerPos = this.player.getPosition();
    const existingBomb = Bomb.checkOverlap(playerPos, this.bombs, this.gameConfig.GAME_CONFIG.bombOverlapDistance);
    
    if (!existingBomb) {
      this.createBomb();
    }
  }

  private handlePlayerDeath(): void {
    this.isPlayerAlive = false;
    this.player.destroy();
    this.uiManager.showGameOverDialog(() => {
      this.scene.restart();
    });
  }


  private createBomb(): void {
    const playerPos = this.player.getPosition();
    const bomb = new Bomb(this, playerPos.x, playerPos.y, this.gameConfig, (bomb: Bomb) => {
      this.handleBombExplosion(bomb);
    });
    
    this.bombs.push(bomb);
    this.bombsGroup.add(bomb.getSprite());
  }

  private handleBombExplosion(bomb: Bomb): void {
    this.explosionManager.createExplosions(bomb, this.walls, this.blocks, this.explosions);
    
    // Remove bomb from tracking
    const index = this.bombs.indexOf(bomb);
    if (index > -1) {
      this.bombs.splice(index, 1);
    }
    
    bomb.destroy();
  }





}
