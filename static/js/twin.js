// 3D Digital Twin JavaScript
let scene, camera, renderer, controls;
let machine, machineGroup;
let sensorData = {};
let animationRunning = true;
let currentRotation = { x: 0, y: 0 };
let currentMachine = 'robot';
let machineSpeed = 50;
let productionMode = 'auto';
let lightingLevel = 80;
let showGrid = true;
let showShadows = true;

// Initialize 3D scene when page loads
document.addEventListener('DOMContentLoaded', function() {
    init3DScene();
    setupEventListeners();
    startDataUpdates();
    animate();
});

// Initialize Three.js scene
function init3DScene() {
    const container = document.getElementById('twin-container');
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
    );
    camera.position.set(5, 5, 5);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('twin-canvas'),
        antialias: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting setup
    setupLighting();
    
    // Create machine model
    createMachine();
    
    // Controls setup
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enableZoom = true;
        controls.enablePan = true;
    }
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Setup lighting
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Additional point lights for better visualization
    const pointLight1 = new THREE.PointLight(0x3b82f6, 0.6);
    pointLight1.position.set(-5, 5, 5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x10b981, 0.4);
    pointLight2.position.set(5, -3, -5);
    scene.add(pointLight2);
}

// Create machine 3D model
function createMachine() {
    machineGroup = new THREE.Group();
    
    // Main body (industrial machine base)
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2563eb,
        shininess: 100 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    machineGroup.add(body);
    
    // Control panel
    const panelGeometry = new THREE.BoxGeometry(0.3, 0.8, 1.5);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x1f2937 });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(1.15, 0.9, 0);
    panel.castShadow = true;
    machineGroup.add(panel);
    
    // Rotating component (represents moving parts)
    const rotorGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const rotorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xef4444,
        shininess: 80 
    });
    machine = new THREE.Mesh(rotorGeometry, rotorMaterial);
    machine.position.set(0, 1.4, 0);
    machine.castShadow = true;
    machineGroup.add(machine);
    
    // Support pillars
    for (let i = 0; i < 4; i++) {
        const pillarGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const pillarMaterial = new THREE.MeshPhongMaterial({ color: 0x6b7280 });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        
        const angle = (i / 4) * Math.PI * 2;
        pillar.position.set(
            Math.cos(angle) * 0.8,
            0.75,
            Math.sin(angle) * 0.8
        );
        pillar.castShadow = true;
        machineGroup.add(pillar);
    }
    
    // Add sensor indicators
    createSensorIndicators();
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1e293b,
        shininess: 0 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    scene.add(machineGroup);
}

// Create sensor indicators
function createSensorIndicators() {
    // Temperature sensor
    const tempSensorGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const tempSensorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xef4444,
        emissive: 0x441111 
    });
    const tempSensor = new THREE.Mesh(tempSensorGeometry, tempSensorMaterial);
    tempSensor.position.set(0.8, 1.2, 0.8);
    tempSensor.userData = { type: 'temperature' };
    machineGroup.add(tempSensor);
    
    // Pressure sensor
    const pressureSensorGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const pressureSensorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3b82f6,
        emissive: 0x111144 
    });
    const pressureSensor = new THREE.Mesh(pressureSensorGeometry, pressureSensorMaterial);
    pressureSensor.position.set(-0.8, 1.2, 0.8);
    pressureSensor.userData = { type: 'pressure' };
    machineGroup.add(pressureSensor);
    
    // Vibration sensor
    const vibrationSensorGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const vibrationSensorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xf59e0b,
        emissive: 0x443311 
    });
    const vibrationSensor = new THREE.Mesh(vibrationSensorGeometry, vibrationSensorMaterial);
    vibrationSensor.position.set(0, 1.2, -0.8);
    vibrationSensor.userData = { type: 'vibration' };
    machineGroup.add(vibrationSensor);
}

