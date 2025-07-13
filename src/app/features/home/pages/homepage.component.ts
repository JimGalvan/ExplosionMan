import {Component} from '@angular/core';
import Phaser, {Game} from 'phaser';
import {GameScene} from '../../game/game-scene'

@Component({
  selector: 'home-page',
  templateUrl: 'homepage.component.html',
  styles: `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      z-index: 1000;
    }

    #game-container {
      width: 100%;
      height: 100%;
      display: block;
      position: relative;
    }

    #game-container canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
  `
})
export class HomePageComponent {

  walls: any = [];
  game!: Game;
  width!: number;
  height!: number;
  bombs: any = []


  constructor() {
    this.width = document.getElementById('game-container')?.clientWidth ?? 800;
    this.height = document.getElementById('game-container')?.clientHeight ?? 600;
  }

  ngAfterViewInit(): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: new GameScene(this),
      parent: 'game-container',
      input: {
        activePointers: 3 // Allow 3 simultaneous touch inputs
      }
    };

    this.game = new Phaser.Game(config);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.game.scale.resize(window.innerWidth, window.innerHeight);
    });
  }

}
