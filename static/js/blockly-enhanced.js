
// Enhanced Blockly Workspace JavaScript
let workspace;
let generatedCode = '';
let workspaceStats = { blocks: 0, lines: 0, complexity: 'Simple' };

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeBlockly();
    setupEventListeners();
    createCustomBlocks();
    updateWorkspaceStats();
    setupTabs();
});

// Initialize Blockly workspace
function initializeBlockly() {
    const toolbox = document.getElementById('toolbox');
    
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: toolbox,
        theme: {
            'base': Blockly.Themes.Classic,
            'componentStyles': {
                'workspaceBackgroundColour': '#0f172a',
                'toolboxBackgroundColour': '#1e293b',
                'toolboxForegroundColour': '#e5e7eb',
                'flyoutBackgroundColour': '#334155',
                'flyoutForegroundColour': '#e5e7eb',
                'flyoutOpacity': 0.8,
                'scrollbarColour': '#475569',
                'insertionMarkerColour': '#3b82f6',
                'insertionMarkerOpacity': 0.3
            }
        },
        grid: {
            spacing: 25,
            length: 3,
            colour: '#374151',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true,
        renderer: 'zelos'
    });
    
    // Listen for workspace changes
    workspace.addChangeListener(onWorkspaceChange);
    
    // Initial code generation
    generateCodePreview();
}

// Setup event listeners
function setupEventListeners() {
    // File operations
    document.getElementById('newWorkspace').addEventListener('click', newWorkspace);
    document.getElementById('saveWorkspace').addEventListener('click', saveWorkspace);
    document.getElementById('loadWorkspace').addEventListener('click', loadWorkspace);
    document.getElementById('clearWorkspace').addEventListener('click', clearWorkspace);
    
    // View controls
    document.getElementById('zoomIn').addEventListener('click', () => workspace.zoomCenter(1));
    document.getElementById('zoomOut').addEventListener('click', () => workspace.zoomCenter(-1));
    document.getElementById('centerView').addEventListener('click', () => workspace.scrollCenter());
    document.getElementById('fullscreen').addEventListener('click', toggleFullscreen);
    
    // Code generation and tools
    document.getElementById('generateCode').addEventListener('click', showCodeModal);
    document.getElementById('validateBlocks').addEventListener('click', validateWorkspace);
    document.getElementById('runSimulation').addEventListener('click', runSimulation);
    
    // Export buttons
    document.getElementById('exportPython').addEventListener('click', () => exportFile('python'));
    document.getElementById('exportJson').addEventListener('click', () => exportFile('json'));
    document.getElementById('exportXml').addEventListener('click', () => exportFile('xml'));
    document.getElementById('exportImage').addEventListener('click', () => exportFile('image'));
    document.getElementById('shareWorkspace').addEventListener('click', shareWorkspace);
    
    // Preview panel
    document.getElementById('copyPreview').addEventListener('click', copyCodeToClipboard);
    document.getElementById('downloadPreview').addEventListener('click', downloadGeneratedCode);
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', hideCodeModal);
    document.getElementById('copyCode').addEventListener('click', copyCodeToClipboard);
    document.getElementById('downloadCodeFile').addEventListener('click', downloadGeneratedCode);
    
    // Close modal on background click
    document.getElementById('codeModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideCodeModal();
        }
    });
}

// Setup tab functionality
function setupTabs() {
    const tabs = ['previewTab', 'exportTab', 'helpTab'];
    const contents = ['previewContent', 'exportContent', 'helpContent'];
    
    tabs.forEach((tabId, index) => {
        document.getElementById(tabId).addEventListener('click', () => {
            // Update tab styles
            tabs.forEach(t => {
                document.getElementById(t).className = 'tab-inactive flex-1 px-4 py-2 text-sm font-medium';
            });
            document.getElementById(tabId).className = 'tab-active flex-1 px-4 py-2 text-sm font-medium';
            
            // Show/hide content
            contents.forEach(c => {
                document.getElementById(c).classList.add('hidden');
            });
            document.getElementById(contents[index]).classList.remove('hidden');
        });
    });
}

// Create enhanced custom SmartX blocks
function createCustomBlocks() {
    // Enhanced Sensor Blocks
    createSensorBlocks();
    createActionBlocks();
    createDataProcessingBlocks();
    createMLBlocks();
    createCommunicationBlocks();
    createTimeBlocks();
}

function createSensorBlocks() {
    // Temperature sensor with range
    Blockly.Blocks['smartx_read_temperature'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("read temperature sensor")
                .appendField(new Blockly.FieldDropdown([
                    ["°C", "CELSIUS"],
                    ["°F", "FAHRENHEIT"],
                    ["K", "KELVIN"]
                ]), "UNIT");
            this.setOutput(true, "Number");
            this.setColour(15);
            this.setTooltip("Read temperature from SmartX sensor in specified unit");
        }
    };
    
    Blockly.Python['smartx_read_temperature'] = function(block) {
        const unit = block.getFieldValue('UNIT');
        const code = `read_temperature_sensor('${unit}')`;
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
    };

    // Additional sensor blocks
    const sensors = [
        {name: 'pressure', color: 15, tooltip: 'Read pressure from SmartX sensor'},
        {name: 'vibration', color: 15, tooltip: 'Read vibration from SmartX sensor'},
        {name: 'humidity', color: 15, tooltip: 'Read humidity from SmartX sensor'},
        {name: 'power', color: 15, tooltip: 'Read power consumption from SmartX sensor'},
        {name: 'flow', color: 15, tooltip: 'Read flow rate from SmartX sensor'},
        {name: 'level', color: 15, tooltip: 'Read level from SmartX sensor'},
        {name: 'ph', color: 15, tooltip: 'Read pH value from SmartX sensor'},
        {name: 'conductivity', color: 15, tooltip: 'Read conductivity from SmartX sensor'},
        {name: 'gas', color: 15, tooltip: 'Read gas concentration from SmartX sensor'}
    ];

    sensors.forEach(sensor => {
        Blockly.Blocks[`smartx_read_${sensor.name}`] = {
            init: function() {
                this.appendDummyInput()
                    .appendField(`read ${sensor.name} sensor`);
                this.setOutput(true, "Number");
                this.setColour(sensor.color);
                this.setTooltip(sensor.tooltip);
            }
        };
        
        Blockly.Python[`smartx_read_${sensor.name}`] = function(block) {
            const code = `read_${sensor.name}_sensor()`;
            return [code, Blockly.Python.ORDER_FUNCTION_CALL];
        };
    });
}

