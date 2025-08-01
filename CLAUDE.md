# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `ng serve` or `npm start`
- **Build for production**: `ng build`
- **Run tests**: `ng test`
- **Watch build**: `ng build --watch --configuration development`
- **Generate components**: `ng generate component component-name`

The development server runs on `http://localhost:4200/` with automatic reloading.

## Architecture Overview

This is an Angular 20 + Phaser 3 maze game application with the following structure:

### Core Architecture
- **Angular Framework**: Uses standalone components (no modules) with Angular 20
- **Game Engine**: Phaser 3.90.0 for 2D game rendering and physics
- **Physics**: Arcade physics system for collision detection and movement
- **Responsive Design**: Full viewport game with mobile touch controls

### Key Components
- `HomePageComponent` (`src/app/features/home/pages/homepage.component.ts`): Main game container that initializes Phaser game instance
- `GameScene` (`src/app/features/game/game-scene.ts`): Primary Phaser scene orchestrating game managers
- `MobileButtonManager` (`src/app/features/game/mobile-button-manager.ts`): Touch controls for mobile devices
- `GameUtils` (`src/app/game-utils.ts`): Shared utility functions for game mechanics

### Game Entity Classes
- `Player` (`src/app/features/game/entities/player.ts`): Player character with movement and input handling
- `Enemy` (`src/app/features/game/entities/enemy.ts`): Enemy entities with AI collision behavior
- `Bomb` (`src/app/features/game/entities/bomb.ts`): Bomb entities with timer and explosion callbacks
- `Explosion` (`src/app/features/game/entities/explosion.ts`): Explosion effects with block destruction logic

### Game Managers
- `CollisionManager` (`src/app/features/game/managers/collision-manager.ts`): Handles all physics collisions between entities
- `LevelManager` (`src/app/features/game/managers/level-manager.ts`): Creates and manages game levels from string maps
- `UIManager` (`src/app/features/game/managers/ui-manager.ts`): Handles game over dialogs and UI elements
- `ExplosionManager` (`src/app/features/game/managers/explosion-manager.ts`): Manages bomb explosions and chain reactions

### Game System Design
The game follows a modular OOP architecture where:
- **GameScene** acts as the main orchestrator, delegating responsibilities to specialized managers
- **Entity Classes** encapsulate game object behavior and state
- **Manager Classes** handle cross-cutting concerns like collisions, UI, and level management
- **Physics Groups**: Static groups for walls/blocks/bombs/explosions, dynamic group for enemies
- **Mobile Input**: Parallel input system supporting both keyboard and touch controls

### Asset Management
- All game sprites located in `public/` directory
- Assets loaded in `GameScene.preload()` method
- Consistent scaling system defined in `SCALES` configuration object

### Game Configuration
The game uses centralized configuration objects:
- `SCALES`: Visual scaling for all sprites
- `TIMINGS`: Animation and game timing constants  
- `GAME_CONFIG`: Core gameplay parameters (speed, grid size, physics bounds)

### State Management
- Game state distributed across entity classes and managers
- Mobile input state tracked in `mobileInput` object within GameScene
- Entity lifecycle managed through dedicated classes with proper cleanup
- Manager pattern separates concerns and improves maintainability

## Code Patterns

- Use TypeScript strict typing throughout with interface segregation
- Phaser objects typed with specific Phaser types (e.g., `Phaser.Types.Physics.Arcade.SpriteWithDynamicBody`)
- Configuration objects centralized in GameScene for easy modification
- Entity classes follow single responsibility principle
- Manager classes handle cross-cutting concerns
- Collision detection delegated to CollisionManager with type-safe callbacks
- Asset paths are relative to `public/` directory
- Dependency injection pattern used for passing dependencies between classes

## Testing & Build Notes

- Tests run with Karma + Jasmine
- No end-to-end testing framework currently configured
- Production builds optimize for performance and bundle size
- Debug physics enabled in development mode (`arcade.debug: true`)