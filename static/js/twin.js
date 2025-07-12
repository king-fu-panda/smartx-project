
// Enhanced Babylon.js Digital Twin JavaScript
let engine, scene, camera, sensorData = {};
let machineGroup, currentMachine = 'robot';
let animationRunning = true;
let rotatingParts = [];
let vrHelper = null;
let animationFrame = 0;

// Initialize Babylon.js scene when page loads
document.addEventListener('DOMContentLoaded', function() {
    initBabylonScene();
    setupEventListeners();
    startDataUpdates();
});

// Initialize Babylon.js scene
function initBabylonScene() {
    const canvas = document.getElementById('twin-canvas');
    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.05, 0.09, 0.16);

    // Enhanced camera with proper Babylon.js setup
    camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 10, BABYLON.Vector3.Zero(), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControls(canvas, true);

    // Enhanced lighting
    setupEnhancedLighting();

    // Create machine
    createEnhancedMachine();

    // Start render loop with animations
    engine.runRenderLoop(() => {
        animationFrame++;
        updatePerformanceDisplay();
        if (animationRunning) {
            animateMachine();
        }
        scene.render();
    });

    // Handle resize
    window.addEventListener("resize", () => {
        engine.resize();
    });

    // Setup VR
    setupVR();
}

function setupVR() {
    // Initialize VR helper
    if (scene.createDefaultXRExperienceAsync) {
        scene.createDefaultXRExperienceAsync().then((xrExperience) => {
            vrHelper = xrExperience;
            console.log("VR initialized successfully");
        }).catch((error) => {
            console.log("VR not supported:", error);
            setupBasicVR();
        });
    } else {
        setupBasicVR();
    }
}

function setupBasicVR() {
    // Basic VR fallback using device orientation
    if (BABYLON.DeviceOrientationCamera) {
        const vrCamera = new BABYLON.DeviceOrientationCamera("vrCamera", new BABYLON.Vector3(0, 5, -10), scene);
        vrCamera.setTarget(BABYLON.Vector3.Zero());
    }
}

function setupEnhancedLighting() {
    // Ambient light
    const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.4;

    // Main directional light with shadows
    const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, -1), scene);
    directionalLight.intensity = 1.2;
    directionalLight.shadowMinZ = 1;
    directionalLight.shadowMaxZ = 2500;

    // Create shadow generator
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // Point lights for atmosphere
    const pointLight1 = new BABYLON.PointLight("pointLight1", new BABYLON.Vector3(10, 10, 0), scene);
    pointLight1.diffuse = new BABYLON.Color3(0.2, 0.4, 1);
    pointLight1.intensity = 0.6;

    const pointLight2 = new BABYLON.PointLight("pointLight2", new BABYLON.Vector3(-10, 5, 10), scene);
    pointLight2.diffuse = new BABYLON.Color3(1, 0.4, 0.2);
    pointLight2.intensity = 0.4;

    // Store shadow generator for later use
    scene.shadowGenerator = shadowGenerator;
}

function createEnhancedMachine() {
    // Clear existing machine
    if (machineGroup) {
        machineGroup.dispose();
    }

    machineGroup = new BABYLON.TransformNode("machineGroup", scene);
    rotatingParts = [];

    // Create different machine types based on selection
    switch(currentMachine) {
        case 'robot':
            createRoboticArm();
            break;
        case 'cnc':
            createCNCMachine();
            break;
        case 'turbine':
            createWindTurbine();
            break;
        case 'conveyor':
            createConveyorSystem();
            break;
        case 'assembly':
            createAssemblyStation();
            break;
        case 'press':
            createHydraulicPress();
            break;
        case 'reactor':
            createChemicalReactor();
            break;
        default:
            createRoboticArm();
    }

    // Add ground
    createEnhancedGround();

    // Add all meshes to shadow generator
    if (scene.shadowGenerator) {
        scene.meshes.forEach(mesh => {
            if (mesh.name !== 'ground') {
                scene.shadowGenerator.addShadowCaster(mesh);
            }
        });
    }
}