function createActionBlocks() {
    // Enhanced alert block with severity
    Blockly.Blocks['smartx_send_alert'] = {
        init: function() {
            this.appendValueInput("MESSAGE")
                .setCheck("String")
                .appendField("send alert");
            this.appendDummyInput()
                .appendField("severity")
                .appendField(new Blockly.FieldDropdown([
                    ["low", "LOW"],
                    ["medium", "MEDIUM"],
                    ["high", "HIGH"],
                    ["critical", "CRITICAL"]
                ]), "SEVERITY");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(0);
            this.setTooltip("Send alert message with severity level");
        }
    };
    
    Blockly.Python['smartx_send_alert'] = function(block) {
        const message = Blockly.Python.valueToCode(block, 'MESSAGE', Blockly.Python.ORDER_ATOMIC);
        const severity = block.getFieldValue('SEVERITY');
        const code = `send_alert(${message}, severity='${severity}')\n`;
        return code;
    };

    // Additional action blocks
    const actions = [
        {name: 'log_event', params: 'EVENT', tooltip: 'Log event to SmartX system'},
        {name: 'send_notification', params: 'MESSAGE', tooltip: 'Send notification to users'},
        {name: 'update_database', params: 'DATA', tooltip: 'Update database with new data'},
        {name: 'trigger_alarm', params: 'ALARM_TYPE', tooltip: 'Trigger system alarm'},
        {name: 'create_report', params: 'REPORT_TYPE', tooltip: 'Generate system report'}
    ];

    actions.forEach(action => {
        Blockly.Blocks[`smartx_${action.name}`] = {
            init: function() {
                this.appendValueInput(action.params)
                    .setCheck("String")
                    .appendField(action.name.replace('_', ' '));
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip(action.tooltip);
            }
        };
        
        Blockly.Python[`smartx_${action.name}`] = function(block) {
            const param = Blockly.Python.valueToCode(block, action.params, Blockly.Python.ORDER_ATOMIC);
            const code = `${action.name}(${param})\n`;
            return code;
        };
    });

    // Enhanced machine control
    Blockly.Blocks['smartx_control_machine'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("control machine")
                .appendField(new Blockly.FieldDropdown([
                    ["start", "START"],
                    ["stop", "STOP"],
                    ["pause", "PAUSE"],
                    ["reset", "RESET"],
                    ["maintenance mode", "MAINTENANCE"],
                    ["emergency stop", "EMERGENCY"]
                ]), "ACTION");
            this.appendValueInput("DURATION")
                .setCheck("Number")
                .appendField("for");
            this.appendDummyInput()
                .appendField("seconds (optional)");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(0);
            this.setTooltip("Control SmartX machine operations with optional duration");
        }
    };
    
    Blockly.Python['smartx_control_machine'] = function(block) {
        const action = block.getFieldValue('ACTION');
        const duration = Blockly.Python.valueToCode(block, 'DURATION', Blockly.Python.ORDER_ATOMIC);
        const code = duration ? 
            `control_machine('${action}', duration=${duration})\n` :
            `control_machine('${action}')\n`;
        return code;
    };
}

function createDataProcessingBlocks() {
    const dataBlocks = [
        {name: 'filter_data', tooltip: 'Filter data based on conditions'},
        {name: 'calculate_average', tooltip: 'Calculate average of data points'},
        {name: 'find_anomaly', tooltip: 'Detect anomalies in data'},
        {name: 'aggregate_data', tooltip: 'Aggregate data over time period'},
        {name: 'transform_data', tooltip: 'Transform data format'},
        {name: 'validate_data', tooltip: 'Validate data integrity'}
    ];

    dataBlocks.forEach(block => {
        Blockly.Blocks[`smartx_${block.name}`] = {
            init: function() {
                this.appendValueInput("DATA")
                    .setCheck(null)
                    .appendField(block.name.replace('_', ' '));
                this.setOutput(true, null);
                this.setColour(200);
                this.setTooltip(block.tooltip);
            }
        };
        
        Blockly.Python[`smartx_${block.name}`] = function(block) {
            const data = Blockly.Python.valueToCode(block, 'DATA', Blockly.Python.ORDER_ATOMIC);
            const code = `${block.name}(${data})`;
            return [code, Blockly.Python.ORDER_FUNCTION_CALL];
        };
    });
}