// Setup event listeners
function setupEventListeners() {
    // Reset view button
    document.getElementById('resetView').addEventListener('click', resetView);
    
    // Machine selection
    document.getElementById('machineSelect').addEventListener('change', function(e) {
        currentMachine = e.target.value;
        switchMachine(currentMachine);
    });
    
    // View buttons
    document.getElementById('frontView').addEventListener('click', () => setView('front'));
    document.getElementById('topView').addEventListener('click', () => setView('top'));
    document.getElementById('sideView').addEventListener('click', () => setView('side'));
    document.getElementById('isoView').addEventListener('click', () => setView('iso'));
    
    // Animation toggle
    document.getElementById('animationToggle').addEventListener('change', function(e) {
        animationRunning = e.target.checked;
    });
    
    // Machine controls
    document.getElementById('speedControl').addEventListener('input', function(e) {
        machineSpeed = parseInt(e.target.value);
        document.getElementById('speedValue').textContent = machineSpeed + '%';
    });
    
    document.getElementById('productionMode').addEventListener('change', function(e) {
        productionMode = e.target.value;
    });
    
    document.getElementById('startMachine').addEventListener('click', startMachine);
    document.getElementById('stopMachine').addEventListener('click', stopMachine);
    
    // Simulation controls
    document.getElementById('runSimulation').addEventListener('click', runSimulation);
    document.getElementById('testScenario').addEventListener('click', testFailureScenario);
    document.getElementById('optimizeLayout').addEventListener('click', optimizeLayout);
    
    // Environment controls
    document.getElementById('lightingControl').addEventListener('input', function(e) {
        lightingLevel = parseInt(e.target.value);
        updateLighting();
    });
    
    document.getElementById('gridToggle').addEventListener('change', function(e) {
        showGrid = e.target.checked;
        toggleGrid();
    });
    
    document.getElementById('shadowToggle').addEventListener('change', function(e) {
        showShadows = e.target.checked;
        toggleShadows();
    });
    
    document.getElementById('fullscreenMode').addEventListener('click', toggleFullscreen);
    
    // Export and share
    document.getElementById('exportModel').addEventListener('click', exportModel);
    document.getElementById('shareView').addEventListener('click', shareView);
}

// Start data updates
function startDataUpdates() {
    updateSensorData();
    setInterval(updateSensorData, 3000); // Update every 3 seconds
}

// Update sensor data
async function updateSensorData() {
    try {
        const response = await fetch('/api/twin-data');
        if (!response.ok) throw new Error('Failed to fetch twin data');
        
        const data = await response.json();
        sensorData = data;
        
        updateSensorDisplay(data);
        updateSensorVisualization(data);
        updateAlerts(data);
        
    } catch (error) {
        console.error('Error updating twin data:', error);
    }
}

// Update sensor display panel
function updateSensorDisplay(data) {
    document.getElementById('twinTemp').textContent = `${data.temperature}°F`;
    document.getElementById('twinPressure').textContent = `${data.pressure} bar`;
    document.getElementById('twinRpm').textContent = `${data.rpm} rpm`;
    document.getElementById('twinPower').textContent = `${data.power} kW`;
    
    // Update status
    const statusElement = document.getElementById('twinStatus');
    statusElement.textContent = data.status;
    statusElement.className = `px-2 py-1 rounded-full text-xs font-semibold status-${data.status.toLowerCase()}`;
}

// Update 3D visualization based on sensor data
function updateSensorVisualization(data) {
    if (!machineGroup) return;
    
    // Update sensor indicator colors based on values
    machineGroup.children.forEach(child => {
        if (child.userData && child.userData.type) {
            const material = child.material;
            
            switch (child.userData.type) {
                case 'temperature':
                    const tempIntensity = Math.min(data.temperature / 100, 1);
                    material.emissive.setRGB(tempIntensity * 0.3, 0, 0);
                    break;
                    
                case 'pressure':
                    const pressureIntensity = Math.min(data.pressure / 2.5, 1);
                    material.emissive.setRGB(0, 0, pressureIntensity * 0.3);
                    break;
                    
                case 'vibration':
                    // Simulate vibration with slight random movement
                    if (data.rpm > 2000) {
                        const vibration = (Math.random() - 0.5) * 0.02;
                        child.position.x += vibration;
                        child.position.z += vibration;
                    }
                    break;
            }
        }
    });
    
    // Update machine color based on status
    if (machine) {
        switch (data.status) {
            case 'Operating':
                machine.material.color.setHex(0x10b981);
                break;
            case 'Warning':
                machine.material.color.setHex(0xf59e0b);
                break;
            case 'Critical':
                machine.material.color.setHex(0xef4444);
                break;
            default:
                machine.material.color.setHex(0x3b82f6);
        }
    }
}