function createRoboticArm() {
    // Base
    const base = BABYLON.MeshBuilder.CreateCylinder("base", {height: 1, diameter: 2}, scene);
    base.position.y = 0.5;
    base.parent = machineGroup;

    // Enhanced material with PBR
    const baseMaterial = new BABYLON.PBRMaterial("baseMaterial", scene);
    baseMaterial.baseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
    baseMaterial.metallic = 0.8;
    baseMaterial.roughness = 0.2;
    base.material = baseMaterial;

    // Rotating base
    const rotatingBase = BABYLON.MeshBuilder.CreateCylinder("rotatingBase", {height: 0.2, diameter: 1.8}, scene);
    rotatingBase.position.y = 1.1;
    rotatingBase.parent = machineGroup;
    rotatingBase.material = baseMaterial;
    rotatingParts.push({mesh: rotatingBase, axis: 'y', speed: 0.02, originalPosition: rotatingBase.position.clone()});

    // Arm segments with joints
    for (let i = 0; i < 3; i++) {
        const segment = BABYLON.MeshBuilder.CreateBox("segment" + i, {width: 0.3, height: 1.5, depth: 0.3}, scene);
        segment.position.y = 1.5 + (i * 1.2);
        segment.rotation.z = Math.sin(Date.now() * 0.001 + i) * 0.3;
        segment.parent = machineGroup;

        const segmentMaterial = new BABYLON.PBRMaterial("segmentMaterial" + i, scene);
        segmentMaterial.baseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
        segmentMaterial.metallic = 0.9;
        segmentMaterial.roughness = 0.1;
        segment.material = segmentMaterial;

        rotatingParts.push({mesh: segment, axis: 'z', speed: 0.01 + i * 0.005, originalPosition: segment.position.clone()});

        // Joint
        const joint = BABYLON.MeshBuilder.CreateSphere("joint" + i, {diameter: 0.4}, scene);
        joint.position.y = segment.position.y - 0.6;
        joint.parent = machineGroup;
        joint.material = baseMaterial;
    }

    // End effector with animated movement
    const endEffector = BABYLON.MeshBuilder.CreateBox("endEffector", {width: 0.5, height: 0.2, depth: 0.2}, scene);
    endEffector.position.y = 5;
    endEffector.parent = machineGroup;
    endEffector.material = baseMaterial;
    rotatingParts.push({mesh: endEffector, axis: 'x', speed: 0.03, originalPosition: endEffector.position.clone()});

    // Add glowing sensor indicators
    createSensorIndicators();
}

function createWindTurbine() {
    // Tower
    const tower = BABYLON.MeshBuilder.CreateCylinder("tower", {height: 8, diameterTop: 0.8, diameterBottom: 1.2}, scene);
    tower.position.y = 4;
    tower.parent = machineGroup;

    const towerMaterial = new BABYLON.PBRMaterial("towerMaterial", scene);
    towerMaterial.baseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    towerMaterial.metallic = 0.3;
    towerMaterial.roughness = 0.7;
    tower.material = towerMaterial;

    // Nacelle
    const nacelle = BABYLON.MeshBuilder.CreateBox("nacelle", {width: 3, height: 1, depth: 1}, scene);
    nacelle.position.y = 8;
    nacelle.parent = machineGroup;
    nacelle.material = towerMaterial;

    // Hub - this will rotate with blades
    const hub = BABYLON.MeshBuilder.CreateSphere("hub", {diameter: 0.8}, scene);
    hub.position = new BABYLON.Vector3(1.5, 8, 0);
    hub.parent = machineGroup;

    const hubMaterial = new BABYLON.PBRMaterial("hubMaterial", scene);
    hubMaterial.baseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    hubMaterial.metallic = 0.9;
    hubMaterial.roughness = 0.1;
    hub.material = hubMaterial;

    rotatingParts.push({mesh: hub, axis: 'x', speed: 0.05, originalPosition: hub.position.clone()});

    // Blades - attached to hub for rotation
    for (let i = 0; i < 3; i++) {
        const blade = BABYLON.MeshBuilder.CreateBox("blade" + i, {width: 0.1, height: 4, depth: 0.5}, scene);
        blade.position = new BABYLON.Vector3(1.5, 10, 0);
        blade.rotation.x = (i * Math.PI * 2 / 3);
        blade.parent = hub; // Parent to hub so they rotate together

        const bladeMaterial = new BABYLON.PBRMaterial("bladeMaterial", scene);
        bladeMaterial.baseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        bladeMaterial.metallic = 0.2;
        bladeMaterial.roughness = 0.8;
        blade.material = bladeMaterial;
    }

    createSensorIndicators();
}