function createMLBlocks() {
    const mlBlocks = [
        {name: 'predict_failure', tooltip: 'Predict equipment failure probability'},
        {name: 'classify_data', tooltip: 'Classify data into categories'},
        {name: 'optimize_process', tooltip: 'Optimize process parameters'},
        {name: 'detect_pattern', tooltip: 'Detect patterns in data'},
        {name: 'forecast_trend', tooltip: 'Forecast future trends'}
    ];

    mlBlocks.forEach(block => {
        Blockly.Blocks[`smartx_${block.name}`] = {
            init: function() {
                this.appendValueInput("INPUT_DATA")
                    .setCheck(null)
                    .appendField(block.name.replace('_', ' '));
                this.appendDummyInput()
                    .appendField("model")
                    .appendField(new Blockly.FieldDropdown([
                        ["neural network", "NN"],
                        ["random forest", "RF"],
                        ["svm", "SVM"],
                        ["linear regression", "LR"]
                    ]), "MODEL");
                this.setOutput(true, null);
                this.setColour(290);
                this.setTooltip(block.tooltip);
            }
        };
        
        Blockly.Python[`smartx_${block.name}`] = function(block) {
            const data = Blockly.Python.valueToCode(block, 'INPUT_DATA', Blockly.Python.ORDER_ATOMIC);
            const model = block.getFieldValue('MODEL');
            const code = `${block.name}(${data}, model='${model}')`;
            return [code, Blockly.Python.ORDER_FUNCTION_CALL];
        };
    });
}

function createCommunicationBlocks() {
    // MQTT blocks
    Blockly.Blocks['smartx_mqtt_publish'] = {
        init: function() {
            this.appendValueInput("TOPIC")
                .setCheck("String")
                .appendField("MQTT publish to topic");
            this.appendValueInput("MESSAGE")
                .setCheck("String")
                .appendField("message");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(210);
            this.setTooltip("Publish message to MQTT topic");
        }
    };
    
    Blockly.Python['smartx_mqtt_publish'] = function(block) {
        const topic = Blockly.Python.valueToCode(block, 'TOPIC', Blockly.Python.ORDER_ATOMIC);
        const message = Blockly.Python.valueToCode(block, 'MESSAGE', Blockly.Python.ORDER_ATOMIC);
        const code = `mqtt_publish(${topic}, ${message})\n`;
        return code;
    };

    Blockly.Blocks['smartx_mqtt_subscribe'] = {
        init: function() {
            this.appendValueInput("TOPIC")
                .setCheck("String")
                .appendField("MQTT subscribe to topic");
            this.setOutput(true, "String");
            this.setColour(210);
            this.setTooltip("Subscribe to MQTT topic and get message");
        }
    };
    
    Blockly.Python['smartx_mqtt_subscribe'] = function(block) {
        const topic = Blockly.Python.valueToCode(block, 'TOPIC', Blockly.Python.ORDER_ATOMIC);
        const code = `mqtt_subscribe(${topic})`;
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
    };

    // HTTP and other communication blocks
    const commBlocks = [
        {name: 'http_request', params: ['URL', 'METHOD'], tooltip: 'Make HTTP request'},
        {name: 'send_email', params: ['TO', 'SUBJECT', 'BODY'], tooltip: 'Send email notification'},
        {name: 'webhook', params: ['URL', 'DATA'], tooltip: 'Send webhook notification'}
    ];

    commBlocks.forEach(block => {
        Blockly.Blocks[`smartx_${block.name}`] = {
            init: function() {
                block.params.forEach(param => {
                    this.appendValueInput(param)
                        .setCheck("String")
                        .appendField(param.toLowerCase());
                });
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(210);
                this.setTooltip(block.tooltip);
            }
        };
        
        Blockly.Python[`smartx_${block.name}`] = function(blk) {
            const params = block.params.map(p => 
                Blockly.Python.valueToCode(blk, p, Blockly.Python.ORDER_ATOMIC)
            ).join(', ');
            const code = `${block.name}(${params})\n`;
            return code;
        };
    });
}

function createTimeBlocks() {
    // Wait block
    Blockly.Blocks['smartx_wait_seconds'] = {
        init: function() {
            this.appendValueInput("SECONDS")
                .setCheck("Number")
                .appendField("wait");
            this.appendDummyInput()
                .appendField("seconds");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("Wait for specified number of seconds");
        }
    };
    
    Blockly.Python['smartx_wait_seconds'] = function(block) {
        const seconds = Blockly.Python.valueToCode(block, 'SECONDS', Blockly.Python.ORDER_ATOMIC);
        const code = `time.sleep(${seconds})\n`;
        return code;
    };

    // Get timestamp
    Blockly.Blocks['smartx_get_timestamp'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("get current timestamp")
                .appendField(new Blockly.FieldDropdown([
                    ["unix", "UNIX"],
                    ["iso", "ISO"],
                    ["formatted", "FORMATTED"]
                ]), "FORMAT");
            this.setOutput(true, "String");
            this.setColour(120);
            this.setTooltip("Get current timestamp in specified format");
        }
    };
    
    Blockly.Python['smartx_get_timestamp'] = function(block) {
        const format = block.getFieldValue('FORMAT');
        const code = `get_timestamp('${format}')`;
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
    };

    // Additional time blocks
    const timeBlocks = [
        {name: 'schedule_task', tooltip: 'Schedule task for future execution'},
        {name: 'check_time_range', tooltip: 'Check if current time is in range'},
        {name: 'format_datetime', tooltip: 'Format datetime string'}
    ];

    timeBlocks.forEach(block => {
        Blockly.Blocks[`smartx_${block.name}`] = {
            init: function() {
                this.appendValueInput("INPUT")
                    .setCheck(null)
                    .appendField(block.name.replace('_', ' '));
                this.setOutput(true, null);
                this.setColour(120);
                this.setTooltip(block.tooltip);
            }
        };
        
        Blockly.Python[`smartx_${block.name}`] = function(blk) {
            const input = Blockly.Python.valueToCode(blk, 'INPUT', Blockly.Python.ORDER_ATOMIC);
            const code = `${block.name}(${input})`;
            return [code, Blockly.Python.ORDER_FUNCTION_CALL];
        };
    });
}

// Handle workspace changes
function onWorkspaceChange(event) {
    generateCodePreview();
    updateWorkspaceStats();
    updateExportButtons();
}

