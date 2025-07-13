import {HomePageComponent} from '../home/pages/homepage.component';
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  // game entities
  walls!: Phaser.Physics.Arcade.StaticGroup;
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  bombs!: Phaser.Physics.Arcade.StaticGroup;
  explosions!: Phaser.Physics.Arcade.StaticGroup;
  blocks!: Phaser.Physics.Arcade.StaticGroup;

  // Scale configurations for all game elements
  SCALES = {
    wall: 0.06,       // Indestructible walls
    block: 0.07,      // Destructible blocks
    player: 0.04,     // Player character
    bomb: 0.04,       // Bombs placed by player
    explosion: 0.04    // Explosion sprites (increased for visibility)
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
  }

  create() {
    const {width, height} = this.scale;
    this.add.tileSprite(0, 0, width, height, 'grass')
      .setOrigin(0, 0);
    // .setScrollFactor(0);

    // create keys
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // calculate map initial position
    const middleX = ((this.component.width / 2) / 2) * -1;
    const middleY = ((this.component.height / 2) / 3) * -1;

    // define world boundaries
    const worldWidth = this.GAME_CONFIG.worldWidth;
    const worldHeight = this.GAME_CONFIG.worldHeight;

    // Set the bounds of the world (for physics and camera)
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(middleX, middleY, worldWidth, worldHeight);

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

  override update() {
    // game loop
    const speed = this.GAME_CONFIG.playerSpeed;
    const body = this.player.body;

    if (!body) return;
    body.setVelocity(0);

    if (this.cursors.left?.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up?.isDown) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown) {
      body.setVelocityY(speed);
    }

    if (this.spaceKey.isDown) {
      const existingBomb = this.getPlayerOverlapsExistingBomb();
      if (!existingBomb) {
        this.createBomb()
      }
    }

    // Normalize diagonal movement
    body.velocity.normalize().scale(speed);
  }

  handlePlayerAndExplosionCollision() {
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
}
