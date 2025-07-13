import {HomePageComponent} from '../home/pages/homepage.component';
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  // player state
  isPlayerAlive: boolean = true

  // game entities
  walls!: Phaser.Physics.Arcade.StaticGroup;
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  bombs!: Phaser.Physics.Arcade.StaticGroup;
  explosions!: Phaser.Physics.Arcade.StaticGroup;
  blocks!: Phaser.Physics.Arcade.StaticGroup;

  // Mobile buttons
  upButton!: Phaser.GameObjects.Image;
  downButton!: Phaser.GameObjects.Image;
  leftButton!: Phaser.GameObjects.Image;
  rightButton!: Phaser.GameObjects.Image;
  bombButton!: Phaser.GameObjects.Image;

  // Mobile input states
  mobileInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    bomb: false
  };

  // Scale configurations for all game elements
  SCALES = {
    wall: 0.06,       // Indestructible walls
    block: 0.07,      // Destructible blocks
    player: 0.04,     // Player character
    bomb: 0.04,       // Bombs placed by player
    explosion: 0.04,  // Explosion sprites (increased for visibility)
    button: 0.16      // Mobile buttons (increased for better touch experience)
  };

  // Timing configurations
  TIMINGS = {
    bombExplosionDelay: 2000,    // Time before bomb explodes (ms)
    explosionDuration: 1000,     // How long explosions stay visible (ms)
  };

  // Game mechanics configuration
  GAME_CONFIG = {
    playerSpeed: 150,            // Player movement speed
    bombOverlapDistance: 40,     // Distance to detect bomb overlap
    explosionRange: 3,           // How many tiles explosion reaches
    gridSize: 50,                // Size of each grid cell
    worldWidth: 1600,            // World width
    worldHeight: 1200,           // World height
    playerStartX: 32 + 16,       // Player starting X position
    playerStartY: 32 + 16,       // Player starting Y position
  };

  // other
  spaceKey!: Phaser.Input.Keyboard.Key;
  restartUI: any = [];

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

    // Load mobile button assets
    this.load.image('up_button', 'buttons/up_button.png');
    this.load.image('down_button', 'buttons/down_button.png');
    this.load.image('left_button', 'buttons/left_button.png');
    this.load.image('right_button', 'buttons/right_button.png');
    this.load.image('place_bomb_button', 'buttons/place_bomb_button.png');
  }

  create() {
    // define world boundaries
    const worldWidth = this.GAME_CONFIG.worldWidth;
    const worldHeight = this.GAME_CONFIG.worldHeight;

    // create keys
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // calculate map initial position
    const middleX = ((this.component.width / 2)) * -1;
    const middleY = ((this.component.height / 2) / 3) * -1;

    // Set the bounds of the world (for physics and camera)
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(middleX, middleY, worldWidth, worldHeight);

    // Create grass background covering the entire world
    this.add.tileSprite(middleX, middleY, worldWidth, worldHeight, 'grass')
      .setOrigin(0, 0);

    // Handle resize events
    this.scale.on('resize', this.handleResize, this);

    // create static objects
    this.bombs = this.physics.add.staticGroup();
    this.bombs.world = this.physics.world;
    this.walls = this.physics.add.staticGroup();
    this.walls.world = this.physics.world;
    this.explosions = this.physics.add.staticGroup();
    this.blocks = this.physics.add.staticGroup();

    const level = [
      'WWWWWWWWWWWWWWW',
      'WP  B   B B B W',
      'W WBW WB B WBWW',
      'W B B B   B   W',
      'WWWBW BW WB WBW',
      'W   B   B B   W',
      'WWWB WBWB BW WW',
      'W B   B   B B W',
      'WW WBWBW BW WBW',
      'W B B     B   W',
      'WWWBW BW WB WBW',
      'W     B B B   W',
      'WWWWWWWWWWWWWWW',
    ];


    for (let y = 0; y < level.length; y++) {
      for (let x = 0; x < level[y].length; x++) {
        if (level[y][x] === 'W') {
          const wall = this.walls.create(x * this.GAME_CONFIG.gridSize, y * this.GAME_CONFIG.gridSize, 'wall');
          wall.setScale(this.SCALES.wall);
          wall.refreshBody();        // IMPORTANT: update physics body to match scale
        } else if (level[y][x] === 'B') {
          const block = this.blocks.create(x * this.GAME_CONFIG.gridSize, y * this.GAME_CONFIG.gridSize, 'block');
          block.setScale(this.SCALES.block);
          block.setTint(0xFFAAAA); // Light red tint to distinguish from walls
          block.refreshBody();
        } else if (level[y][x] === 'P') {
          // Create the player
          this.player = this.physics.add.sprite(x * this.GAME_CONFIG.playerStartX, y * this.GAME_CONFIG.playerStartY, 'player'); // Center of tile
          this.player.setScale(this.SCALES.player);
          this.player.refreshBody();
          // this.player.body.setSize(100,20)
          this.player.setCollideWorldBounds(true);
          this.cameras.main.startFollow(this.player);
        }
      }
    }

    // Create mobile buttons
    this.createMobileButtons();

    // Share the group with Angular component
    this.component.walls = this.walls;
    // this.component.bombs = this.bombs;

    // Enable collisions between player and walls
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.bombs);
    this.physics.add.collider(this.player, this.explosions, this.handlePlayerAndExplosionCollision, undefined, this);
    this.physics.add.collider(this.explosions, this.walls);
    this.physics.add.collider(this.player, this.blocks);

    // Setup cursor keys
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  createMobileButtons() {
    const {width, height} = this.scale;
    const buttonSize = this.SCALES.button;

    // Responsive button positioning
    const isLandscape = width > height;
    const margin = isLandscape ? 60 : 80;
    const buttonSpacing = isLandscape ? 100 : 120;

    // Create movement buttons (left side)
    // Up button
    this.upButton = this.add.image(margin + buttonSpacing, height - margin - buttonSpacing * 2, 'up_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Down button
    this.downButton = this.add.image(margin + buttonSpacing, height - margin, 'down_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Left button
    this.leftButton = this.add.image(margin, height - margin - buttonSpacing, 'left_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Right button
    this.rightButton = this.add.image(margin + buttonSpacing * 2, height - margin - buttonSpacing, 'right_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Bomb button (right side) - adjusted for landscape
    const bombButtonX = width - margin - (isLandscape ? 40 : 60);
    this.bombButton = this.add.image(bombButtonX, height - margin - buttonSpacing, 'place_bomb_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Add button event listeners
    this.setupButtonEvents();
  }

  handleResize() {
    // Update button positions when screen resizes
    this.updateButtonPositions();
  }

  updateButtonPositions() {
    if (!this.upButton) return; // Exit if buttons haven't been created yet

    const {width, height} = this.scale;
    const isLandscape = width > height;
    const margin = isLandscape ? 60 : 80;
    const buttonSpacing = isLandscape ? 100 : 120;

    // Update movement buttons positions
    this.upButton.setPosition(margin + buttonSpacing, height - margin - buttonSpacing * 2);
    this.downButton.setPosition(margin + buttonSpacing, height - margin);
    this.leftButton.setPosition(margin, height - margin - buttonSpacing);
    this.rightButton.setPosition(margin + buttonSpacing * 2, height - margin - buttonSpacing);

    // Update bomb button position
    const bombButtonX = width - margin - (isLandscape ? 40 : 60);
    this.bombButton.setPosition(bombButtonX, height - margin - buttonSpacing);
  }

  setupButtonEvents() {
    // Movement buttons
    this.upButton.on('pointerdown', () => {
      this.mobileInput.up = true;
      this.upButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.upButton.on('pointerup', () => {
      this.mobileInput.up = false;
      this.upButton.clearTint().setAlpha(0.7);
    });
    this.upButton.on('pointerout', () => {
      this.mobileInput.up = false;
      this.upButton.clearTint().setAlpha(0.7);
    });

    this.downButton.on('pointerdown', () => {
      this.mobileInput.down = true;
      this.downButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.downButton.on('pointerup', () => {
      this.mobileInput.down = false;
      this.downButton.clearTint().setAlpha(0.7);
    });
    this.downButton.on('pointerout', () => {
      this.mobileInput.down = false;
      this.downButton.clearTint().setAlpha(0.7);
    });

    this.leftButton.on('pointerdown', () => {
      this.mobileInput.left = true;
      this.leftButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.leftButton.on('pointerup', () => {
      this.mobileInput.left = false;
      this.leftButton.clearTint().setAlpha(0.7);
    });
    this.leftButton.on('pointerout', () => {
      this.mobileInput.left = false;
      this.leftButton.clearTint().setAlpha(0.7);
    });

    this.rightButton.on('pointerdown', () => {
      this.mobileInput.right = true;
      this.rightButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.rightButton.on('pointerup', () => {
      this.mobileInput.right = false;
      this.rightButton.clearTint().setAlpha(0.7);
    });
    this.rightButton.on('pointerout', () => {
      this.mobileInput.right = false;
      this.rightButton.clearTint().setAlpha(0.7);
    });

    // Bomb button
    this.bombButton.on('pointerdown', () => {
      this.mobileInput.bomb = true;
      this.bombButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.bombButton.on('pointerup', () => {
      this.mobileInput.bomb = false;
      this.bombButton.clearTint().setAlpha(0.7);
    });
    this.bombButton.on('pointerout', () => {
      this.mobileInput.bomb = false;
      this.bombButton.clearTint().setAlpha(0.7);
    });
  }

  override update() {
    // game loop
    const speed = this.GAME_CONFIG.playerSpeed;
    const body = this.player.body;

    if (!body) return;
    body.setVelocity(0);

    // Handle keyboard input
    if (this.cursors.left?.isDown || this.mobileInput.left) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown || this.mobileInput.right) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up?.isDown || this.mobileInput.up) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown || this.mobileInput.down) {
      body.setVelocityY(speed);
    }

    if (this.spaceKey.isDown || this.mobileInput.bomb) {
      const existingBomb = this.getPlayerOverlapsExistingBomb();
      if (!existingBomb) {
        this.createBomb()
      }
    }

    // Normalize diagonal movement
    body.velocity.normalize().scale(speed);
  }

  handlePlayerAndExplosionCollision() {
    this.showRestartDialog();
    // this.restartUI.forEach((el: { destroy: () => any; }) => el.destroy());
  }

  getPlayerOverlapsExistingBomb(): any {
    return this.bombs.children.getArray().find((bomb: any) => {
      const bombSprite = bomb as Phaser.Physics.Arcade.Sprite;
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        bombSprite.x, bombSprite.y
      );
      return distance < this.GAME_CONFIG.bombOverlapDistance; // Within configured distance
    });
  }

  createBomb() {
    const bomb = this.bombs.create(this.player.x, this.player.y, 'bomb')
    bomb.setScale(this.SCALES.bomb);
    bomb.refreshBody();
    this.time.delayedCall(this.TIMINGS.bombExplosionDelay, () => {
      this.createExplosions(bomb);
      bomb.destroy();
    })
  }

  private createExplosions(bomb: any) {
    console.log("creating explosions")
    let canExplodeRight = true;
    let canExplodeLeft = true;
    let canExplodeUp = true;
    let canExplodeDown = true;
    const explosionPos = (i: number) => (this.GAME_CONFIG.gridSize / 1.5) * i

    for (let i = 1; i <= this.GAME_CONFIG.explosionRange; i++) {
      // // create horizontal explosion to the right
      if (canExplodeRight) {
        // const xPos = bomb.x + (this.player.width * i)
        const xPos = bomb.x + explosionPos(i);
        const isRightExplosionCreated = this.createExplosion(xPos, bomb.y);
        if (!isRightExplosionCreated) {
          canExplodeRight = false;
        }
      }

      // create horizontal explosion to the left
      if (canExplodeLeft) {
        const xPos = bomb.x - explosionPos(i)
        const isLeftExplosionCreated = this.createExplosion(xPos, bomb.y);
        if (!isLeftExplosionCreated) {
          canExplodeLeft = false;
        }
      }

      // create vertical explosion to up
      if (canExplodeDown) {
        const yPos = bomb.y + explosionPos(i)
        const isDownExplosionCreated = this.createExplosion(bomb.x, yPos);
        if (!isDownExplosionCreated) {
          canExplodeDown = false;
        }
      }
      // create vertical explosion to down
      if (canExplodeUp) {
        const yPos = bomb.y - explosionPos(i)
        const isUpExplosionCreated = this.createExplosion(bomb.x, yPos);
        if (!isUpExplosionCreated) {
          canExplodeUp = false;
        }
      }
    }
  }

  createExplosion(x: number, y: number) {
    const isExplosionPosCollidingWithWall = this.getIsExplosionPosCollidingWithWall(x, y);
    if (isExplosionPosCollidingWithWall) {
      return false;
    }
    console.log("creating explosion")
    const explosion = this.explosions.create(x, y, 'explosion');
    explosion.setScale(this.SCALES.explosion);
    explosion.refreshBody();

    const destroyedAnyBlock = this.handleDestroyingBlocks(explosion)
    this.time.delayedCall(this.TIMINGS.explosionDuration, () => {
      explosion.destroy();
    })

    return !destroyedAnyBlock;
  }

  handleDestroyingBlocks(explosion: any) {
    let destroyedAnyBlock = false;
    this.blocks.getChildren().forEach(obj => {
      const block = obj as Phaser.GameObjects.Sprite;
      const isExplosionTouchingBlock = block.getBounds().contains(explosion.x, explosion.y);
      if (isExplosionTouchingBlock) {
        block.destroy();
        destroyedAnyBlock = true;
      }
    });
    return destroyedAnyBlock;
  }

  getIsExplosionPosCollidingWithWall(x: number, y: number) {
    return this.walls.getChildren().find(obj => {
      const wall = obj as Phaser.GameObjects.Sprite;
      return wall.getBounds().contains(x, y);
    });
  }

  showRestartDialog() {

    // 2. Dialog background box
    const dialog = this.add.rectangle(
      0,
      this.cameras.main.y,
      300,
      200,
      0xffffff,
      1
    );
    dialog.setStrokeStyle(2, 0x000000);

    // 3. Text
    const text = this.add.text(
      0,
      0,
      'Game Over',
      {fontSize: '32px', color: '#000'}
    ).setOrigin(0.5);

    // 4. Restart button
    const restartBtn = this.add.text(
      0,
      40,
      'Restart',
      {
        fontSize: '24px',
        backgroundColor: '#000',
        color: '#fff',
        padding: {x: 20, y: 10},
      }
    )
      .setOrigin(0)
      .setInteractive();

    restartBtn.on('pointerdown', () => {
      this.scene.restart();
    });

    // 5. Group them to destroy later if needed
    this.restartUI = [dialog, text, restartBtn];
  }
}