// Generate enhanced code preview
function generateCodePreview() {
    try {
        Blockly.Python.INFINITE_LOOP_TRAP = null;
        const blockCode = Blockly.Python.workspaceToCode(workspace);
        
        // Enhanced header with more imports and functions
        const headerCode = `#!/usr/bin/env python3
"""
SmartX Enhanced Automation Code
Generated automatically from visual blocks
Timestamp: ${new Date().toISOString()}
"""

# Core imports
import time
import random
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

# SmartX specific imports
import paho.mqtt.client as mqtt
import requests
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class SensorReading:
    """Data class for sensor readings"""
    sensor_type: str
    value: float
    unit: str
    timestamp: datetime
    location: str = "default"

# SmartX Enhanced Sensor Functions
def read_temperature_sensor(unit='CELSIUS'):
    """Read temperature with unit conversion"""
    base_temp = random.randint(60, 100)
    if unit == 'FAHRENHEIT':
        return (base_temp * 9/5) + 32
    elif unit == 'KELVIN':
        return base_temp + 273.15
    return base_temp

def read_pressure_sensor():
    """Read pressure sensor data"""
    return round(random.uniform(1.0, 2.5), 2)

def read_vibration_sensor():
    """Read vibration sensor data"""
    return round(random.uniform(0.1, 1.0), 2)

def read_humidity_sensor():
    """Read humidity sensor data"""
    return random.randint(30, 70)

def read_power_sensor():
    """Read power consumption data"""
    return round(random.uniform(100, 1000), 2)

def read_flow_sensor():
    """Read flow rate data"""
    return round(random.uniform(10, 100), 2)

def read_level_sensor():
    """Read level sensor data"""
    return round(random.uniform(0, 100), 1)

def read_ph_sensor():
    """Read pH sensor data"""
    return round(random.uniform(6.5, 8.5), 2)

def read_conductivity_sensor():
    """Read conductivity sensor data"""
    return round(random.uniform(100, 1000), 1)

def read_gas_sensor():
    """Read gas concentration data"""
    return round(random.uniform(0, 50), 2)

# Enhanced Action Functions
def send_alert(message, severity='MEDIUM'):
    """Send alert with severity level"""
    logger.warning(f"ALERT [{severity}]: {message}")
    # In production: integrate with notification system

def log_event(event):
    """Log event with timestamp"""
    logger.info(f"EVENT [{datetime.now()}]: {event}")

def send_notification(message):
    """Send notification to users"""
    logger.info(f"NOTIFICATION: {message}")

def update_database(data):
    """Update database with new data"""
    logger.info(f"DATABASE UPDATE: {data}")

def trigger_alarm(alarm_type):
    """Trigger system alarm"""
    logger.critical(f"ALARM TRIGGERED: {alarm_type}")

def create_report(report_type):
    """Generate system report"""
    logger.info(f"GENERATING REPORT: {report_type}")

def control_machine(action, duration=None):
    """Control machine with optional duration"""
    if duration:
        logger.info(f"MACHINE CONTROL: {action} for {duration} seconds")
    else:
        logger.info(f"MACHINE CONTROL: {action}")

def schedule_maintenance(hours):
    """Schedule maintenance"""
    schedule_time = datetime.now() + timedelta(hours=hours)
    logger.info(f"MAINTENANCE SCHEDULED: {schedule_time}")

# Data Processing Functions
def filter_data(data):
    """Filter data based on conditions"""
    return data  # Placeholder implementation

def calculate_average(data):
    """Calculate average of data points"""
    if isinstance(data, list) and data:
        return sum(data) / len(data)
    return 0

def find_anomaly(data):
    """Detect anomalies in data"""
    return random.choice([True, False])  # Placeholder

def aggregate_data(data):
    """Aggregate data over time period"""
    return data  # Placeholder implementation

def transform_data(data):
    """Transform data format"""
    return data  # Placeholder implementation

def validate_data(data):
    """Validate data integrity"""
    return data is not None

# ML/AI Functions
def predict_failure(data, model='NN'):
    """Predict equipment failure probability"""
    return round(random.uniform(0, 1), 3)

def classify_data(data, model='RF'):
    """Classify data into categories"""
    categories = ['normal', 'warning', 'critical']
    return random.choice(categories)

def optimize_process(data, model='SVM'):
    """Optimize process parameters"""
    return {"optimized": True, "improvement": random.uniform(0, 20)}

def detect_pattern(data, model='NN'):
    """Detect patterns in data"""
    return {"pattern_detected": random.choice([True, False])}

def forecast_trend(data, model='LR'):
    """Forecast future trends"""
    return {"trend": random.choice(["increasing", "decreasing", "stable"])}

# Communication Functions
def mqtt_publish(topic, message):
    """Publish message to MQTT topic"""
    logger.info(f"MQTT PUBLISH: Topic={topic}, Message={message}")

def mqtt_subscribe(topic):
    """Subscribe to MQTT topic"""
    logger.info(f"MQTT SUBSCRIBE: Topic={topic}")
    return f"message_from_{topic}"

def http_request(url, method):
    """Make HTTP request"""
    logger.info(f"HTTP {method}: {url}")
    return {"status": "success"}

def send_email(to, subject, body):
    """Send email notification"""
    logger.info(f"EMAIL: To={to}, Subject={subject}")

def webhook(url, data):
    """Send webhook notification"""
    logger.info(f"WEBHOOK: URL={url}, Data={data}")

# Time and Schedule Functions
def get_timestamp(format_type='ISO'):
    """Get current timestamp in specified format"""
    now = datetime.now()
    if format_type == 'UNIX':
        return int(now.timestamp())
    elif format_type == 'FORMATTED':
        return now.strftime('%Y-%m-%d %H:%M:%S')
    else:  # ISO
        return now.isoformat()

def schedule_task(task_info):
    """Schedule task for future execution"""
    logger.info(f"TASK SCHEDULED: {task_info}")

def check_time_range(time_range):
    """Check if current time is in range"""
    return True  # Placeholder implementation

def format_datetime(datetime_str):
    """Format datetime string"""
    return datetime_str  # Placeholder implementation

# Main execution function
def main():
    """Main automation workflow"""
    logger.info("SmartX Enhanced Automation Starting...")
    
    try:
${blockCode.split('\n').map(line => '        ' + line).join('\n')}
        
        logger.info("SmartX Automation Completed Successfully")
        
    except Exception as e:
        logger.error(f"Automation Error: {str(e)}")
        send_alert(f"Automation failed: {str(e)}", severity='CRITICAL')

if __name__ == "__main__":
    main()
`;
        
        // Update preview
        const preview = document.getElementById('codePreview');
        if (blockCode.trim()) {
            preview.textContent = blockCode;
        } else {
            preview.textContent = '// Build your workflow to see generated code...';
        }
        
        // Store full code for modal
        generatedCode = headerCode;
        
    } catch (error) {
        console.error('Code generation error:', error);
        document.getElementById('codePreview').textContent = '// Error generating code';
    }
}

