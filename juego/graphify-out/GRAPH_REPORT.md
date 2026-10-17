# Graph Report - juego  (2026-10-17)

## Corpus Check
- 73 files · ~108,589 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 51 file(s) not represented in the graph (top: .glb 22, .xml 10, (none) 6)

## Summary
- 966 nodes · 2950 edges · 40 communities (27 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5af382f2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- panels.js
- three
- world.js
- dressing.js
- objects.js
- sky.js
- vehicles.spec.js
- riding.js
- main.js
- cars.js
- textures.js
- package.json
- game.js
- AppDelegate
- BLOQUE 9 · Puerto Lomas
- human.js
- models.js
- render.js
- icons.js
- audio.js
- hud.js
- police.js
- Walker
- ExampleInstrumentedTest.java
- time.js
- npc.js
- creator.js
- NPC
- layout.js
- MainActivity.java
- Package.swift
- CapApp-SPM/README.md

## God Nodes (most connected - your core abstractions)
1. `three` - 133 edges
2. `sfx` - 68 edges
3. `addBox()` - 39 edges
4. `createWorld()` - 33 edges
5. `openNpc()` - 29 edges
6. `save()` - 28 edges
7. `money()` - 27 edges
8. `G` - 26 edges
9. `three` - 25 edges
10. `clamp()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `1. Motor y arquitectura` --references--> `runAction()`  [INFERRED]
  docs/MOVIL.md → src/systems/interact.js
- `torsoGeo()` --references--> `three`  [EXTRACTED]
  src/entities/human.js → package.json
- `accMat()` --references--> `three`  [EXTRACTED]
  src/entities/avatar.js → package.json
- `analyze()` --references--> `three`  [EXTRACTED]
  src/entities/avatar.js → package.json
- `buildAccessory()` --references--> `three`  [EXTRACTED]
  src/entities/avatar.js → package.json

## Import Cycles
- None detected.

## Communities (40 total, 13 thin omitted)

### Community 0 - "panels.js"
Cohesion: 0.06
Nodes (125): sfx, guardGhostClick(), resetTouch(), absNow(), save(), slotsAdd(), EFFECTS, productValue() (+117 more)

### Community 1 - "three"
Cohesion: 0.06
Nodes (91): three, BAG, bud(), budGeometry(), budMat(), budPile(), cache, cashStack() (+83 more)

### Community 2 - "world.js"
Cohesion: 0.06
Nodes (95): rand(), Nav, addProp(), propSize(), propsReady(), addBox(), asphalt(), bench() (+87 more)

### Community 3 - "dressing.js"
Cohesion: 0.08
Nodes (56): BEARDS, CLOTHES, HAIR_COLORS, RECOG_MINUTES, RECOG_WEIGHTS, SLOTS, accMat(), analyze() (+48 more)

### Community 4 - "objects.js"
Cohesion: 0.07
Nodes (44): @capacitor/preferences, backup(), inv, INV_SIZE, migrate(), native(), restoreBackup(), same() (+36 more)

### Community 5 - "sky.js"
Cohesion: 0.06
Nodes (32): setCarLights(), _c, _e, GEO, LIT, _m, MAT, _p (+24 more)

### Community 6 - "vehicles.spec.js"
Cohesion: 0.16
Nodes (28): gl, @playwright/test, count(), slotOf(), act(), drag(), ev(), frames() (+20 more)

### Community 7 - "riding.js"
Cohesion: 0.11
Nodes (34): PARKING, RECOVER_PRICE, VEHICLES, bendPose(), clearPose(), buildBike(), buildScooter(), chrome() (+26 more)

### Community 8 - "main.js"
Cohesion: 0.11
Nodes (31): pollInput(), hasSave(), load(), newState(), autoQuality(), boot(), camera, clerks (+23 more)

### Community 9 - "cars.js"
Cohesion: 0.09
Nodes (29): box, Car, carMat(), carMats, glassMat, glowMat(), glowMats, laneLoop() (+21 more)

### Community 10 - "textures.js"
Cohesion: 0.18
Nodes (30): asphaltTex(), billboardTex(), blotches(), cardboardTex(), carpetTex(), chainTex(), clipboardTex(), concreteTex() (+22 more)

### Community 11 - "package.json"
Cohesion: 0.08
Nodes (22): dependencies, @capacitor/android, @capacitor/core, @capacitor/ios, @capacitor/preferences, devDependencies, @capacitor/cli, @playwright/test (+14 more)

### Community 12 - "game.js"
Cohesion: 0.14
Nodes (13): three, initInput(), input, keys, moveJoy(), resetJoyEl(), G, listeners (+5 more)

### Community 13 - "AppDelegate"
Cohesion: 0.13
Nodes (3): Capacitor, AppDelegate, UIKit

### Community 14 - "BLOQUE 9 · Puerto Lomas"
Cohesion: 0.10
Nodes (18): 1. Motor y arquitectura, 2. Controles táctiles (ya existían; se conservan), 3. Pruebas automáticas (referencia del comportamiento actual), 4. Compilación, 5. Rendimiento en móvil (lo que ya hace el juego), Android — estado: proyecto listo, compilación BLOQUEADA en este entorno, Bloque 9 en Android e iPhone: estado real, iOS — estado: proyecto generado, compilación imposible aquí (+10 more)

### Community 15 - "human.js"
Cohesion: 0.14
Nodes (17): G_, HAIRS, makeHuman(), h, markerTex, mat(), matCache, mesh() (+9 more)

### Community 16 - "models.js"
Cohesion: 0.13
Nodes (14): BONE, CLIPS, clipsFor(), files, findSkin(), loadModels(), makeRealHuman(), h (+6 more)

### Community 17 - "render.js"
Cohesion: 0.12
Nodes (13): Player, buildWorld(), resize(), applyQuality(), buildComposer(), GradeShader, initRender(), _q (+5 more)

### Community 18 - "icons.js"
Cohesion: 0.22
Nodes (18): banknote(), bud(), cache, crystalCluster(), DRAW, f(), GEM, iconSVG() (+10 more)

### Community 19 - "audio.js"
Cohesion: 0.16
Nodes (13): amb, audioStatus(), BUF, files, initAudio(), loadSounds(), loopSrc(), play() (+5 more)

### Community 20 - "hud.js"
Cohesion: 0.19
Nodes (16): on(), RECOG_LEVEL, CONTACTS, curfew(), ridingInfo(), dayName(), bigToast(), clearWaypoint() (+8 more)

### Community 21 - "police.js"
Cohesion: 0.30
Nodes (14): setSiren(), illegalCount(), recognition(), rememberIncident(), signature(), similarity(), arrest(), cooperate() (+6 more)

### Community 22 - "Walker"
Cohesion: 0.31
Nodes (3): markerSprite(), Cop, Walker

### Community 24 - "time.js"
Cohesion: 0.32
Nodes (11): simulateObjects(), resetPolice(), wanted, advanceTime(), canSleep(), checkQuests(), DAYS, newDay() (+3 more)

### Community 25 - "npc.js"
Cohesion: 0.22
Nodes (6): randomLook(), MODELS, hitGeo, hitMat, LEO_MODEL, prop()

### Community 26 - "creator.js"
Cohesion: 0.44
Nodes (8): modelNames(), choices(), FEMALE_NAMES, lookFor(), MALE_NAMES, openCreator(), pick(), randomPlayerLook()

### Community 28 - "layout.js"
Cohesion: 0.62
Nodes (6): applyLayout(), CONTROLS, el(), fitHud(), openLayoutEditor(), settings()

## Knowledge Gaps
- **7 isolated node(s):** `UIKit`, `Capacitor`, `PackageDescription`, `@capacitor/android`, `@capacitor/core` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 234 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `game.js` to `three`, `world.js`, `dressing.js`, `objects.js`, `sky.js`, `riding.js`, `main.js`, `cars.js`, `textures.js`, `package.json`, `human.js`, `models.js`, `render.js`, `npc.js`, `creator.js`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `createWorld()` (e.g. with `addBox()` and `inProperty()`) actually correct?**
  _`createWorld()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UIKit`, `Capacitor`, `PackageDescription` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `panels.js` be split into smaller, more focused modules?**
  _Cohesion score 0.060487038491751764 - nodes in this community are weakly interconnected._
- **Why does `three` connect `three` to `world.js`, `dressing.js`, `objects.js`, `sky.js`, `riding.js`, `main.js`, `cars.js`, `textures.js`, `package.json`, `human.js`, `models.js`, `render.js`, `Walker`, `creator.js`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `three` be split into smaller, more focused modules?**
  _Cohesion score 0.05881254667662435 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `vehicles.spec.js` to `package.json`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._