function createCNCMachine() {
    // CNC Base
    const base = BABYLON.MeshBuilder.CreateBox("cncBase", {width: 3, height: 0.5, depth: 2}, scene);
    base.position.y = 0.25;
    base.parent = machineGroup;

    const baseMaterial = new BABYLON.PBRMaterial("cncBaseMaterial", scene);
    baseMaterial.baseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
    baseMaterial.metallic = 0.8;
    baseMaterial.roughness = 0.2;
    base.material = baseMaterial;

    // Spindle housing
    const housing = BABYLON.MeshBuilder.CreateBox("housing", {width: 0.8, height: 1.5, depth: 0.8}, scene);
    housing.position.set(0, 1.25, 0);
    housing.parent = machineGroup;
    housing.material = baseMaterial;

    // Rotating spindle - fast rotation
    const spindle = BABYLON.MeshBuilder.CreateCylinder("spindle", {height: 1, diameter: 0.1}, scene);
    spindle.position.set(0, 0.75, 0);
    spindle.parent = machineGroup;

    const spindleMaterial = new BABYLON.PBRMaterial("spindleMaterial", scene);
    spindleMaterial.baseColor = new BABYLON.Color3(1, 0.3, 0.3);
    spindleMaterial.metallic = 0.9;
    spindleMaterial.roughness = 0.1;
    spindle.material = spindleMaterial;
    rotatingParts.push({mesh: spindle, axis: 'y', speed: 0.3, originalPosition: spindle.position.clone()});

    // Work table
    const table = BABYLON.MeshBuilder.CreateBox("table", {width: 2, height: 0.2, depth: 1.5}, scene);
    table.position.y = 0.6;
    table.parent = machineGroup;

    const tableMaterial = new BABYLON.PBRMaterial("tableMaterial", scene);
    tableMaterial.baseColor = new BABYLON.Color3(0.5, 0.5, 0.6);
    tableMaterial.metallic = 0.7;
    tableMaterial.roughness = 0.3;
    table.material = tableMaterial;

    createSensorIndicators();
}

function createConveyorSystem() {
    // Belt
    const belt = BABYLON.MeshBuilder.CreateBox("belt", {width: 6, height: 0.2, depth: 1}, scene);
    belt.position.y = 0.6;
    belt.parent = machineGroup;

    const beltMaterial = new BABYLON.PBRMaterial("beltMaterial", scene);
    beltMaterial.baseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    beltMaterial.metallic = 0.1;
    beltMaterial.roughness = 0.9;
    belt.material = beltMaterial;

    // Rollers - rotating
    for (let i = 0; i < 7; i++) {
        const roller = BABYLON.MeshBuilder.CreateCylinder("roller" + i, {height: 1.2, diameter: 0.2}, scene);
        roller.position.set(-2.5 + i * 0.8, 0.5, 0);
        roller.rotation.z = Math.PI / 2;
        roller.parent = machineGroup;

        const rollerMaterial = new BABYLON.PBRMaterial("rollerMaterial", scene);
        rollerMaterial.baseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
        rollerMaterial.metallic = 0.8;
        rollerMaterial.roughness = 0.2;
        roller.material = rollerMaterial;
        rotatingParts.push({mesh: roller, axis: 'z', speed: 0.05, originalPosition: roller.position.clone()});
    }

    // Moving packages
    for (let i = 0; i < 3; i++) {
        const package = BABYLON.MeshBuilder.CreateBox("package" + i, {width: 0.3, height: 0.3, depth: 0.3}, scene);
        package.position.set(-2 + i * 1.5, 0.85, 0);
        package.parent = machineGroup;

        const packageMaterial = new BABYLON.PBRMaterial("packageMaterial", scene);
        packageMaterial.baseColor = new BABYLON.Color3(0.8, 0.5, 0.2);
        packageMaterial.metallic = 0.1;
        packageMaterial.roughness = 0.8;
        package.material = packageMaterial;
        rotatingParts.push({
            mesh: package, 
            axis: 'move', 
            speed: 0.02, 
            moveDirection: new BABYLON.Vector3(1, 0, 0),
            originalPosition: package.position.clone()
        });
    }

    createSensorIndicators();
}