// Update workspace statistics
function updateWorkspaceStats() {
    const blocks = workspace.getAllBlocks();
    const blockCount = blocks.length;
    const codeLines = generatedCode.split('\n').filter(line => line.trim()).length;
    
    let complexity = 'Simple';
    if (blockCount > 30) complexity = 'Complex';
    else if (blockCount > 15) complexity = 'Moderate';
    
    workspaceStats = { blocks: blockCount, lines: codeLines, complexity };
    
    // Update display
    document.getElementById('blockCount').textContent = blockCount;
    document.getElementById('codeLines').textContent = codeLines;
    document.getElementById('complexity').textContent = complexity;
}

// Enhanced workspace operations
function newWorkspace() {
    if (workspace.getAllBlocks().length > 0) {
        if (confirm('Create a new workspace? This will clear all current blocks.')) {
            workspace.clear();
            generateCodePreview();
            updateWorkspaceStats();
            showFeedback('New workspace created', 'success');
        }
    }
}

function saveWorkspace() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToPrettyText(xml);
    const timestamp = new Date().toISOString();
    
    const workspaceData = {
        xml: xmlText,
        timestamp: timestamp,
        stats: workspaceStats,
        version: '2.0'
    };
    
    localStorage.setItem('smartx_blockly_workspace', JSON.stringify(workspaceData));
    showFeedback('Workspace saved successfully', 'success');
}

function loadWorkspace() {
    const savedData = localStorage.getItem('smartx_blockly_workspace');
    if (savedData) {
        try {
            const workspaceData = JSON.parse(savedData);
            const xml = Blockly.Xml.textToDom(workspaceData.xml);
            workspace.clear();
            Blockly.Xml.domToWorkspace(xml, workspace);
            showFeedback('Workspace loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading workspace:', error);
            showFeedback('Error loading workspace', 'error');
        }
    } else {
        showFeedback('No saved workspace found', 'warning');
    }
}

function clearWorkspace() {
    if (confirm('Are you sure you want to clear the entire workspace?')) {
        workspace.clear();
        generateCodePreview();
        updateWorkspaceStats();
        showFeedback('Workspace cleared', 'success');
    }
}

// Enhanced validation and simulation
function validateWorkspace() {
    const blocks = workspace.getAllBlocks();
    const issues = [];
    
    // Check for disconnected blocks
    const topBlocks = workspace.getTopBlocks();
    const disconnectedBlocks = blocks.filter(block => !block.getParent() && !topBlocks.includes(block));
    
    if (disconnectedBlocks.length > 0) {
        issues.push(`${disconnectedBlocks.length} disconnected blocks found`);
    }
    
    // Check for infinite loops
    topBlocks.forEach(block => {
        if (hasInfiniteLoop(block)) {
            issues.push('Potential infinite loop detected');
        }
    });
    
    // Display validation results
    if (issues.length === 0) {
        showFeedback('Validation passed: No issues found', 'success');
    } else {
        showFeedback(`Validation warnings: ${issues.join(', ')}`, 'warning');
    }
}

function hasInfiniteLoop(block) {
    // Simple infinite loop detection (can be enhanced)
    if (block.type === 'controls_whileUntil') {
        const condition = block.getInputTargetBlock('BOOL');
        if (condition && condition.type === 'logic_boolean' && condition.getFieldValue('BOOL') === 'TRUE') {
            return true;
        }
    }
    return false;
}

function runSimulation() {
    showFeedback('Running simulation...', 'info');
    
    // Simulate code execution
    setTimeout(() => {
        const blocks = workspace.getAllBlocks();
        const simulationResults = {
            executedBlocks: blocks.length,
            estimatedRuntime: Math.random() * 10 + 1,
            memoryUsage: Math.random() * 100 + 50,
            warnings: Math.floor(Math.random() * 3)
        };
        
        showSimulationResults(simulationResults);
    }, 2000);
}

function showSimulationResults(results) {
    const message = `Simulation Complete:
• Executed ${results.executedBlocks} blocks
• Runtime: ${results.estimatedRuntime.toFixed(2)}s
• Memory: ${results.memoryUsage.toFixed(1)}MB
• Warnings: ${results.warnings}`;
    
    showFeedback(message, 'success');
}