// Update alerts display
function updateAlerts(data) {
    const alertsContainer = document.getElementById('twinAlerts');
    
    if (data.alerts && data.alerts.length > 0) {
        alertsContainer.innerHTML = data.alerts.map(alert => `
            <div class="alert-high p-2 rounded text-sm">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                ${alert}
            </div>
        `).join('');
    } else {
        alertsContainer.innerHTML = `
            <div class="text-gray-500 text-center py-4 text-sm">
                <i class="fas fa-check-circle text-green-400 text-lg mb-2"></i>
                <p>All systems normal</p>
            </div>
        `;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (animationRunning && machine && machineGroup) {
        const rpm = sensorData.rpm || 1500;
        const speedMultiplier = (machineSpeed / 100) * 0.05;
        
        switch (currentMachine) {
            case 'robot':
                // Rotate the main rotor
                machine.rotation.y += speedMultiplier * 2;
                break;
                
            case 'cnc':
                // Spin the CNC spindle
                machine.rotation.y += speedMultiplier * 5;
                break;
                
            case 'conveyor':
                // Move packages along conveyor
                machineGroup.children.forEach(child => {
                    if (child.userData && child.userData.type === 'package') {
                        child.position.x += speedMultiplier * 0.5;
                        if (child.position.x > 3) {
                            child.position.x = -3;
                        }
                    }
                });
                break;
                
            case 'assembly':
                // Rotate assembly arms
                machineGroup.children.forEach(child => {
                    if (child.userData && child.userData.type === 'arm') {
                        child.rotation.y += speedMultiplier * (1 + child.userData.index * 0.5);
                    }
                });
                machine.rotation.y += speedMultiplier;
                break;
                
            case 'press':
                // Hydraulic press up/down motion
                const time = Date.now() * 0.001;
                machine.position.y = 1.8 + Math.sin(time * speedMultiplier * 2) * 0.3;
                break;
        }
        
        // Add vibration effects for high speeds
        if (machineSpeed > 80) {
            const vibration = (Math.random() - 0.5) * 0.01;
            if (machine.originalPosition) {
                machine.position.x = machine.originalPosition.x + vibration;
                machine.position.z = machine.originalPosition.z + vibration;
            }
        }
    }
    
    if (controls) {
        controls.update();
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('twin-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Reset camera view
function resetView() {
    if (controls) {
        controls.reset();
    } else {
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 1, 0);
    }
}

// Switch machine type
function switchMachine(machineType) {
    // Clear existing machine
    if (machineGroup) {
        scene.remove(machineGroup);
    }
    
    // Create new machine based on type
    switch (machineType) {
        case 'cnc':
            createCNCMachine();
            break;
        case 'robot':
            createMachine(); // Existing robot arm
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
        default:
            createMachine();
    }
}

// Create CNC Machine
function createCNCMachine() {
    machineGroup = new THREE.Group();
    
    // CNC Base
    const baseGeometry = new THREE.BoxGeometry(3, 0.5, 2);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x2563eb });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    base.castShadow = true;
    machineGroup.add(base);
    
    // Spindle housing
    const housingGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
    const housingMaterial = new THREE.MeshPhongMaterial({ color: 0x1e293b });
    const housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.position.set(0, 1.25, 0);
    housing.castShadow = true;
    machineGroup.add(housing);
    
    // Spindle (rotating part)
    const spindleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);
    const spindleMaterial = new THREE.MeshPhongMaterial({ color: 0xef4444 });
    machine = new THREE.Mesh(spindleGeometry, spindleMaterial);
    machine.position.set(0, 0.75, 0);
    machine.castShadow = true;
    machineGroup.add(machine);
    
    // Work table
    const tableGeometry = new THREE.BoxGeometry(2, 0.2, 1.5);
    const tableMaterial = new THREE.MeshPhongMaterial({ color: 0x475569 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = 0.6;
    table.castShadow = true;
    machineGroup.add(table);
    
    createSensorIndicators();
    scene.add(machineGroup);
}

// Create Conveyor System
function createConveyorSystem() {
    machineGroup = new THREE.Group();
    
    // Conveyor belt
    const beltGeometry = new THREE.BoxGeometry(6, 0.2, 1);
    const beltMaterial = new THREE.MeshPhongMaterial({ color: 0x374151 });
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.y = 0.6;
    belt.castShadow = true;
    machineGroup.add(belt);
    
    // Rollers
    for (let i = 0; i < 7; i++) {
        const rollerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 16);
        const rollerMaterial = new THREE.MeshPhongMaterial({ color: 0x6b7280 });
        const roller = new THREE.Mesh(rollerGeometry, rollerMaterial);
        roller.position.set(-2.5 + i * 0.8, 0.5, 0);
        roller.rotation.z = Math.PI / 2;
        roller.castShadow = true;
        machineGroup.add(roller);
    }
    
    // Drive motor
    const motorGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const motorMaterial = new THREE.MeshPhongMaterial({ color: 0x10b981 });
    machine = new THREE.Mesh(motorGeometry, motorMaterial);
    machine.position.set(3, 0.4, 0);
    machine.castShadow = true;
    machineGroup.add(machine);
    
    // Moving packages
    for (let i = 0; i < 3; i++) {
        const packageGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const packageMaterial = new THREE.MeshPhongMaterial({ color: 0xf59e0b });
        const package = new THREE.Mesh(packageGeometry, packageMaterial);
        package.position.set(-2 + i * 1.5, 0.85, 0);
        package.castShadow = true;
        package.userData = { type: 'package', index: i };
        machineGroup.add(package);
    }
    
    createSensorIndicators();
    scene.add(machineGroup);
}

// Create Assembly Station
function createAssemblyStation() {
    machineGroup = new THREE.Group();
    
    // Main platform
    const platformGeometry = new THREE.BoxGeometry(2.5, 0.3, 2.5);
    const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x2563eb });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.15;
    platform.castShadow = true;
    machineGroup.add(platform);
    
    // Assembly arms
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const armGroup = new THREE.Group();
        
        const baseGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x1e293b });
        const armBase = new THREE.Mesh(baseGeometry, baseMaterial);
        armBase.position.y = 0.55;
        armBase.castShadow = true;
        armGroup.add(armBase);
        
        const armGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.1);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x6366f1 });
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(0.4, 0.8, 0);
        arm.castShadow = true;
        armGroup.add(arm);
        
        armGroup.position.set(
            Math.cos(angle) * 0.8,
            0,
            Math.sin(angle) * 0.8
        );
        armGroup.userData = { type: 'arm', index: i };
        machineGroup.add(armGroup);
    }
    
    // Central assembly point
    const centerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
    const centerMaterial = new THREE.MeshPhongMaterial({ color: 0xef4444 });
    machine = new THREE.Mesh(centerGeometry, centerMaterial);
    machine.position.y = 0.45;
    machine.castShadow = true;
    machineGroup.add(machine);
    
    createSensorIndicators();
    scene.add(machineGroup);
}