function createAssemblyStation() {
    // Platform
    const platform = BABYLON.MeshBuilder.CreateBox("platform", {width: 2.5, height: 0.3, depth: 2.5}, scene);
    platform.position.y = 0.15;
    platform.parent = machineGroup;

    const platformMaterial = new BABYLON.PBRMaterial("platformMaterial", scene);
    platformMaterial.baseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
    platformMaterial.metallic = 0.8;
    platformMaterial.roughness = 0.2;
    platform.material = platformMaterial;

    // Assembly arms - each rotating at different speeds
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const armBase = BABYLON.MeshBuilder.CreateCylinder("armBase" + i, {height: 0.5, diameter: 0.2}, scene);
        armBase.position.set(Math.cos(angle) * 0.8, 0.55, Math.sin(angle) * 0.8);
        armBase.parent = machineGroup;

        const arm = BABYLON.MeshBuilder.CreateBox("arm" + i, {width: 0.8, height: 0.1, depth: 0.1}, scene);
        arm.position.set(Math.cos(angle) * 1.2, 0.8, Math.sin(angle) * 1.2);
        arm.parent = machineGroup;

        const armMaterial = new BABYLON.PBRMaterial("armMaterial", scene);
        armMaterial.baseColor = new BABYLON.Color3(0.6, 0.3, 0.8);
        armMaterial.metallic = 0.7;
        armMaterial.roughness = 0.3;
        arm.material = armMaterial;
        armBase.material = armMaterial;

        rotatingParts.push({mesh: arm, axis: 'y', speed: 0.02 + i * 0.01, originalPosition: arm.position.clone()});
    }

    // Central assembly point - fast rotating
    const center = BABYLON.MeshBuilder.CreateCylinder("center", {height: 0.3, diameter: 0.4}, scene);
    center.position.y = 0.45;
    center.parent = machineGroup;

    const centerMaterial = new BABYLON.PBRMaterial("centerMaterial", scene);
    centerMaterial.baseColor = new BABYLON.Color3(1, 0.3, 0.3);
    centerMaterial.metallic = 0.9;
    centerMaterial.roughness = 0.1;
    center.material = centerMaterial;
    rotatingParts.push({mesh: center, axis: 'y', speed: 0.08, originalPosition: center.position.clone()});

    createSensorIndicators();
}