// Enhanced export functionality
function exportFile(format) {
    let content, filename, mimeType;
    
    switch (format) {
        case 'python':
            content = generatedCode;
            filename = `smartx_workflow_${Date.now()}.py`;
            mimeType = 'text/plain';
            break;
            
        case 'json':
            const workspaceData = {
                timestamp: new Date().toISOString(),
                blocks: workspace.getAllBlocks().length,
                xml: Blockly.Xml.workspaceToDom(workspace),
                code: generatedCode,
                stats: workspaceStats,
                version: '2.0'
            };
            content = JSON.stringify(workspaceData, null, 2);
            filename = `smartx_workspace_${Date.now()}.json`;
            mimeType = 'application/json';
            break;
            
        case 'xml':
            const xml = Blockly.Xml.workspaceToDom(workspace);
            content = Blockly.Xml.domToPrettyText(xml);
            filename = `smartx_blocks_${Date.now()}.xml`;
            mimeType = 'application/xml';
            break;
            
        case 'image':
            exportAsImage();
            return;
            
        default:
            return;
    }
    
    downloadFile(content, filename, mimeType);
    showFeedback(`Exported as ${format.toUpperCase()}`, 'success');
}

function exportAsImage() {
    // Convert workspace to SVG and then to PNG
    const svg = workspace.getInjectionDiv().querySelector('.blocklyMainBackground').parentNode;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `smartx_blocks_${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(link.href);
        });
        
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
}

function shareWorkspace() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToPrettyText(xml);
    const shareData = btoa(encodeURIComponent(xmlText));
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareData}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        showFeedback('Share link copied to clipboard', 'success');
    }).catch(() => {
        showFeedback('Failed to copy share link', 'error');
    });
}

// Utility functions
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showFeedback(message, type) {
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm`;
    notification.innerHTML = `<div class="flex items-center"><i class="fas fa-info-circle mr-2"></i><span>${message}</span></div>`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

function toggleFullscreen() {
    const blocklyDiv = document.getElementById('blocklyDiv');
    if (!document.fullscreenElement) {
        blocklyDiv.requestFullscreen().then(() => {
            workspace.resize();
        });
    } else {
        document.exitFullscreen().then(() => {
            workspace.resize();
        });
    }
}

function updateExportButtons() {
    const hasBlocks = workspace.getAllBlocks().length > 0;
    
    ['exportPython', 'exportJson', 'exportXml', 'exportImage', 'shareWorkspace'].forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.disabled = !hasBlocks;
        }
    });
}

// Modal functions
function showCodeModal() {
    const modal = document.getElementById('codeModal');
    const fullCodePreview = document.getElementById('fullCodePreview');
    
    fullCodePreview.textContent = generatedCode;
    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
}

function hideCodeModal() {
    const modal = document.getElementById('codeModal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-enter');
}

async function copyCodeToClipboard() {
    try {
        await navigator.clipboard.writeText(generatedCode);
        showFeedback('Code copied to clipboard', 'success');
    } catch (error) {
        console.error('Failed to copy code:', error);
        showFeedback('Failed to copy code to clipboard', 'error');
    }
}

function downloadGeneratedCode() {
    downloadFile(generatedCode, `smartx_automation_${new Date().toISOString().split('T')[0]}.py`, 'text/plain');
    showFeedback('Code downloaded successfully', 'success');
}

// Template loading with enhanced templates
function loadTemplate(templateType) {
    let xml;
    
    const templates = {
        monitoring: getMonitoringTemplate(),
        alert: getAlertTemplate(),
        maintenance: getMaintenanceTemplate(),
        control: getControlTemplate(),
        data_processing: getDataProcessingTemplate(),
        ml_prediction: getMLTemplate()
    };
    
    xml = templates[templateType];
    
    if (xml) {
        try {
            workspace.clear();
            const xmlDom = Blockly.Xml.textToDom(xml);
            Blockly.Xml.domToWorkspace(xmlDom, workspace);
            showFeedback(`${templateType.replace('_', ' ')} template loaded`, 'success');
        } catch (error) {
            console.error('Error loading template:', error);
            showFeedback('Error loading template', 'error');
        }
    }
}

// Template definitions (enhanced)
function getMonitoringTemplate() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="controls_whileUntil" x="50" y="50">
            <field name="MODE">WHILE</field>
            <value name="BOOL">
                <block type="logic_boolean">
                    <field name="BOOL">TRUE</field>
                </block>
            </value>
            <statement name="DO">
                <block type="variables_set">
                    <field name="VAR">temperature</field>
                    <value name="VALUE">
                        <block type="smartx_read_temperature">
                            <field name="UNIT">CELSIUS</field>
                        </block>
                    </value>
                    <next>
                        <block type="variables_set">
                            <field name="VAR">pressure</field>
                            <value name="VALUE">
                                <block type="smartx_read_pressure"></block>
                            </value>
                            <next>
                                <block type="smartx_log_event">
                                    <value name="EVENT">
                                        <block type="text_join">
                                            <mutation items="4"></mutation>
                                            <value name="ADD0">
                                                <block type="text">
                                                    <field name="TEXT">Temp: </field>
                                                </block>
                                            </value>
                                            <value name="ADD1">
                                                <block type="variables_get">
                                                    <field name="VAR">temperature</field>
                                                </block>
                                            </value>
                                            <value name="ADD2">
                                                <block type="text">
                                                    <field name="TEXT">°C, Pressure: </field>
                                                </block>
                                            </value>
                                            <value name="ADD3">
                                                <block type="variables_get">
                                                    <field name="VAR">pressure</field>
                                                </block>
                                            </value>
                                        </block>
                                    </value>
                                    <next>
                                        <block type="smartx_wait_seconds">
                                            <value name="SECONDS">
                                                <block type="math_number">
                                                    <field name="NUM">5</field>
                                                </block>
                                            </value>
                                        </block>
                                    </next>
                                </block>
                            </next>
                        </block>
                    </next>
                </block>
            </statement>
        </block>
    </xml>`;
}

function getDataProcessingTemplate() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="variables_set" x="50" y="50">
            <field name="VAR">sensor_data</field>
            <value name="VALUE">
                <block type="lists_create_with">
                    <mutation items="3"></mutation>
                    <value name="ADD0">
                        <block type="smartx_read_temperature">
                            <field name="UNIT">CELSIUS</field>
                        </block>
                    </value>
                    <value name="ADD1">
                        <block type="smartx_read_pressure"></block>
                    </value>
                    <value name="ADD2">
                        <block type="smartx_read_humidity"></block>
                    </value>
                </block>
            </value>
            <next>
                <block type="variables_set">
                    <field name="VAR">filtered_data</field>
                    <value name="VALUE">
                        <block type="smartx_filter_data">
                            <value name="DATA">
                                <block type="variables_get">
                                    <field name="VAR">sensor_data</field>
                                </block>
                            </value>
                        </block>
                    </value>
                    <next>
                        <block type="variables_set">
                            <field name="VAR">average</field>
                            <value name="VALUE">
                                <block type="smartx_calculate_average">
                                    <value name="DATA">
                                        <block type="variables_get">
                                            <field name="VAR">filtered_data</field>
                                        </block>
                                    </value>
                                </block>
                            </value>
                            <next>
                                <block type="smartx_update_database">
                                    <value name="DATA">
                                        <block type="variables_get">
                                            <field name="VAR">average</field>
                                        </block>
                                    </value>
                                </block>
                            </next>
                        </block>
                    </next>
                </block>
            </next>
        </block>
    </xml>`;
}