// Create Hydraulic Press
function createHydraulicPress() {
    machineGroup = new THREE.Group();
    
    // Frame
    const frameGeometry = new THREE.BoxGeometry(2, 3, 1.5);
    const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x1e293b });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 1.5;
    frame.castShadow = true;
    machineGroup.add(frame);
    
    // Hydraulic cylinder
    const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16);
    const cylinderMaterial = new THREE.MeshPhongMaterial({ color: 0x6b7280 });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(0, 2.5, 0);
    cylinder.castShadow = true;
    machineGroup.add(cylinder);
    
    // Press head (moving part)
    const headGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.2);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xef4444 });
    machine = new THREE.Mesh(headGeometry, headMaterial);
    machine.position.set(0, 1.8, 0);
    machine.castShadow = true;
    machineGroup.add(machine);
    
    // Base plate
    const baseGeometry = new THREE.BoxGeometry(1.8, 0.2, 1.4);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x475569 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.6;
    base.castShadow = true;
    machineGroup.add(base);
    
    createSensorIndicators();
    scene.add(machineGroup);
}

// Machine control functions
function startMachine() {
    animationRunning = true;
    document.getElementById('animationToggle').checked = true;
    console.log(`Starting ${currentMachine} machine`);
}

function stopMachine() {
    animationRunning = false;
    document.getElementById('animationToggle').checked = false;
    console.log(`Stopping ${currentMachine} machine`);
}