function createHydraulicPress() {
    // Frame
    const frame = BABYLON.MeshBuilder.CreateBox("frame", {width: 2, height: 3, depth: 1.5}, scene);
    frame.position.y = 1.5;
    frame.parent = machineGroup;

    const frameMaterial = new BABYLON.PBRMaterial("frameMaterial", scene);
    frameMaterial.baseColor = new BABYLON.Color3(0.1, 0.2, 0.3);
    frameMaterial.metallic = 0.8;
    frameMaterial.roughness = 0.4;
    frame.material = frameMaterial;

    // Hydraulic cylinder
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", {height: 1.5, diameter: 0.4}, scene);
    cylinder.position.set(0, 2.5, 0);
    cylinder.parent = machineGroup;

    const cylinderMaterial = new BABYLON.PBRMaterial("cylinderMaterial", scene);
    cylinderMaterial.baseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
    cylinderMaterial.metallic = 0.9;
    cylinderMaterial.roughness = 0.2;
    cylinder.material = cylinderMaterial;

    // Press head (moving part) - oscillating up and down
    const head = BABYLON.MeshBuilder.CreateBox("head", {width: 1.5, height: 0.3, depth: 1.2}, scene);
    head.position.set(0, 1.8, 0);
    head.parent = machineGroup;

    const headMaterial = new BABYLON.PBRMaterial("headMaterial", scene);
    headMaterial.baseColor = new BABYLON.Color3(1, 0.3, 0.3);
    headMaterial.metallic = 0.8;
    headMaterial.roughness = 0.2;
    head.material = headMaterial;
    rotatingParts.push({
        mesh: head, 
        axis: 'oscillate', 
        speed: 0.03, 
        oscillateAxis: 'y',
        oscillateAmount: 0.5,
        originalPosition: head.position.clone()
    });

    // Base plate
    const baseplate = BABYLON.MeshBuilder.CreateBox("baseplate", {width: 1.8, height: 0.2, depth: 1.4}, scene);
    baseplate.position.y = 0.6;
    baseplate.parent = machineGroup;

    const baseMaterial = new BABYLON.PBRMaterial("baseMaterial", scene);
    baseMaterial.baseColor = new BABYLON.Color3(0.4, 0.4, 0.5);
    baseMaterial.metallic = 0.7;
    baseMaterial.roughness = 0.3;
    baseplate.material = baseMaterial;

    createSensorIndicators();
}

function createChemicalReactor() {
    // Main reactor vessel
    const vessel = BABYLON.MeshBuilder.CreateCylinder("vessel", {height: 4, diameter: 2.5}, scene);
    vessel.position.y = 2;
    vessel.parent = machineGroup;

    const vesselMaterial = new BABYLON.PBRMaterial("vesselMaterial", scene);
    vesselMaterial.baseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    vesselMaterial.metallic = 0.9;
    vesselMaterial.roughness = 0.1;
    vessel.material = vesselMaterial;

    // Stirrer - fast rotating
    const stirrer = BABYLON.MeshBuilder.CreateCylinder("stirrer", {height: 3.5, diameter: 0.1}, scene);
    stirrer.position.y = 2;
    stirrer.parent = machineGroup;

    const stirrerMaterial = new BABYLON.PBRMaterial("stirrerMaterial", scene);
    stirrerMaterial.baseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    stirrerMaterial.metallic = 0.8;
    stirrerMaterial.roughness = 0.2;
    stirrer.material = stirrerMaterial;
    rotatingParts.push({mesh: stirrer, axis: 'y', speed: 0.15, originalPosition: stirrer.position.clone()});

    // Stirrer blades - attached to stirrer
    for (let i = 0; i < 4; i++) {
        const blade = BABYLON.MeshBuilder.CreateBox("stirrerBlade" + i, {width: 0.8, height: 0.1, depth: 0.05}, scene);
        blade.position.set(0, 0.5 + i * 0.8, 0);
        blade.rotation.y = (i * Math.PI / 2);
        blade.parent = stirrer; // Parent to stirrer so they rotate together

        const bladeMaterial = new BABYLON.PBRMaterial("bladeMaterial", scene);
        bladeMaterial.baseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        bladeMaterial.metallic = 0.7;
        bladeMaterial.roughness = 0.3;
        blade.material = bladeMaterial;
    }

    // Pipes
    for (let i = 0; i < 3; i++) {
        const pipe = BABYLON.MeshBuilder.CreateCylinder("pipe" + i, {height: 1, diameter: 0.2}, scene);
        const angle = (i / 3) * Math.PI * 2;
        pipe.position.set(Math.cos(angle) * 1.5, 3 + i * 0.3, Math.sin(angle) * 1.5);
        pipe.rotation.z = Math.PI / 2;
        pipe.parent = machineGroup;

        const pipeMaterial = new BABYLON.PBRMaterial("pipeMaterial", scene);
        pipeMaterial.baseColor = new BABYLON.Color3(0.3, 0.6, 0.3);
        pipeMaterial.metallic = 0.6;
        pipeMaterial.roughness = 0.4;
        pipe.material = pipeMaterial;
    }

    createSensorIndicators();
}