function getMLTemplate() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="variables_set" x="50" y="50">
            <field name="VAR">sensor_readings</field>
            <value name="VALUE">
                <block type="lists_create_with">
                    <mutation items="4"></mutation>
                    <value name="ADD0">
                        <block type="smartx_read_temperature">
                            <field name="UNIT">CELSIUS</field>
                        </block>
                    </value>
                    <value name="ADD1">
                        <block type="smartx_read_vibration"></block>
                    </value>
                    <value name="ADD2">
                        <block type="smartx_read_pressure"></block>
                    </value>
                    <value name="ADD3">
                        <block type="smartx_read_power"></block>
                    </value>
                </block>
            </value>
            <next>
                <block type="variables_set">
                    <field name="VAR">failure_probability</field>
                    <value name="VALUE">
                        <block type="smartx_predict_failure">
                            <field name="MODEL">NN</field>
                            <value name="INPUT_DATA">
                                <block type="variables_get">
                                    <field name="VAR">sensor_readings</field>
                                </block>
                            </value>
                        </block>
                    </value>
                    <next>
                        <block type="controls_if">
                            <value name="IF0">
                                <block type="logic_compare">
                                    <field name="OP">GT</field>
                                    <value name="A">
                                        <block type="variables_get">
                                            <field name="VAR">failure_probability</field>
                                        </block>
                                    </value>
                                    <value name="B">
                                        <block type="math_number">
                                            <field name="NUM">0.7</field>
                                        </block>
                                    </value>
                                </block>
                            </value>
                            <statement name="DO0">
                                <block type="smartx_send_alert">
                                    <field name="SEVERITY">HIGH</field>
                                    <value name="MESSAGE">
                                        <block type="text">
                                            <field name="TEXT">Predicted equipment failure risk is high!</field>
                                        </block>
                                    </value>
                                    <next>
                                        <block type="smartx_schedule_maintenance">
                                            <value name="HOURS">
                                                <block type="math_number">
                                                    <field name="NUM">24</field>
                                                </block>
                                            </value>
                                        </block>
                                    </next>
                                </block>
                            </statement>
                        </block>
                    </next>
                </block>
            </next>
        </block>
    </xml>`;
}

function getAlertTemplate() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="controls_if" x="50" y="50">
            <mutation elseif="1" else="1"></mutation>
            <value name="IF0">
                <block type="logic_compare">
                    <field name="OP">GT</field>
                    <value name="A">
                        <block type="smartx_read_temperature">
                            <field name="UNIT">CELSIUS</field>
                        </block>
                    </value>
                    <value name="B">
                        <block type="math_number">
                            <field name="NUM">90</field>
                        </block>
                    </value>
                </block>
            </value>
            <statement name="DO0">
                <block type="smartx_send_alert">
                    <field name="SEVERITY">CRITICAL</field>
                    <value name="MESSAGE">
                        <block type="text">
                            <field name="TEXT">Critical temperature exceeded!</field>
                        </block>
                    </value>
                    <next>
                        <block type="smartx_control_machine">
                            <field name="ACTION">EMERGENCY</field>
                        </block>
                    </next>
                </block>
            </statement>
            <value name="IF1">
                <block type="logic_compare">
                    <field name="OP">GT</field>
                    <value name="A">
                        <block type="smartx_read_temperature">
                            <field name="UNIT">CELSIUS</field>
                        </block>
                    </value>
                    <value name="B">
                        <block type="math_number">
                            <field name="NUM">80</field>
                        </block>
                    </value>
                </block>
            </value>
            <statement name="DO1">
                <block type="smartx_send_alert">
                    <field name="SEVERITY">HIGH</field>
                    <value name="MESSAGE">
                        <block type="text">
                            <field name="TEXT">High temperature warning!</field>
                        </block>
                    </value>
                </block>
            </statement>
            <statement name="ELSE">
                <block type="smartx_log_event">
                    <value name="EVENT">
                        <block type="text">
                            <field name="TEXT">Temperature normal</field>
                        </block>
                    </value>
                </block>
            </statement>
        </block>
    </xml>`;
}

