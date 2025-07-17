import {HomePageComponent} from '../home/pages/homepage.component';
import Phaser from 'phaser';
import {MobileButtonManager} from './mobile-button-manager';
import Sprite = Phaser.GameObjects.Sprite;
import Random = Phaser.Math.Angle.Random;

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
  enemies!: Phaser.Physics.Arcade.Group;

  // Mobile button manager
  private mobileButtonManager!: MobileButtonManager;

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
    enemy: 0.04,
    wall: 0.06,       // Indestructible walls
    block: 0.07,      // Destructible blocks
    player: 0.04,     // Player character
    bomb: 0.04,       // Bombs placed by player
    explosion: 0.04,  // Explosion sprites (increased for visibility)
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
    physicsBodySize: 45,         // Fixed physics body size
    tileSize: 48,                // Fixed size for walls and blocks
    wallImageSize: 800,          // Original wall.png dimensions (you'd need to check this)
    blockImageSize: 600,         // Original block.png dimensions (you'd need to check this)
  };

  Direction = Object.freeze({
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
  });

  // enemies
  enemiesDirections = {}

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
    this.load.image('enemy', 'enemy.png');

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
    this.walls = this.physics.add.staticGroup();
    this.explosions = this.physics.add.staticGroup();
    this.blocks = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();

    const level = [
      'WWWWWWWWWWWWWWW',
      'WP  B   B B B W',
      'W WBW WB B WBWW',
      'W B B B   B   W',
      'WWWBW BW WB WBW',
      'W   B   B B   W',
      'WWWB WBWB BW WW',
      'W B   B   B B W',
      'WW WBWBWWWW WBW',
      'W B BWW E WW  W',
      'WWWBW BW WB WBW',
      'W     B W B   W',
      'WWWWWWWWWWWWWWW',
    ];


    for (let y = 0; y < level.length; y++) {
      for (let x = 0; x < level[y].length; x++) {
        if (level[y][x] === 'W') {
          const wall = this.walls.create(x * this.GAME_CONFIG.gridSize, y * this.GAME_CONFIG.gridSize, 'wall');
          wall.setDisplaySize(this.GAME_CONFIG.tileSize, this.GAME_CONFIG.tileSize); // Force exact size
          wall.refreshBody();
        } else if (level[y][x] === 'B') {
          const block = this.blocks.create(x * this.GAME_CONFIG.gridSize, y * this.GAME_CONFIG.gridSize, 'block');
          block.setDisplaySize(this.GAME_CONFIG.tileSize, this.GAME_CONFIG.tileSize); // Force exact size
          block.setTint(0xFFAAAA);
          block.refreshBody();
        } else if (level[y][x] === 'P') {
          // Create the player
          this.player = this.physics.add.sprite(x * this.GAME_CONFIG.playerStartX, y * this.GAME_CONFIG.playerStartY, 'player'); // Center of tile
          this.player.setScale(this.SCALES.player);
          this.player.refreshBody();
          this.player.setCollideWorldBounds(true);
          this.cameras.main.startFollow(this.player);
        } else if (level[y][x] === 'E') {
          const enemy = this.enemies.create(x * this.GAME_CONFIG.gridSize, y * this.GAME_CONFIG.gridSize, 'enemy'); // Center of tile
          this.setRandomDirection(enemy);
          enemy.setCollideWorldBounds(true);
          enemy.body.onWorldBounds = true;
          enemy.setBounce(1);
          enemy.setScale(this.SCALES.enemy);
          enemy.refreshBody();
        }
      }
    }

    // Create mobile button manager and buttons
    this.mobileButtonManager = new MobileButtonManager(this, this.mobileInput);
    this.mobileButtonManager.createMobileButtons();

    // Enable collisions between player and walls
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.bombs);
    this.physics.add.collider(this.player, this.explosions, this.handlePlayerAndExplosionCollision, undefined, this);
    this.physics.add.collider(this.explosions, this.walls);
    this.physics.add.collider(this.player, this.blocks);
    this.physics.add.collider(this.player, this.enemies);
    this.physics.add.collider(this.enemies, this.blocks, this.handleEnemiesAndBlocksCollision, undefined, this);
    this.physics.add.collider(this.enemies, this.walls, this.handleEnemiesAndWallsCollision, undefined, this);

    // Setup cursor keys
    this.cursors = this.input.keyboard!.createCursorKeys();
  }


  handleEnemiesAndBlocksCollision(enemy: any, wall: any) {
  }

  getRectangleCoordinates(obj: any): any {
    class RectangleCoordinates {
      static Coordinates = class {
        x: number;
        y: number;

        constructor(x: number, y: number) {
          this.x = x;
          this.y = y;
        }
      }

      topRight: InstanceType<typeof RectangleCoordinates.Coordinates>;
      bottomRight: InstanceType<typeof RectangleCoordinates.Coordinates>;
      topLeft: InstanceType<typeof RectangleCoordinates.Coordinates>;
      bottomLeft: InstanceType<typeof RectangleCoordinates.Coordinates>;

      constructor(
        rightTop: InstanceType<typeof RectangleCoordinates.Coordinates>,
        rightBottom: InstanceType<typeof RectangleCoordinates.Coordinates>,
        leftTop: InstanceType<typeof RectangleCoordinates.Coordinates>,
        leftBottom: InstanceType<typeof RectangleCoordinates.Coordinates>
      ) {
        this.topRight = rightTop;
        this.bottomRight = rightBottom;
        this.topLeft = leftTop;
        this.bottomLeft = bottomLeft;
      }
    }

    const objBounds = Phaser.Geom.Rectangle = obj.getBounds();
    const leftSideX = objBounds.x
    const rightSideX = objBounds.x + objBounds.width;

    const topRight = new RectangleCoordinates.Coordinates(rightSideX, objBounds.top);
    const bottomRight = new RectangleCoordinates.Coordinates(rightSideX, objBounds.bottom);
    const topLeft = new RectangleCoordinates.Coordinates(leftSideX, objBounds.top);
    const bottomLeft = new RectangleCoordinates.Coordinates(leftSideX, objBounds.bottom);

    return new RectangleCoordinates(topRight, bottomRight, topLeft, bottomLeft);
  }

  debugCoordinates(x: number, y: number) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 1); // Red, opaque
    graphics.fillRect(x, y, 10, 10);
  }

  handleEnemiesAndWallsCollision(enemy: any, wall: any) {
    const rectangleCoordinates = this.getRectangleCoordinates(enemy);
    this.debugCoordinates(rectangleCoordinates.topLeft.x, rectangleCoordinates.topLeft.y);

    // if enemy rectangle right side range is in wall rectangle left side
    // return left side
    // else if enemy collided in left to rectangle right side
    // return rigth side

  }


  setEnemyDirection() {

  }

  handleResize() {
    // Update button positions when screen resizes
    this.mobileButtonManager?.updateButtonPositions();
  }

  setRandomDirection(enemy: any) {
    const directions = Object.values(this.Direction);
    const randomIndex = Math.floor(Math.random() * directions.length);
    const direction = directions[randomIndex];
    switch (direction) {
      case this.Direction.UP:
        enemy.setVelocityY(100);
        return
      case this.Direction.DOWN:
        enemy.setVelocityY(-100);
        return
      case this.Direction.LEFT:
        enemy.setVelocityX(-100)
        return
      case this.Direction.RIGHT:
        enemy.setVelocityX(100);
        return
    }
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
    this.player.destroy();
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
      // place the middle bomb
      if (i == 1) {
        this.createExplosion(bomb.x, bomb.y);
      }

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