function createSensorIndicators() {
    // Temperature sensor - pulsing red
    const tempSensor = BABYLON.MeshBuilder.CreateSphere("tempSensor", {diameter: 0.2}, scene);
    tempSensor.position.set(0.8, 1.2, 0.8);
    tempSensor.parent = machineGroup;

    const tempMaterial = new BABYLON.PBRMaterial("tempMaterial", scene);
    tempMaterial.baseColor = new BABYLON.Color3(1, 0.3, 0.3);
    tempMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);
    tempSensor.material = tempMaterial;
    rotatingParts.push({mesh: tempSensor, axis: 'pulse', speed: 0.05, originalPosition: tempSensor.position.clone()});

    // Pressure sensor - pulsing blue
    const pressureSensor = BABYLON.MeshBuilder.CreateSphere("pressureSensor", {diameter: 0.2}, scene);
    pressureSensor.position.set(-0.8, 1.2, 0.8);
    pressureSensor.parent = machineGroup;

    const pressureMaterial = new BABYLON.PBRMaterial("pressureMaterial", scene);
    pressureMaterial.baseColor = new BABYLON.Color3(0.3, 0.3, 1);
    pressureMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.5);
    pressureSensor.material = pressureMaterial;
    rotatingParts.push({mesh: pressureSensor, axis: 'pulse', speed: 0.07, originalPosition: pressureSensor.position.clone()});

    // Vibration sensor - constantly moving
    const vibrationSensor = BABYLON.MeshBuilder.CreateSphere("vibrationSensor", {diameter: 0.2}, scene);
    vibrationSensor.position.set(0, 1.2, -0.8);
    vibrationSensor.parent = machineGroup;

    const vibrationMaterial = new BABYLON.PBRMaterial("vibrationMaterial", scene);
    vibrationMaterial.baseColor = new BABYLON.Color3(1, 0.7, 0.2);
    vibrationMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.3, 0.1);
    vibrationSensor.material = vibrationMaterial;
    rotatingParts.push({mesh: vibrationSensor, axis: 'vibrate', speed: 0.1, originalPosition: vibrationSensor.position.clone()});
}

function createEnhancedGround() {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);

    const groundMaterial = new BABYLON.PBRMaterial("groundMaterial", scene);
    groundMaterial.baseColor = new BABYLON.Color3(0.1, 0.15, 0.2);
    groundMaterial.metallic = 0.0;
    groundMaterial.roughness = 1.0;
    ground.material = groundMaterial;
    ground.receiveShadows = true;
}

function animateMachine() {
    const time = performance.now() * 0.001;

    rotatingParts.forEach(part => {
        switch(part.axis) {
            case 'x':
                part.mesh.rotation.x += part.speed;
                break;
            case 'y':
                part.mesh.rotation.y += part.speed;
                break;
            case 'z':
                part.mesh.rotation.z += part.speed;
                break;
            case 'move':
                part.mesh.position.x += part.speed;
                if (part.mesh.position.x > 3) {
                    part.mesh.position.x = -3;
                }
                break;
            case 'oscillate':
                const oscillation = Math.sin(time * part.speed * 10) * part.oscillateAmount;
                if (part.oscillateAxis === 'y') {
                    part.mesh.position.y = part.originalPosition.y + oscillation;
                }
                break;
            case 'pulse':
                const pulse = Math.sin(time * part.speed * 20) * 0.1 + 1;
                part.mesh.scaling = new BABYLON.Vector3(pulse, pulse, pulse);
                break;
            case 'vibrate':
                const vibrateX = (Math.random() - 0.5) * 0.02;
                const vibrateZ = (Math.random() - 0.5) * 0.02;
                part.mesh.position.x = part.originalPosition.x + vibrateX;
                part.mesh.position.z = part.originalPosition.z + vibrateZ;
                break;
        }
    });

    // Update sensor-based effects
    updateSensorEffects();
}