// Simulation functions
function runSimulation() {
    console.log('Running process simulation...');
    // Add visual feedback for simulation
    if (machine) {
        const originalColor = machine.material.color.getHex();
        machine.material.color.setHex(0x10b981);
        setTimeout(() => {
            machine.material.color.setHex(originalColor);
        }, 2000);
    }
}

function testFailureScenario() {
    console.log('Testing failure scenario...');
    if (machine) {
        machine.material.color.setHex(0xef4444);
        setTimeout(() => {
            machine.material.color.setHex(0x3b82f6);
        }, 3000);
    }
}

function optimizeLayout() {
    console.log('Optimizing layout...');
    // Animate camera for layout overview
    const originalPosition = camera.position.clone();
    camera.position.set(0, 15, 0);
    camera.lookAt(0, 0, 0);
    
    setTimeout(() => {
        camera.position.copy(originalPosition);
    }, 2000);
}

// Environment control functions
function updateLighting() {
    const intensity = lightingLevel / 100;
    scene.children.forEach(child => {
        if (child.type === 'DirectionalLight') {
            child.intensity = 0.8 * intensity;
        } else if (child.type === 'PointLight') {
            child.intensity = 0.6 * intensity;
        }
    });
}

function toggleGrid() {
    // Grid toggle functionality
    console.log('Grid toggled:', showGrid);
}

function toggleShadows() {
    renderer.shadowMap.enabled = showShadows;
    console.log('Shadows toggled:', showShadows);
}

function toggleFullscreen() {
    const container = document.getElementById('twin-container');
    if (!document.fullscreenElement) {
        container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function exportModel() {
    console.log('Exporting 3D model...');
    alert('Model export functionality would be implemented here');
}

function shareView() {
    console.log('Sharing current view...');
    const shareData = {
        machine: currentMachine,
        camera: {
            position: camera.position,
            rotation: camera.rotation
        },
        timestamp: new Date().toISOString()
    };
    
    navigator.clipboard.writeText(JSON.stringify(shareData)).then(() => {
        alert('View configuration copied to clipboard!');
    });
}

// Set predefined views
function setView(viewType) {
    switch (viewType) {
        case 'front':
            camera.position.set(0, 2, 8);
            camera.lookAt(0, 1, 0);
            break;
        case 'top':
            camera.position.set(0, 10, 0);
            camera.lookAt(0, 0, 0);
            break;
        case 'side':
            camera.position.set(8, 2, 0);
            camera.lookAt(0, 1, 0);
            break;
        case 'iso':
            camera.position.set(5, 5, 5);
            camera.lookAt(0, 1, 0);
            break;
    }
    
    if (controls) {
        controls.update();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (renderer) {
        renderer.dispose();
    }
    if (controls) {
        controls.dispose();
    }
});
