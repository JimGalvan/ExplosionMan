import Phaser from 'phaser';
import { Player } from '../entities/player';
import { Enemy } from '../entities/enemy';

export class LevelManager {
  private scene: Phaser.Scene;
  private config: any;
  private levelData: string[];

  constructor(scene: Phaser.Scene, config: any) {
    this.scene = scene;
    this.config = config;
    this.levelData = [
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
  }

  public createLevel(
    walls: Phaser.Physics.Arcade.StaticGroup,
    blocks: Phaser.Physics.Arcade.StaticGroup,
    enemies: Phaser.Physics.Arcade.Group
  ): { player: Player | null } {
    let player: Player | null = null;

    for (let y = 0; y < this.levelData.length; y++) {
      for (let x = 0; x < this.levelData[y].length; x++) {
        const tileX = x * this.config.GAME_CONFIG.gridSize;
        const tileY = y * this.config.GAME_CONFIG.gridSize;

        switch (this.levelData[y][x]) {
          case 'W':
            this.createWall(walls, tileX, tileY);
            break;
          case 'B':
            this.createBlock(blocks, tileX, tileY);
            break;
          case 'P':
            player = this.createPlayer(tileX, tileY);
            break;
          case 'E':
            this.createEnemy(enemies, tileX, tileY);
            break;
        }
      }
    }

    return { player };
  }

  private createWall(walls: Phaser.Physics.Arcade.StaticGroup, x: number, y: number): void {
    const wall = walls.create(x, y, 'wall');
    wall.setDisplaySize(this.config.GAME_CONFIG.tileSize, this.config.GAME_CONFIG.tileSize);
    wall.refreshBody();
  }

  private createBlock(blocks: Phaser.Physics.Arcade.StaticGroup, x: number, y: number): void {
    const block = blocks.create(x, y, 'block');
    block.setDisplaySize(this.config.GAME_CONFIG.tileSize, this.config.GAME_CONFIG.tileSize);
    block.setTint(0xFFAAAA);
    block.refreshBody();
  }

  private createPlayer(x: number, y: number): Player {
    const playerX = x * this.config.GAME_CONFIG.playerStartX / this.config.GAME_CONFIG.gridSize;
    const playerY = y * this.config.GAME_CONFIG.playerStartY / this.config.GAME_CONFIG.gridSize;
    return new Player(this.scene, playerX, playerY, this.config);
  }

  private createEnemy(enemies: Phaser.Physics.Arcade.Group, x: number, y: number): void {
    const enemy = new Enemy(this.scene, x, y, this.config);
    enemies.add(enemy.getSprite());
  }
}