function updateSensorEffects() {
    if (sensorData.vibration > 0.8 && machineGroup) {
        // Add machine vibration effect
        const vibrationOffset = (Math.random() - 0.5) * 0.02;
        machineGroup.position.x = vibrationOffset;
        machineGroup.position.z = vibrationOffset;
    } else if (machineGroup) {
        // Reset position when vibration is low
        machineGroup.position.x = 0;
        machineGroup.position.z = 0;
    }
}

function updatePerformanceDisplay() {
    if (animationFrame % 60 === 0) { // Update every 60 frames
        document.getElementById('fpsDisplay').textContent = Math.round(engine.getFps());
        document.getElementById('drawCallsDisplay').textContent = scene.getActiveMeshes().length;
        document.getElementById('trianglesDisplay').textContent = scene.getTotalVertices();
    }
}

// Event listeners and API calls
function setupEventListeners() {
    // Machine selection
    document.getElementById('machineSelect').addEventListener('change', function(e) {
        currentMachine = e.target.value;
        switchMachine(currentMachine);
    });

    // VR toggle
    document.getElementById('toggleVR').addEventListener('click', function() {
        if (vrHelper && vrHelper.baseExperience) {
            vrHelper.baseExperience.enterXRAsync("immersive-vr", "local-floor").then(() => {
                console.log("Entered VR mode");
            }).catch((error) => {
                console.log("VR entry failed:", error);
                simulateVRMode();
            });
        } else {
            simulateVRMode();
        }
    });

    // Graphics controls
    document.getElementById('lightingControl').addEventListener('input', function(e) {
        const intensity = e.target.value / 100;
        scene.lights.forEach(light => {
            if (light instanceof BABYLON.DirectionalLight) {
                light.intensity = intensity * 1.2;
            }
        });
        document.getElementById('lightingValue').textContent = e.target.value + '%';
    });

    document.getElementById('fovControl').addEventListener('input', function(e) {
        camera.fov = (e.target.value * Math.PI) / 180;
        document.getElementById('fovValue').textContent = e.target.value + '°';
    });

    // Animation toggle
    document.getElementById('animationToggle').addEventListener('change', function(e) {
        animationRunning = e.target.checked;
    });

    // Screenshot
    document.getElementById('captureScreenshot').addEventListener('click', function() {
        BABYLON.ScreenshotTools.CreateScreenshotUsingRenderTarget(engine, camera, 1920);
    });

    // Reset view
    document.getElementById('resetView').addEventListener('click', resetView);

    // View buttons
    document.getElementById('frontView').addEventListener('click', () => setView('front'));
    document.getElementById('topView').addEventListener('click', () => setView('top'));
    document.getElementById('sideView').addEventListener('click', () => setView('side'));
    document.getElementById('isoView').addEventListener('click', () => setView('iso'));
}

function simulateVRMode() {
    // Simulate VR by changing camera position and FOV
    camera.fov = Math.PI / 2; // Wider FOV for VR feel
    camera.position = new BABYLON.Vector3(0, 2, -5);
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));
    alert("VR Mode Simulated! Use mouse to look around in VR perspective.");
}

function switchMachine(machineType) {
    currentMachine = machineType;
    createEnhancedMachine();
}

function setView(viewType) {
    switch (viewType) {
        case 'front':
            camera.position = new BABYLON.Vector3(0, 2, 8);
            camera.setTarget(new BABYLON.Vector3(0, 1, 0));
            break;
        case 'top':
            camera.position = new BABYLON.Vector3(0, 10, 0);
            camera.setTarget(new BABYLON.Vector3(0, 0, 0));
            break;
        case 'side':
            camera.position = new BABYLON.Vector3(8, 2, 0);
            camera.setTarget(new BABYLON.Vector3(0, 1, 0));
            break;
        case 'iso':
            camera.position = new BABYLON.Vector3(5, 5, 5);
            camera.setTarget(new BABYLON.Vector3(0, 1, 0));
            break;
    }
}

