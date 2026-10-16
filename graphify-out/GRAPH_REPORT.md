# Graph Report - volta-servidor  (2026-10-16)

## Corpus Check
- 83 files · ~111,393 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .glb 16, .xml 10, (none) 3)

## Summary
- 1124 nodes · 2269 edges · 61 communities (48 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1eaf8341`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- world.js
- main.js
- Three.js Textures
- hands.js
- Three.js Shaders
- objects.js
- Three.js Loaders
- phone.js
- textures.js
- Three.js Interaction
- Common Effects
- panels.js
- Three.js Lighting
- hud.js
- Three.js Animation
- Three.js Geometry
- Three.js Fundamentals
- Three.js Materials
- index.js
- economy.js
- sky.js
- forum.js
- time.js
- juego/package.json
- human.js
- police.js
- models.js
- cars.js
- Three.js Skills for Claude Code
- mock-server.js
- Walker
- npc.js
- routes/auth.js
- NPC
- db.js
- ws.js
- ExampleInstrumentedTest.java
- volta-api.js
- dependencies
- friends.js
- users.js
- with_server.py
- Web Application Testing
- BLOQUE 9 · Puerto Lomas
- middleware/auth.js
- Frontend Design
- state.js
- VOLTA · Backend social (Node.js + Express + PostgreSQL)
- moderation.js
- scripts
- com.getcapacitor.BridgeActivity
- CLAUDE.md
- .claude/CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `sfx` - 43 edges
2. `addBox()` - 37 edges
3. `createWorld()` - 31 edges
4. `G` - 22 edges
5. `money()` - 22 edges
6. `Three.js Materials` - 21 edges
7. `save()` - 19 edges
8. `rng()` - 19 edges
9. `startGame()` - 18 edges
10. `mk()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `spawnLeo()` --calls--> `sfx`  [EXTRACTED]
  juego/src/main.js → juego/src/core/audio.js
- `acceptDeal()` --calls--> `sfx`  [EXTRACTED]
  juego/src/systems/economy.js → juego/src/core/audio.js
- `deadDropActions()` --calls--> `sfx`  [EXTRACTED]
  juego/src/systems/economy.js → juego/src/core/audio.js
- `sendMsg()` --calls--> `sfx`  [EXTRACTED]
  juego/src/systems/economy.js → juego/src/core/audio.js
- `actionsFor()` --calls--> `sfx`  [EXTRACTED]
  juego/src/systems/objects.js → juego/src/core/audio.js

## Import Cycles
- None detected.

## Communities (61 total, 13 thin omitted)

### Community 0 - "world.js"
Cohesion: 0.06
Nodes (86): Nav, addBox(), asphalt(), bench(), billboard(), buildBeach(), buildBoxes(), buildBulbs() (+78 more)

### Community 1 - "main.js"
Cohesion: 0.06
Nodes (63): initAudio(), pollInput(), hasSave(), load(), newState(), wipe(), autoQuality(), boot() (+55 more)

### Community 2 - "Three.js Textures"
Cohesion: 0.04
Nodes (44): Accessing UVs, Background Options, Basic Loading, Canvas Texture, Color Space, Compressed Textures, Cube Textures, CubeCamera (+36 more)

### Community 3 - "hands.js"
Cohesion: 0.09
Nodes (20): applyHandLook(), budCluster(), buildItem(), bx(), capG, cardMat(), curl(), handMats (+12 more)

### Community 4 - "Three.js Shaders"
Cohesion: 0.06
Nodes (33): Common Injection Points, Common Material Properties, Common Shader Patterns, Debugging Shaders, Dissolve Effect, Extending Built-in Materials, External Shader Files, Fresnel Effect (+25 more)

### Community 5 - "objects.js"
Cohesion: 0.10
Nodes (33): slotsCount(), randi(), actionsFor(), BUILD, bx, cyl, cylTaper, FOOT (+25 more)

### Community 6 - "Three.js Loaders"
Cohesion: 0.06
Nodes (32): ArrayBuffer, Async/Promise Loading, Blob URL, Built-in Cache, Caching, CubeTextureLoader, Custom Asset Manager, Custom Path/URL (+24 more)

### Community 7 - "phone.js"
Cohesion: 0.16
Nodes (31): customer(), rejectDeal(), clock(), dayName(), clearWaypoint(), getWaypoint(), setWaypoint(), updateHUD() (+23 more)

### Community 8 - "textures.js"
Cohesion: 0.18
Nodes (30): asphaltTex(), billboardTex(), blotches(), cardboardTex(), carpetTex(), chainTex(), clipboardTex(), concreteTex() (+22 more)

### Community 9 - "Three.js Interaction"
Cohesion: 0.07
Nodes (29): Basic Raycasting, Box Selection, Camera Controls, Click to Select, DragControls, Efficient Raycasting, Event Handling Best Practices, FirstPersonControls (+21 more)

### Community 10 - "Common Effects"
Cohesion: 0.07
Nodes (28): Bloom (Glow), Chromatic Aberration, Color Correction, Combining Multiple Effects, Common Effects, Custom ShaderPass, Depth of Field (DOF), EffectComposer Setup (+20 more)

### Community 11 - "panels.js"
Cohesion: 0.25
Nodes (27): sfx, clamp(), money(), addXP(), completeDeal(), giveSample(), product(), prodValue() (+19 more)

### Community 12 - "Three.js Lighting"
Cohesion: 0.07
Nodes (27): AmbientLight, Common Lighting Setups, Contact Shadows (Fake, Fast), Cube Texture Environment, DirectionalLight, DirectionalLight Shadows, Enable Shadows, Environment Lighting (IBL) (+19 more)

### Community 13 - "hud.js"
Cohesion: 0.13
Nodes (17): initInput(), input, keys, moveJoy(), resetJoyEl(), resetTouch(), QUESTS, emit() (+9 more)

### Community 14 - "Three.js Animation"
Cohesion: 0.07
Nodes (26): Additive Blending, Animating Morph Targets, Animation Blending, Animation System Overview, Animation Utilities, AnimationAction, AnimationClip, AnimationMixer (+18 more)

### Community 15 - "Three.js Geometry"
Cohesion: 0.07
Nodes (26): Advanced Shapes, Basic Shapes, BufferAttribute Types, BufferGeometry, Built-in Geometries, Center Geometry, Clone and Transform, Common Patterns (+18 more)

### Community 16 - "Three.js Fundamentals"
Cohesion: 0.08
Nodes (24): Cameras, Clock for Animation, Color, Common Patterns, Coordinate System, Core Classes, Euler, Group (+16 more)

### Community 17 - "Three.js Materials"
Cohesion: 0.08
Nodes (24): Built-in Uniforms (auto-provided), Car Paint Example, Common Material Properties, Environment Maps, Glass Material Example, LineBasicMaterial & LineDashedMaterial, Material Cloning and Modification, Material Types Overview (+16 more)

### Community 18 - "index.js"
Cohesion: 0.09
Nodes (23): description, engines, node, main, name, private, version, bcrypt (+15 more)

### Community 19 - "economy.js"
Cohesion: 0.15
Nodes (20): EFFECTS, INGREDIENTS, MAX_EFFECTS, mixEffects(), N1, N2, productKey(), productValue() (+12 more)

### Community 20 - "sky.js"
Cohesion: 0.11
Nodes (17): _c, _e, GEO, LIT, _m, MAT, _p, _q (+9 more)

### Community 21 - "forum.js"
Cohesion: 0.13
Nodes (18): ah(), HttpError, config, { HttpError }, { pool }, postCooldown(), secondsLeft(), tooFast() (+10 more)

### Community 22 - "time.js"
Cohesion: 0.23
Nodes (21): absNow(), save(), pick(), acceptDeal(), addMoney(), counterDeal(), deadDropActions(), makeDeal() (+13 more)

### Community 23 - "juego/package.json"
Cohesion: 0.10
Nodes (19): dependencies, @capacitor/android, @capacitor/core, three, devDependencies, @capacitor/cli, vite, name (+11 more)

### Community 24 - "human.js"
Cohesion: 0.14
Nodes (16): G_, HAIRS, makeHuman(), h, markerTex, mat(), matCache, mesh() (+8 more)

### Community 25 - "police.js"
Cohesion: 0.19
Nodes (17): setSiren(), illegalCount(), CUSTOMER_LINES, GREETINGS, OFFICERS, PEOPLE, STARTING_CUSTOMERS, rand() (+9 more)

### Community 26 - "models.js"
Cohesion: 0.13
Nodes (13): BONE, CLIPS, clipsFor(), files, findSkin(), loadModels(), makeRealHuman(), h (+5 more)

### Community 27 - "cars.js"
Cohesion: 0.15
Nodes (13): box, Car, carMat(), carMats, glassMat, glowMat(), glowMats, laneLoop() (+5 more)

### Community 28 - "Three.js Skills for Claude Code"
Cohesion: 0.12
Nodes (15): Acknowledgments, Basic Scene Setup, Contributing, Custom Shaders, How It Works, Installation, License, Loading 3D Models (+7 more)

### Community 29 - "mock-server.js"
Cohesion: 0.16
Nodes (13): crypto, frame(), friends, hb, http, lastPost, posts, pub() (+5 more)

### Community 30 - "Walker"
Cohesion: 0.28
Nodes (4): markerSprite(), Cop, Walker, spawnPolice()

### Community 31 - "npc.js"
Cohesion: 0.25
Nodes (13): modelNames(), MODELS, hitGeo, hitMat, LEO_MODEL, choices(), FEMALE_NAMES, lookFor() (+5 more)

### Community 32 - "routes/auth.js"
Cohesion: 0.14
Nodes (12): { ah, HttpError }, authLimiter, bcrypt, config, loginSchema, { query }, rateLimit, registerSchema (+4 more)

### Community 33 - "NPC"
Cohesion: 0.21
Nodes (3): randomLook(), NPC, prop()

### Community 34 - "db.js"
Cohesion: 0.17
Nodes (7): pg, fs, path, { pool }, config, config, { Pool }

### Community 35 - "ws.js"
Cohesion: 0.22
Nodes (12): ws, shutdown(), allowedOrigin(), attach(), broadcast(), close(), config, send() (+4 more)

### Community 37 - "volta-api.js"
Cohesion: 0.27
Nodes (6): http(), login(), logout(), register(), respondFriend(), setToken()

### Community 38 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+3 more)

### Community 39 - "friends.js"
Cohesion: 0.20
Nodes (10): zod, query(), tx(), { ah, HttpError }, { query, tx }, { requireAuth }, respondSchema, router (+2 more)

### Community 40 - "users.js"
Cohesion: 0.20
Nodes (9): express-rate-limit, { ah, HttpError }, checkLimiter, { query }, rateLimit, { requireAuth }, router, VMOD (+1 more)

### Community 42 - "Web Application Testing"
Cohesion: 0.25
Nodes (7): Best Practices, Common Pitfall, Decision Tree: Choosing Your Approach, Example: Using with_server.py, Reconnaissance-Then-Action Pattern, Reference Files, Web Application Testing

### Community 43 - "BLOQUE 9 · Puerto Lomas"
Cohesion: 0.25
Nodes (7): Android (Play Store), BLOQUE 9 · Puerto Lomas, Estructura, Habilidades de Claude Code instaladas, Personajes, Probarlo, Qué incluye esta versión

### Community 44 - "middleware/auth.js"
Cohesion: 0.29
Nodes (7): jsonwebtoken, config, { HttpError }, jwt, requireAuth(), sign(), verify()

### Community 45 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 46 - "state.js"
Cohesion: 0.38
Nodes (6): inv, INV_SIZE, same(), slotsAdd(), slotsRemove(), slotsRoom()

### Community 47 - "VOLTA · Backend social (Node.js + Express + PostgreSQL)"
Cohesion: 0.29
Nodes (6): 1. Puesta en marcha, 2. Endpoints, 3. Integración desde `index.html`, 4. Seguridad: lo que hay y lo que debes saber, 5. Integración ya hecha en `Volta-5.html`, VOLTA · Backend social (Node.js + Express + PostgreSQL)

### Community 49 - "moderation.js"
Cohesion: 0.70
Nodes (4): base(), hit(), username(), variants()

### Community 51 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, dev, migrate, start

## Knowledge Gaps
- **4 isolated node(s):** `@capacitor/android`, `@capacitor/core`, `@capacitor/cli`, `dotenv`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 541 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `npc.js` to `world.js`, `main.js`, `hands.js`, `objects.js`, `textures.js`, `hud.js`, `sky.js`, `juego/package.json`, `human.js`, `models.js`, `cars.js`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `createWorld()` (e.g. with `addBox()` and `inProperty()`) actually correct?**
  _`createWorld()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@capacitor/android`, `@capacitor/core`, `@capacitor/cli` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `world.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06030855539971949 - nodes in this community are weakly interconnected._
- **Why does `G` connect `hud.js` to `world.js`, `main.js`, `hands.js`, `objects.js`, `phone.js`, `panels.js`, `state.js`, `economy.js`, `sky.js`, `time.js`, `police.js`, `cars.js`, `npc.js`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05583972719522592 - nodes in this community are weakly interconnected._
- **Should `Three.js Textures` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._