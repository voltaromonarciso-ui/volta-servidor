# Graph Report - volta-servidor  (2026-10-18)

## Corpus Check
- 164 files · ~225,586 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 55 file(s) not represented in the graph (top: .glb 22, (none) 10, .xml 10)

## Summary
- 2017 nodes · 4513 edges · 114 communities (95 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `48133f65`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- world.js
- main.js
- Three.js Textures
- money.js
- Three.js Shaders
- objects.js
- Three.js Loaders
- render
- textures.js
- Three.js Interaction
- Common Effects
- AppDelegate
- Three.js Lighting
- dressing.js
- Three.js Animation
- Three.js Geometry
- Three.js Fundamentals
- Three.js Materials
- index.js
- Package.swift
- hands.js
- forum.js
- CapApp-SPM/README.md
- juego/package.json
- human.js
- models.js
- cars.js
- Three.js Skills for Claude Code
- mock-server.js
- panels.js
- creator.js
- routes/auth.js
- common.sh
- db.js
- ws.js
- ExampleInstrumentedTest.java
- volta-api.js
- economy.js
- friends.js
- three
- with_server.py
- Web Application Testing
- BLOQUE 9 · Puerto Lomas
- render.js
- Frontend Design
- Tasks: [FEATURE NAME]
- VOLTA · Backend social (Node.js + Express + PostgreSQL)
- moderation.js
- time.js
- com.getcapacitor.BridgeActivity
- CLAUDE.md
- .claude/CLAUDE.md
- speckit-analyze/SKILL.md
- generator_template.js
- Creation Log: Systematic Debugging Skill
- algorithmic-art/SKILL.md
- riding.js
- audio.js
- interact.js
- Root Cause Tracing
- Systematic Debugging
- addBox
- core.spec.js
- systems/staff.js
- Feature Specification: [FEATURE NAME]
- Defense-in-Depth Validation
- speckit-plan/SKILL.md
- speckit-specify/SKILL.md
- speckit-tasks/SKILL.md
- Core Principles
- Core Principles
- Verification Before Completion
- buildShops
- Implementation Plan: [FEATURE]
- speckit-checklist/SKILL.md
- speckit-clarify/SKILL.md
- speckit-implement/SKILL.md
- Condition-Based Waiting
- Nav
- speckit-constitution/SKILL.md
- speckit-taskstoissues/SKILL.md
- Pressure Test 1: Emergency Production Fix
- Pressure Test 2: Sunk Cost + Exhaustion
- Pressure Test 3: Authority + Social Pressure
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- find-polluter.sh
- test-academic.md
- props.js
- Walker
- sky.js
- building
- station.js
- icons.js
- Execution Steps
- dependencies
- hud.js
- input.js
- state.js
- layout.js
- benches.js
- police.js
- scripts
- ViewModel
- entities/vehicles.js
- actionsFor

## God Nodes (most connected - your core abstractions)
1. `three` - 135 edges
2. `sfx` - 75 edges
3. `absNow()` - 43 edges
4. `addBox()` - 40 edges
5. `save()` - 38 edges
6. `ev()` - 37 edges
7. `createWorld()` - 33 edges
8. `money()` - 30 edges
9. `openNpc()` - 29 edges
10. `G` - 27 edges

## Surprising Connections (you probably didn't know these)
- `When to Use` --references--> `sleep()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → juego/src/systems/time.js
- `Dinero sucio y limpio (Bloque B, etapa 1): reglas` --references--> `load()`  [INFERRED]
  juego/docs/MOVIL.md → juego/src/core/state.js
- `Implementation` --references--> `waitForEvent()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts
- `Implementation` --references--> `waitForEventCount()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts
- `Implementation` --references--> `waitForEventMatch()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts

## Import Cycles
- None detected.

## Communities (114 total, 19 thin omitted)

### Community 0 - "world.js"
Cohesion: 0.09
Nodes (36): buildBeach(), buildBoxes(), buildBulbs(), buildGround(), buildMountains(), buildNav(), buildRoadDetails(), buildRoads() (+28 more)

### Community 1 - "main.js"
Cohesion: 0.10
Nodes (33): hasSave(), load(), newState(), autoQuality(), boot(), camera, clerks, clock (+25 more)

### Community 2 - "Three.js Textures"
Cohesion: 0.04
Nodes (44): Accessing UVs, Background Options, Basic Loading, Canvas Texture, Color Space, Compressed Textures, Cube Textures, CubeCamera (+36 more)

### Community 3 - "money.js"
Cohesion: 0.22
Nodes (17): ACCOUNTS, apply(), check(), ensure(), fail(), KEY_DAYS, KEY_MAX, keyUsed() (+9 more)

### Community 4 - "Three.js Shaders"
Cohesion: 0.06
Nodes (33): Common Injection Points, Common Material Properties, Common Shader Patterns, Debugging Shaders, Dissolve Effect, Extending Built-in Materials, External Shader Files, Fresnel Effect (+25 more)

### Community 5 - "objects.js"
Cohesion: 0.10
Nodes (31): BUILD, bx, cancelMove(), cancelPlacement(), canPlace(), COOK_MIN, COOK_OUT, cyl (+23 more)

### Community 6 - "Three.js Loaders"
Cohesion: 0.06
Nodes (32): ArrayBuffer, Async/Promise Loading, Blob URL, Built-in Cache, Caching, CubeTextureLoader, Custom Asset Manager, Custom Path/URL (+24 more)

### Community 7 - "render"
Cohesion: 0.19
Nodes (18): setWaypoint(), APPS, back(), closePhone(), deliveries(), go(), h(), home() (+10 more)

### Community 8 - "textures.js"
Cohesion: 0.16
Nodes (31): randomLook(), asphaltTex(), billboardTex(), blotches(), cardboardTex(), carpetTex(), chainTex(), clipboardTex() (+23 more)

### Community 9 - "Three.js Interaction"
Cohesion: 0.07
Nodes (29): Basic Raycasting, Box Selection, Camera Controls, Click to Select, DragControls, Efficient Raycasting, Event Handling Best Practices, FirstPersonControls (+21 more)

### Community 10 - "Common Effects"
Cohesion: 0.07
Nodes (28): Bloom (Glow), Chromatic Aberration, Color Correction, Combining Multiple Effects, Common Effects, Custom ShaderPass, Depth of Field (DOF), EffectComposer Setup (+20 more)

### Community 11 - "AppDelegate"
Cohesion: 0.13
Nodes (3): Capacitor, AppDelegate, UIKit

### Community 12 - "Three.js Lighting"
Cohesion: 0.07
Nodes (27): AmbientLight, Common Lighting Setups, Contact Shadows (Fake, Fast), Cube Texture Environment, DirectionalLight, DirectionalLight Shadows, Enable Shadows, Environment Lighting (IBL) (+19 more)

### Community 13 - "dressing.js"
Cohesion: 0.07
Nodes (59): guardGhostClick(), BEARDS, CLOTHES, HAIR_COLORS, RECOG_MINUTES, RECOG_WEIGHTS, SLOTS, accMat() (+51 more)

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
Nodes (24): description, engines, node, main, name, private, version, bcrypt (+16 more)

### Community 20 - "hands.js"
Cohesion: 0.11
Nodes (25): budPile(), crystalCluster(), seedPile(), applyHandLook(), buildItem(), bx(), capG, cardMat() (+17 more)

### Community 21 - "forum.js"
Cohesion: 0.13
Nodes (18): query(), tx(), config, { HttpError }, { pool }, postCooldown(), secondsLeft(), tooFast() (+10 more)

### Community 23 - "juego/package.json"
Cohesion: 0.08
Nodes (22): dependencies, @capacitor/android, @capacitor/core, @capacitor/ios, @capacitor/preferences, devDependencies, @capacitor/cli, @playwright/test (+14 more)

### Community 24 - "human.js"
Cohesion: 0.14
Nodes (17): G_, HAIRS, makeHuman(), h, markerTex, mat(), matCache, mesh() (+9 more)

### Community 26 - "models.js"
Cohesion: 0.18
Nodes (11): BONE, CLIPS, files, loadModels(), mergeSkinned(), MODELS, PEOPLE_MODELS, prepClip() (+3 more)

### Community 27 - "cars.js"
Cohesion: 0.12
Nodes (20): box, Car, carMat(), carMats, CROSSES, glassMat, glowMat(), glowMats (+12 more)

### Community 28 - "Three.js Skills for Claude Code"
Cohesion: 0.12
Nodes (15): Acknowledgments, Basic Scene Setup, Contributing, Custom Shaders, How It Works, Installation, License, Loading 3D Models (+7 more)

### Community 29 - "mock-server.js"
Cohesion: 0.16
Nodes (13): crypto, frame(), friends, hb, http, lastPost, posts, pub() (+5 more)

### Community 30 - "panels.js"
Cohesion: 0.15
Nodes (48): sfx, money(), addictionLabel(), addXP(), canGift(), canSpend(), customer(), directSale() (+40 more)

### Community 31 - "creator.js"
Cohesion: 0.18
Nodes (14): clipsFor(), findSkin(), makeRealHuman(), h, modelNames(), LEO_MODEL, spawnClerks(), choices() (+6 more)

### Community 32 - "routes/auth.js"
Cohesion: 0.14
Nodes (12): { ah, HttpError }, authLimiter, bcrypt, config, loginSchema, { query }, rateLimit, registerSchema (+4 more)

### Community 33 - "common.sh"
Cohesion: 0.11
Nodes (30): check-prerequisites.sh script, check_dir(), check_file(), find_specify_root(), format_speckit_command(), get_current_branch(), get_feature_paths(), get_invoke_separator() (+22 more)

### Community 34 - "db.js"
Cohesion: 0.17
Nodes (7): pg, fs, path, { pool }, config, config, { Pool }

### Community 35 - "ws.js"
Cohesion: 0.21
Nodes (13): ws, shutdown(), verify(), allowedOrigin(), attach(), broadcast(), close(), config (+5 more)

### Community 37 - "volta-api.js"
Cohesion: 0.27
Nodes (6): http(), login(), logout(), register(), respondFriend(), setToken()

### Community 38 - "economy.js"
Cohesion: 0.09
Nodes (46): EFFECTS, productValue(), PEOPLE, clamp(), listeners, pick(), rand(), randi() (+38 more)

### Community 39 - "friends.js"
Cohesion: 0.10
Nodes (24): jsonwebtoken, zod, ah(), HttpError, config, { HttpError }, jwt, requireAuth() (+16 more)

### Community 40 - "three"
Cohesion: 0.23
Nodes (25): three, BAG, bud(), budGeometry(), budMat(), cache, cashStack(), corkTex() (+17 more)

### Community 42 - "Web Application Testing"
Cohesion: 0.25
Nodes (7): Best Practices, Common Pitfall, Decision Tree: Choosing Your Approach, Example: Using with_server.py, Reconnaissance-Then-Action Pattern, Reference Files, Web Application Testing

### Community 43 - "BLOQUE 9 · Puerto Lomas"
Cohesion: 0.09
Nodes (20): 1. Motor y arquitectura, 2. Controles táctiles (ya existían; se conservan), 3. Pruebas automáticas (referencia del comportamiento actual), 4. Compilación, 5. Rendimiento en móvil (lo que ya hace el juego), Android — estado: proyecto listo, compilación BLOQUEADA en este entorno, Bloque 9 en Android e iPhone: estado real, Fase 4 · Empleados (bloque A): reglas (+12 more)

### Community 44 - "render.js"
Cohesion: 0.21
Nodes (11): buildWorld(), resize(), applyQuality(), buildComposer(), GradeShader, initRender(), _q, R (+3 more)

### Community 45 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 46 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 47 - "VOLTA · Backend social (Node.js + Express + PostgreSQL)"
Cohesion: 0.29
Nodes (6): 1. Puesta en marcha, 2. Endpoints, 3. Integración desde `index.html`, 4. Seguridad: lo que hay y lo que debes saber, 5. Integración ya hecha en `Volta-5.html`, VOLTA · Backend social (Node.js + Express + PostgreSQL)

### Community 49 - "moderation.js"
Cohesion: 0.70
Nodes (4): base(), hit(), username(), variants()

### Community 51 - "time.js"
Cohesion: 0.15
Nodes (29): Dinero sucio y limpio (Bloque B, etapa 1): reglas, absNow(), emit(), addMoney(), deadDropActions(), done(), earn(), fromSafe() (+21 more)

### Community 61 - "speckit-analyze/SKILL.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 62 - "generator_template.js"
Cohesion: 0.11
Nodes (5): Entity, initializeSeed(), params, regenerate(), setup()

### Community 63 - "Creation Log: Systematic Debugging Skill"
Cohesion: 0.10
Nodes (19): Bulletproofing Elements, Creation Log: Systematic Debugging Skill, Enhancement 1: TDD Reference, Extraction Decisions, Final Outcome, Initial Version, Iterations, Key Insight (+11 more)

### Community 64 - "algorithmic-art/SKILL.md"
Cohesion: 0.11
Nodes (18): ALGORITHMIC PHILOSOPHY CREATION, CRAFTSMANSHIP REQUIREMENTS, CRITICAL: WHAT'S FIXED VS VARIABLE, DEDUCING THE CONCEPTUAL SEED, ESSENTIAL PRINCIPLES, HOW TO GENERATE AN ALGORITHMIC PHILOSOPHY, INTERACTIVE ARTIFACT CREATION, OUTPUT FORMAT (+10 more)

### Community 65 - "riding.js"
Cohesion: 0.12
Nodes (30): PARKING, RECOVER_PRICE, VEHICLES, clearPose(), buildBike(), buildScooter(), chrome(), M() (+22 more)

### Community 66 - "audio.js"
Cohesion: 0.16
Nodes (13): amb, audioStatus(), BUF, files, initAudio(), loadSounds(), loopSrc(), play() (+5 more)

### Community 67 - "interact.js"
Cohesion: 0.22
Nodes (9): ray, target, updateInteract(), _v, placement, placeObject(), rotatePlacement(), tintGhost() (+1 more)

### Community 68 - "Root Cause Tracing"
Cohesion: 0.12
Nodes (15): 1. Observe the Symptom, 2. Find Immediate Cause, 3. Ask: What Called This?, 4. Keep Tracing Up, 5. Find Original Trigger, Adding Stack Traces, Finding Which Test Causes Pollution, Key Principle (+7 more)

### Community 69 - "Systematic Debugging"
Cohesion: 0.12
Nodes (15): Common Rationalizations, Overview, Phase 1: Root Cause Investigation, Phase 2: Pattern Analysis, Phase 3: Hypothesis and Testing, Phase 4: Implementation, Quick Reference, Red Flags - STOP and Follow Process (+7 more)

### Community 70 - "addBox"
Cohesion: 0.19
Nodes (21): addBox(), buildEastShops(), buildNave(), buildOutskirts(), buildResidential(), cardBox(), chainFence(), decorKit() (+13 more)

### Community 71 - "core.spec.js"
Cohesion: 0.11
Nodes (46): gl, _e, count(), slotOf(), advance(), at(), emp(), money() (+38 more)

### Community 72 - "systems/staff.js"
Cohesion: 0.08
Nodes (56): save(), FORMS, ITEMS, RANKS, SHOPS, STRAINS, CANDIDATES, ROLES (+48 more)

### Community 73 - "Feature Specification: [FEATURE NAME]"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 74 - "Defense-in-Depth Validation"
Cohesion: 0.17
Nodes (11): Applying the Pattern, Defense-in-Depth Validation, Example from Session, Key Insight, Layer 1: Entry Point Validation, Layer 2: Business Logic Validation, Layer 3: Environment Guards, Layer 4: Debug Instrumentation (+3 more)

### Community 75 - "speckit-plan/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, Key rules, Mandatory Post-Execution Hooks, Outline, Phase 0: Outline & Research, Phase 1: Design & Contracts, Phases (+2 more)

### Community 76 - "speckit-specify/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, For AI Generation, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, Quick Guidelines, Section Requirements (+2 more)

### Community 77 - "speckit-tasks/SKILL.md"
Cohesion: 0.18
Nodes (10): Checklist Format (REQUIRED), Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Phase Structure, Pre-Execution Checks, Task Generation Rules (+2 more)

### Community 78 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 79 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 80 - "Verification Before Completion"
Cohesion: 0.20
Nodes (9): Common Failures, Key Patterns, Overview, Rationalization Prevention, Red Flags - STOP, The Gate Function, The Iron Law, Verification Before Completion (+1 more)

### Community 81 - "buildShops"
Cohesion: 0.29
Nodes (8): billboard(), buildCommercial(), buildStreetFurniture(), busStop(), dumpster(), hydrant(), trashCan(), utilityPoles()

### Community 82 - "Implementation Plan: [FEATURE]"
Cohesion: 0.22
Nodes (8): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: [FEATURE], Project Structure, Source Code (repository root), Summary, Technical Context

### Community 83 - "speckit-checklist/SKILL.md"
Cohesion: 0.25
Nodes (7): Anti-Examples: What NOT To Do, Checklist Purpose: "Unit Tests for English", Example Checklist Types & Sample Items, Execution Steps, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 84 - "speckit-clarify/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 85 - "speckit-implement/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 86 - "Condition-Based Waiting"
Cohesion: 0.16
Nodes (12): Common Mistakes, Condition-Based Waiting, Core Pattern, waitForEvent(), waitForEventCount(), waitForEventMatch(), Implementation, Overview (+4 more)

### Community 88 - "speckit-constitution/SKILL.md"
Cohesion: 0.33
Nodes (5): Outline, Post-Execution Checks, Pre-Execution Checks, Scope Guard, User Input

### Community 89 - "speckit-taskstoissues/SKILL.md"
Cohesion: 0.33
Nodes (5): Deprecation Notice, Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 90 - "Pressure Test 1: Emergency Production Fix"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 1: Emergency Production Fix, Scenario, Your Options

### Community 91 - "Pressure Test 2: Sunk Cost + Exhaustion"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 2: Sunk Cost + Exhaustion, Scenario, Your Options

### Community 92 - "Pressure Test 3: Authority + Social Pressure"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 3: Authority + Social Pressure, Scenario, Your Options

### Community 93 - "[CHECKLIST TYPE] Checklist: [FEATURE NAME]"
Cohesion: 0.40
Nodes (4): [Category 1], [Category 2], [CHECKLIST TYPE] Checklist: [FEATURE NAME], Notes

### Community 96 - "props.js"
Cohesion: 0.14
Nodes (14): addProp(), buildProps(), GEO, _m, _p, placed, propSize(), propsReady() (+6 more)

### Community 97 - "Walker"
Cohesion: 0.17
Nodes (4): Cop, NPC, Walker, spawnPolice()

### Community 98 - "sky.js"
Cohesion: 0.09
Nodes (25): setCarLights(), _c, GEO, LIT, _m, MAT, _p, _q (+17 more)

### Community 99 - "building"
Cohesion: 0.16
Nodes (22): asphalt(), bench(), buildIndustrial(), building(), buildMotel(), buildPlaza(), buildPolice(), buildShops() (+14 more)

### Community 100 - "station.js"
Cohesion: 0.13
Nodes (33): GEMS, shardsBag(), camFrom, camTo, colorOf(), contY(), done(), dropUnit() (+25 more)

### Community 101 - "icons.js"
Cohesion: 0.19
Nodes (20): banknote(), bud(), cache, crystalCluster(), DRAW, f(), GEM, iconSVG() (+12 more)

### Community 102 - "Execution Steps"
Cohesion: 0.12
Nodes (15): 1. Initialize Convergence Context, 2. Load Artifacts (Progressive Disclosure), 3. Build the Intent Inventory, 4. Assess the Codebase and Classify Findings, 5. Assign Severity, 6. Present the In-Session Findings Summary, 7. Append Convergence Tasks (or report converged), 8. Provide Next Actions (Handoff) (+7 more)

### Community 103 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+3 more)

### Community 104 - "hud.js"
Cohesion: 0.13
Nodes (22): QUESTS, on(), RECOG_LEVEL, placingMode(), curfew(), wanted, ridingInfo(), clock() (+14 more)

### Community 105 - "input.js"
Cohesion: 0.36
Nodes (7): initInput(), input, keys, moveJoy(), pollInput(), resetJoyEl(), resetTouch()

### Community 106 - "state.js"
Cohesion: 0.19
Nodes (16): backup(), inv, INV_SIZE, native(), restoreBackup(), same(), SAVE_VERSION, slotsAdd() (+8 more)

### Community 107 - "layout.js"
Cohesion: 0.62
Nodes (6): applyLayout(), CONTROLS, el(), fitHud(), openLayoutEditor(), settings()

### Community 108 - "benches.js"
Cohesion: 0.41
Nodes (16): add(), BENCH_TOP, budTray(), buildJarPacker(), buildPacker(), buildStove(), crate(), cuttingMatTex() (+8 more)

### Community 109 - "police.js"
Cohesion: 0.19
Nodes (19): setSiren(), illegalCount(), CUSTOMER_LINES, GREETINGS, OFFICERS, STARTING_CUSTOMERS, recognition(), rememberIncident() (+11 more)

### Community 110 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, dev, migrate, start

### Community 111 - "ViewModel"
Cohesion: 0.17
Nodes (3): curl(), ViewModel, Player

### Community 112 - "entities/vehicles.js"
Cohesion: 0.16
Nodes (14): bake(), BODY, CAR_MODELS, carMaterial(), files, GEOS, GLASS, isLight() (+6 more)

### Community 113 - "actionsFor"
Cohesion: 0.23
Nodes (13): actionsFor(), collect(), cook(), emptyPot(), harvest(), harvestYield(), infoFor(), potInfo() (+5 more)

## Knowledge Gaps
- **8 isolated node(s):** `UIKit`, `Capacitor`, `PackageDescription`, `@capacitor/android`, `@capacitor/core` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 911 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `world.js`, `main.js`, `objects.js`, `textures.js`, `dressing.js`, `hands.js`, `juego/package.json`, `human.js`, `models.js`, `cars.js`, `creator.js`, `economy.js`, `render.js`, `riding.js`, `addBox`, `buildShops`, `props.js`, `sky.js`, `building`, `station.js`, `benches.js`, `ViewModel`, `entities/vehicles.js`, `actionsFor`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `UIKit`, `Capacitor`, `PackageDescription` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `world.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0915915915915916 - nodes in this community are weakly interconnected._
- **Why does `three` connect `hands.js` to `world.js`, `main.js`, `objects.js`, `textures.js`, `dressing.js`, `juego/package.json`, `human.js`, `models.js`, `cars.js`, `creator.js`, `three`, `render.js`, `riding.js`, `interact.js`, `props.js`, `sky.js`, `station.js`, `benches.js`, `entities/vehicles.js`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09682539682539683 - nodes in this community are weakly interconnected._
- **Why does `R` connect `render.js` to `main.js`, `hands.js`, `core.spec.js`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `Three.js Textures` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._