function resetView() {
    camera.position = new BABYLON.Vector3(5, 5, 5);
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));
    camera.fov = Math.PI / 4;
}

// Data updates
function startDataUpdates() {
    updateSensorData();
    setInterval(updateSensorData, 3000);
}

async function updateSensorData() {
    try {
        const response = await fetch('/api/twin-data');
        const data = await response.json();
        sensorData = data;

        updateSensorDisplay(data);
        updateSensorVisualization(data);

    } catch (error) {
        console.error('Error updating twin data:', error);
        // Use random data if API fails
        sensorData = {
            temperature: Math.random() * 100 + 50,
            pressure: Math.random() * 3 + 0.5,
            vibration: Math.random() * 1.5,
            rpm: Math.random() * 2000 + 1000,
            power: Math.random() * 150 + 50,
            status: ['Operating', 'Warning', 'Critical'][Math.floor(Math.random() * 3)]
        };
        updateSensorDisplay(sensorData);
        updateSensorVisualization(sensorData);
    }
}

function updateSensorDisplay(data) {
    document.getElementById('twinTemp').textContent = `${Math.round(data.temperature)}°F`;
    document.getElementById('twinPressure').textContent = `${data.pressure.toFixed(1)} bar`;
    document.getElementById('twinVibration').textContent = `${data.vibration.toFixed(2)}`;
    document.getElementById('twinRpm').textContent = `${Math.round(data.rpm)} rpm`;
    document.getElementById('twinPower').textContent = `${Math.round(data.power)} kW`;

    // Update progress bars
    document.getElementById('tempBar').style.width = `${Math.min(100, (data.temperature / 150) * 100)}%`;
    document.getElementById('pressureBar').style.width = `${Math.min(100, (data.pressure / 3) * 100)}%`;
    document.getElementById('vibrationBar').style.width = `${Math.min(100, (data.vibration / 1.5) * 100)}%`;
    document.getElementById('rpmBar').style.width = `${Math.min(100, (data.rpm / 3000) * 100)}%`;
    document.getElementById('powerBar').style.width = `${Math.min(100, (data.power / 200) * 100)}%`;

    // Update status
    const statusElement = document.getElementById('twinStatus');
    statusElement.innerHTML = `<i class="fas fa-circle mr-1"></i>${data.status}`;
    
    // Set status color based on status
    statusElement.className = 'px-2 py-1 rounded-full text-xs font-semibold';
    if (data.status === 'Operating') {
        statusElement.className += ' bg-green-500/20 text-green-400';
    } else if (data.status === 'Warning') {
        statusElement.className += ' bg-yellow-500/20 text-yellow-400';
    } else {
        statusElement.className += ' bg-red-500/20 text-red-400';
    }
}

function updateSensorVisualization(data) {
    updateSensorEffects();
    
    // Update machine colors based on status
    if (machineGroup && machineGroup.getChildren) {
        machineGroup.getChildren().forEach(child => {
            if (child.material && child.material.baseColor) {
                switch (data.status) {
                    case 'Operating':
                        if (child.name.includes('base') || child.name.includes('main')) {
                            child.material.baseColor = new BABYLON.Color3(0.2, 0.8, 0.3);
                        }
                        break;
                    case 'Warning':
                        if (child.name.includes('base') || child.name.includes('main')) {
                            child.material.baseColor = new BABYLON.Color3(1, 0.7, 0.2);
                        }
                        break;
                    case 'Critical':
                        if (child.name.includes('base') || child.name.includes('main')) {
                            child.material.baseColor = new BABYLON.Color3(1, 0.3, 0.3);
                        }
                        break;
                }
            }
        });
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (engine) {
        engine.dispose();
    }
});