function getMaintenanceTemplate() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="variables_set" x="50" y="50">
            <field name="VAR">runtime_hours</field>
            <value name="VALUE">
                <block type="math_number">
                    <field name="NUM">500</field>
                </block>
            </value>
            <next>
                <block type="variables_set">
                    <field name="VAR">vibration_level</field>
                    <value name="VALUE">
                        <block type="smartx_read_vibration"></block>
                    </value>
                    <next>
                        <block type="controls_if">
                            <mutation elseif="1"></mutation>
                            <value name="IF0">
                                <block type="logic_operation">
                                    <field name="OP">OR</field>
                                    <value name="A">
                                        <block type="logic_compare">
                                            <field name="OP">GT</field>
                                            <value name="A">
                                                <block type="variables_get">
                                                    <field name="VAR">runtime_hours</field>
                                                </block>
                                            </value>
                                            <value name="B">
                                                <block type="math_number">
                                                    <field name="NUM">480</field>
                                                </block>
                                            </value>
                                        </block>
                                    </value>
                                    <value name="B">
                                        <block type="logic_compare">
                                            <field name="OP">GT</field>
                                            <value name="A">
                                                <block type="variables_get">
                                                    <field name="VAR">vibration_level</field>
                                                </block>
                                            </value>
                                            <value name="B">
                                                <block type="math_number">
                                                    <field name="NUM">0.8</field>
                                                </block>
                                            </value>
                                        </block>
                                    </value>
                                </block>
                            </value>
                            <statement name="DO0">
                                <block type="smartx_schedule_maintenance">
                                    <value name="HOURS">
                                        <block type="math_number">
                                            <field name="NUM">24</field>
                                        </block>
                                    </value>
                                    <next>
                                        <block type="smartx_send_notification">
                                            <value name="MESSAGE">
                                                <block type="text">
                                                    <field name="TEXT">Urgent maintenance required</field>
                                                </block>
                                            </value>
                                        </block>
                                    </next>
                                </block>
                            </statement>
                            <value name="IF1">
                                <block type="logic_compare">
                                    <field name="OP">GT</field>
                                    <value name="A">
                                        <block type="variables_get">
                                            <field name="VAR">runtime_hours</field>
                                        </block>
                                    </value>
                                    <value name="B">
                                        <block type="math_number">
                                            <field name="NUM">400</field>
                                        </block>
                                    </value>
                                </block>
                            </value>
                            <statement name="DO1">
                                <block type="smartx_log_event">
                                    <value name="EVENT">
                                        <block type="text">
                                            <field name="TEXT">Maintenance due soon</field>
                                        </block>
                                    </value>
                                </block>
                            </statement>
                        </block>
                    </next>
                </block>
            </next>
        </block>
    </xml>`;
}

function getControlTemplate() {
    return `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="variables_set" x="50" y="50">
            <field name="VAR">system_efficiency</field>
            <value name="VALUE">
                <block type="math_arithmetic">
                    <field name="OP">DIVIDE</field>
                    <value name="A">
                        <block type="smartx_read_power"></block>
                    </value>
                    <value name="B">
                        <block type="math_number">
                            <field name="NUM">1000</field>
                        </block>
                    </value>
                </block>
            </value>
            <next>
                <block type="controls_if">
                    <mutation elseif="2"></mutation>
                    <value name="IF0">
                        <block type="logic_compare">
                            <field name="OP">LT</field>
                            <value name="A">
                                <block type="variables_get">
                                    <field name="VAR">system_efficiency</field>
                                </block>
                            </value>
                            <value name="B">
                                <block type="math_number">
                                    <field name="NUM">0.6</field>
                                </block>
                            </value>
                        </block>
                    </value>
                    <statement name="DO0">
                        <block type="smartx_control_machine">
                            <field name="ACTION">RESET</field>
                            <next>
                                <block type="smartx_send_alert">
                                    <field name="SEVERITY">MEDIUM</field>
                                    <value name="MESSAGE">
                                        <block type="text">
                                            <field name="TEXT">System reset due to low efficiency</field>
                                        </block>
                                    </value>
                                </block>
                            </next>
                        </block>
                    </statement>
                    <value name="IF1">
                        <block type="logic_compare">
                            <field name="OP">LT</field>
                            <value name="A">
                                <block type="variables_get">
                                    <field name="VAR">system_efficiency</field>
                                </block>
                            </value>
                            <value name="B">
                                <block type="math_number">
                                    <field name="NUM">0.8</field>
                                </block>
                            </value>
                        </block>
                    </value>
                    <statement name="DO1">
                        <block type="smartx_log_event">
                            <value name="EVENT">
                                <block type="text">
                                    <field name="TEXT">Efficiency below optimal range</field>
                                </block>
                            </value>
                        </block>
                    </statement>
                    <value name="IF2">
                        <block type="logic_compare">
                            <field name="OP">GT</field>
                            <value name="A">
                                <block type="variables_get">
                                    <field name="VAR">system_efficiency</field>
                                </block>
                            </value>
                            <value name="B">
                                <block type="math_number">
                                    <field name="NUM">0.95</field>
                                </block>
                            </value>
                        </block>
                    </value>
                    <statement name="DO2">
                        <block type="smartx_log_event">
                            <value name="EVENT">
                                <block type="text">
                                    <field name="TEXT">Optimal efficiency achieved</field>
                                </block>
                            </value>
                        </block>
                    </statement>
                </block>
            </next>
        </block>
    </xml>`;
}

// Initialize workspace from URL parameters or saved data
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareData = urlParams.get('share');
    
    if (shareData) {
        try {
            const xmlText = decodeURIComponent(atob(shareData));
            const xml = Blockly.Xml.textToDom(xmlText);
            Blockly.Xml.domToWorkspace(xml, workspace);
            showFeedback('Shared workspace loaded', 'success');
        } catch (error) {
            console.error('Error loading shared workspace:', error);
            showFeedback('Error loading shared workspace', 'error');
        }
    } else {
        loadWorkspace();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (workspace) {
        workspace.dispose();
    }
});

// Make functions globally available
window.loadTemplate = loadTemplate;
