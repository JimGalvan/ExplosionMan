import Phaser from 'phaser';
import { Player } from '../entities/player';
import { Enemy } from '../entities/enemy';

export class CollisionManager {
  private scene: Phaser.Scene;
  private onPlayerDeath: () => void;

  constructor(scene: Phaser.Scene, onPlayerDeath: () => void) {
    this.scene = scene;
    this.onPlayerDeath = onPlayerDeath;
  }

  public setupCollisions(
    player: Player,
    enemies: Phaser.Physics.Arcade.Group,
    walls: Phaser.Physics.Arcade.StaticGroup,
    blocks: Phaser.Physics.Arcade.StaticGroup,
    bombs: Phaser.Physics.Arcade.StaticGroup,
    explosions: Phaser.Physics.Arcade.StaticGroup
  ): void {
    // Player collisions
    this.scene.physics.add.collider(player.getSprite(), walls);
    this.scene.physics.add.collider(player.getSprite(), bombs);
    this.scene.physics.add.collider(player.getSprite(), blocks);
    this.scene.physics.add.collider(player.getSprite(), enemies);
    this.scene.physics.add.collider(player.getSprite(), explosions, this.handlePlayerExplosionCollision, undefined, this);

    // Enemy collisions
    this.scene.physics.add.collider(enemies, blocks, this.handleEnemyBlockCollision, undefined, this);
    this.scene.physics.add.collider(enemies, walls, this.handleEnemyWallCollision, undefined, this);

    // Environment collisions
    this.scene.physics.add.collider(explosions, walls);
  }

  private handlePlayerExplosionCollision = (): void => {
    this.onPlayerDeath();
  };

  private handleEnemyBlockCollision = (enemy: any, block: any): void => {
    // Enemy block collision logic can be added here if needed
  };

  private handleEnemyWallCollision = (enemySprite: any, wall: any): void => {
    // Create a temporary Enemy instance to handle collision logic
    const enemyHandler = new Enemy(this.scene, enemySprite.x, enemySprite.y, {
      SCALES: { enemy: enemySprite.scaleX }
    });
    enemyHandler.sprite = enemySprite;
    enemyHandler.handleWallCollision(wall);
  };
}