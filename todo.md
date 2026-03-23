# Mini Militia Game - TODO

## Core Game Engine
- [x] Canvas rendering and game loop
- [x] 2D physics engine (gravity, collision detection, movement)
- [x] Player entity system with health and state management
- [ ] Particle effects system

## Controls & Input
- [x] Dual virtual joystick implementation (left for movement, right for aiming)
- [x] Touch event handling and mobile optimization
- [x] Joystick visual feedback and responsiveness

## Weapons System
- [x] Weapon types: Pistol, Rifle, Shotgun, Sniper
- [x] Weapon damage, fire rate, and ammo mechanics
- [x] Bullet physics and collision detection
- [x] Weapon switching and ammo management
- [ ] Dual-wield mechanics

## Player Mechanics
- [x] Health system and damage calculation
- [x] Respawn mechanics with invincibility frames
- [x] Kill/death tracking and scoring
- [x] Jetpack/flight mechanics with fuel system

## Multiplayer Networking
- [x] WebSocket server setup for local Wi-Fi multiplayer
- [x] Host/join lobby system
- [x] Player synchronization and state updates
- [x] Network message protocol and serialization

## Game Modes
- [x] Deathmatch (Free for All)
- [x] Team Deathmatch (Red vs Blue)
- [x] Capture the Flag (CTF)
- [x] Survival mode

## Maps
- [x] Base map (military compound)
- [x] Lava map (instant death floor)
- [x] Space map (low gravity)

## UI & HUD
- [x] Real-time HUD display (health, ammo, weapon, K/D)
- [x] Minimap with player positions
- [ ] Kill feed
- [x] Score/timer display
- [x] Lobby screen with player list
- [x] Match settings configuration UI
- [x] Game over screen with results

## Mobile Optimization
- [ ] Responsive UI for all screen sizes
- [ ] Touch-friendly controls and buttons
- [ ] Performance optimization for mobile devices
- [ ] Viewport and orientation handling

## Testing & Polish
- [ ] Gameplay testing and bug fixes
- [ ] Performance optimization
- [ ] Visual polish and feedback
- [ ] Cross-device testing

## Kill Feed System
- [ ] Kill feed data structure and event tracking
- [ ] Kill feed UI component with fade-out animation
- [ ] Support for different kill types (normal, headshot, explosion, melee)
- [ ] Team color coding for kill feed entries
- [ ] Flag event tracking for CTF mode
- [ ] Player elimination count for Survival mode

## Sound Effects & Music
- [ ] Audio manager and sound loading system
- [ ] Weapon sound effects (rifle, shotgun, sniper, pistol)
- [ ] Hit and impact sounds (bullet hits, explosions, melee)
- [ ] Player action sounds (jetpack, landing, pickup, respawn)
- [ ] Game event sounds (match start, kill confirm, multi-kill, match end)
- [ ] Background music system with map-specific tracks
- [ ] Audio settings panel (master volume, SFX volume, music volume)
- [ ] Spatial audio / stereo panning for directional sound
- [ ] Vibration/haptics feedback on mobile
