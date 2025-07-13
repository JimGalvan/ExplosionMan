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

  // configurations
  WALL_HEIGHT: number = 48;
  WALL_WIDTH: number = 48;

  // Scale configurations for all game elements
  SCALES = {
    wall: 0.05,       // Indestructible walls
    block: 0.05,      // Destructible blocks
    player: 0.03,     // Player character
    bomb: 0.05,       // Bombs placed by player
    explosion: 0.05   // Explosion sprites
  };

  // other
  spaceKey!: Phaser.Input.Keyboard.Key;

  constructor(private component: HomePageComponent) {
    super({key: 'MyScene'});
  }

  preload() {
    // load assets
    this.load.image('block', 'block.png');
    this.load.image('wall', 'block.png');
    this.load.image('player', 'player.png');
    // this.load.image('bomb', 'bomb.png');
    this.load.image('explosion', 'explosion.png');
  }

  create() {
    // create keys
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // calculate map initial position
    const middleX = ((this.component.width / 2) / 2) * -1;
    const middleY = ((this.component.height / 2) / 3) * -1;

    // define world boundaries
    const worldWidth = 1600;
    const worldHeight = 1200;

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
      'W B B B B B B W',
      'W W W W W W W W',
      'W B B B B B B W',
      'W W W W W W W W',
      'W B B B   B B W',
      'W W W W W W W W',
      'W B B B B B B W',
      'W W W W W W W W',
      'W B B   B B B W',
      'W W W W W W W W',
      'W B B B B B B W',
      'WWWWWWWWWWWWWWW'
    ];

    // const level = [
    //   'WWWWWWWWWWWWWWW',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'W             W',
    //   'WWWWWWWWWWWWWWW'
    // ];


    for (let y = 0; y < level.length; y++) {
      for (let x = 0; x < level[y].length; x++) {
        if (level[y][x] === 'W') {
          const wall = this.walls.create(x * 50, y * 50, 'wall');
          wall.setScale(this.SCALES.wall);
          wall.refreshBody();        // IMPORTANT: update physics body to match scale
        } else if (level[y][x] === 'B') {
          const block = this.blocks.create(x * 50, y * 50, 'block');
          block.setScale(this.SCALES.block);
          block.setTint(0xFFAAAA); // Light red tint to distinguish from walls
          block.refreshBody();
        }
      }
    }

    // Share the group with Angular component
    this.component.walls = this.walls;
    // this.component.bombs = this.bombs;

    // Create the player
    this.player = this.physics.add.sprite(32 + 16, 32 + 16, 'player'); // Center of tile
    this.player.setScale(this.SCALES.player);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player);

    // Enable collisions between player and walls
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.bombs);
    this.physics.add.collider(this.player, this.explosions, this.handlePlayerAndExplosionCollision, undefined, this);
    this.physics.add.collider(this.explosions, this.walls);

    // add collision for explosion destroying block
    // this.physics.add.collider(this.blocks, this.explosions, this.handleDestroyingBlock)

    // Setup cursor keys
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  override update() {
    // game loop
    const speed = 150;
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

  handleDestroyingBlock() {

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
      return distance < 40; // Within 40 pixels (adjust as needed)
    });
  }

  createBomb() {
    const bomb = this.bombs.create(this.player.x, this.player.y, 'bomb')
    bomb.setScale(this.SCALES.bomb);
    bomb.refreshBody();
    this.time.delayedCall(3000, () => {
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
    for (let i = 1; i <= 3; i++) {
      // create horizontal explosion to the right
      const xPos = bomb.x + (bomb.width * i)
      const isRightExplosionCreated = this.createExplosion(xPos, bomb.y);
      if (canExplodeRight) {
        const xPos = bomb.x + (bomb.width * i)
        const isRightExplosionCreated = this.createExplosion(xPos, bomb.y);
        if (!isRightExplosionCreated) {
          canExplodeRight = false;
        }
      }

      // create horizontal explosion to the left
      if (canExplodeLeft) {
        const xPos = bomb.x - (bomb.width * i)
        const isLeftExplosionCreated = this.createExplosion(xPos, bomb.y);
        if (!isLeftExplosionCreated) {
          canExplodeLeft = false;
        }
      }

      // create vertical explosion to up
      if (canExplodeDown) {
        const yPos = bomb.y + (bomb.width * i)
        const isDownExplosionCreated = this.createExplosion(bomb.x, yPos);
        if (!isDownExplosionCreated) {
          canExplodeDown = false;
        }
      }
      // create vertical explosion to down
      if (canExplodeUp) {
        const yPos = bomb.y - (bomb.width * i)
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
      console.log("explosion overlaps wall")
      return false;
    }
    console.log("creating explosion")
    const explosion = this.explosions.create(x, y, 'explosion');
    explosion.setScale(this.SCALES.explosion);
    explosion.refreshBody();
    this.time.delayedCall(1000, () => {
      explosion.destroy();
    })
    return true;
  }

  getIsExplosionPosCollidingWithWall(x: number, y: number) {
    return this.walls.getChildren().find(obj => {
      const wall = obj as Phaser.GameObjects.Sprite;
      return wall.getBounds().contains(x, y);
    });
  }
}
