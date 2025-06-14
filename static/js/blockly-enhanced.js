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
    // Toolbar buttons
    document.getElementById('clearWorkspace').addEventListener('click', clearWorkspace);
    document.getElementById('saveWorkspace').addEventListener('click', saveWorkspace);
    document.getElementById('generateCode').addEventListener('click', showCodeModal);
    document.getElementById('downloadCode').addEventListener('click', downloadCode);
    
    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => workspace.zoomCenter(1));
    document.getElementById('zoomOut').addEventListener('click', () => workspace.zoomCenter(-1));
    document.getElementById('centerView').addEventListener('click', () => workspace.scrollCenter());
    
    // Export buttons
    document.getElementById('exportPython').addEventListener('click', () => exportFile('python'));
    document.getElementById('exportJson').addEventListener('click', () => exportFile('json'));
    document.getElementById('exportXml').addEventListener('click', () => exportFile('xml'));
    
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

// Create custom SmartX blocks
function createCustomBlocks() {
    // Temperature sensor block
    Blockly.Blocks['smartx_read_temperature'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("read temperature sensor");
            this.setOutput(true, "Number");
            this.setColour(15);
            this.setTooltip("Read temperature from SmartX sensor");
            this.setHelpUrl("");
        }
    };
    
    Blockly.Python['smartx_read_temperature'] = function(block) {
        const code = 'read_temperature_sensor()';
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
    };
    
    // Pressure sensor block
    Blockly.Blocks['smartx_read_pressure'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("read pressure sensor");
            this.setOutput(true, "Number");
            this.setColour(15);
            this.setTooltip("Read pressure from SmartX sensor");
            this.setHelpUrl("");
        }
    };
    
    Blockly.Python['smartx_read_pressure'] = function(block) {
        const code = 'read_pressure_sensor()';
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
    };
    
    // Vibration sensor block
    Blockly.Blocks['smartx_read_vibration'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("read vibration sensor");
            this.setOutput(true, "Number");
            this.setColour(15);
            this.setTooltip("Read vibration from SmartX sensor");
            this.setHelpUrl("");
        }
    };
    
    Blockly.Python['smartx_read_vibration'] = function(block) {
        const code = 'read_vibration_sensor()';
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
    };
    
    // Humidity sensor block
    Blockly.Blocks['smartx_read_humidity'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("read humidity sensor");
            this.setOutput(true, "Number");
            this.setColour(15);
            this.setTooltip("Read humidity from SmartX sensor");
            this.setHelpUrl("");
        }
    };
    
    Blockly.Python['smartx_read_humidity'] = function(block) {
        const code = 'read_humidity_sensor()';
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
    };
    
    // Send alert block
    Blockly.Blocks['smartx_send_alert'] = {
        init: function() {
            this.appendValueInput("MESSAGE")
                .setCheck("String")
                .appendField("send alert");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(0);
            this.setTooltip("Send alert message to SmartX system");
            this.setHelpUrl("");
        }
    };
    
    Blockly.Python['smartx_send_alert'] = function(block) {
        const message = Blockly.Python.valueToCode(block, 'MESSAGE', Blockly.Python.ORDER_ATOMIC);
        const code = `send_alert(${message})\n`;
        return code;
    };
    
    // Log event block
    Blockly.Blocks['smartx_log_event'] = {
        init: function() {
            this.appendValueInput("EVENT")
                .setCheck("String")
                .appendField("log event");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(0);
            this.setTooltip("Log event to SmartX system");
            this.setHelpUrl("");
        }
    };
    
    Blockly.Python['smartx_log_event'] = function(block) {
        const event = Blockly.Python.valueToCode(block, 'EVENT', Blockly.Python.ORDER_ATOMIC);
        const code = `log_event(${event})\n`;
        return code;
    };
    
    // Control machine block
    Blockly.Blocks['smartx_control_machine'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("control machine")
                .appendField(new Blockly.FieldDropdown([
                    ["start", "START"],
                    ["stop", "STOP"],
                    ["reset", "RESET"],
                    ["maintenance mode", "MAINTENANCE"]
                ]), "ACTION");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(0);
            this.setTooltip("Control SmartX machine operations");
            this.setHelpUrl("");
        }
    };
    
    Blockly.Python['smartx_control_machine'] = function(block) {
        const action = block.getFieldValue('ACTION');
        const code = `control_machine('${action}')\n`;
        return code;
    };
    
    // Schedule maintenance block
    Blockly.Blocks['smartx_schedule_maintenance'] = {
        init: function() {
            this.appendValueInput("HOURS")
                .setCheck("Number")
                .appendField("schedule maintenance in");
            this.appendDummyInput()
                .appendField("hours");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(0);
            this.setTooltip("Schedule maintenance for SmartX system");
            this.setHelpUrl("");
        }
    };
    
    Blockly.Python['smartx_schedule_maintenance'] = function(block) {
        const hours = Blockly.Python.valueToCode(block, 'HOURS', Blockly.Python.ORDER_ATOMIC);
        const code = `schedule_maintenance(${hours})\n`;
        return code;
    };
}

// Handle workspace changes
function onWorkspaceChange(event) {
    generateCodePreview();
    updateWorkspaceStats();
    updateExportButtons();
}

// Generate code preview
function generateCodePreview() {
    try {
        // Generate Python code
        Blockly.Python.INFINITE_LOOP_TRAP = null;
        generatedCode = Blockly.Python.workspaceToCode(workspace);
        
        // Add SmartX imports and helper functions
        const headerCode = `# Generated SmartX Automation Code
import time
import random
from datetime import datetime

# SmartX Sensor Functions
def read_temperature_sensor():
    return random.randint(60, 100)

def read_pressure_sensor():
    return round(random.uniform(1.0, 2.5), 2)

def read_vibration_sensor():
    return round(random.uniform(0.1, 1.0), 2)

def read_humidity_sensor():
    return random.randint(30, 70)

# SmartX Action Functions
def send_alert(message):
    print(f"ALERT: {message}")

def log_event(event):
    print(f"LOG [{datetime.now()}]: {event}")

def control_machine(action):
    print(f"MACHINE CONTROL: {action}")

def schedule_maintenance(hours):
    print(f"MAINTENANCE SCHEDULED: {hours} hours from now")

# Generated Workflow
`;
        
        const fullCode = headerCode + generatedCode + `
# Main execution
if __name__ == "__main__":
    print("SmartX Automation Starting...")
    # Your workflow runs here
`;
        
        // Update preview
        const preview = document.getElementById('codePreview');
        if (generatedCode.trim()) {
            preview.textContent = generatedCode;
        } else {
            preview.textContent = '// Build your workflow to see generated code...';
        }
        
        // Store full code for modal
        generatedCode = fullCode;
        
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
    if (blockCount > 20) complexity = 'Complex';
    else if (blockCount > 10) complexity = 'Moderate';
    
    workspaceStats = { blocks: blockCount, lines: codeLines, complexity };
    
    // Update display
    document.getElementById('blockCount').textContent = blockCount;
    document.getElementById('codeLines').textContent = codeLines;
    document.getElementById('complexity').textContent = complexity;
}

// Update export button states
function updateExportButtons() {
    const hasBlocks = workspace.getAllBlocks().length > 0;
    
    document.getElementById('downloadCode').disabled = !hasBlocks;
    document.getElementById('exportPython').disabled = !hasBlocks;
    document.getElementById('exportJson').disabled = !hasBlocks;
    document.getElementById('exportXml').disabled = !hasBlocks;
}

// Clear workspace
function clearWorkspace() {
    if (confirm('Are you sure you want to clear the entire workspace?')) {
        workspace.clear();
        generateCodePreview();
        updateWorkspaceStats();
    }
}

// Save workspace
function saveWorkspace() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToPrettyText(xml);
    
    localStorage.setItem('smartx_blockly_workspace', xmlText);
    
    // Show success feedback
    const button = document.getElementById('saveWorkspace');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    }, 2000);
}

// Load workspace from storage
function loadWorkspace() {
    const xmlText = localStorage.getItem('smartx_blockly_workspace');
    if (xmlText) {
        try {
            const xml = Blockly.Xml.textToDom(xmlText);
            Blockly.Xml.domToWorkspace(xml, workspace);
            return true;
        } catch (error) {
            console.error('Error loading workspace:', error);
            return false;
        }
    }
    return false;
}

// Show code generation modal
function showCodeModal() {
    const modal = document.getElementById('codeModal');
    const fullCodePreview = document.getElementById('fullCodePreview');
    
    fullCodePreview.textContent = generatedCode;
    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
}

// Hide code modal
function hideCodeModal() {
    const modal = document.getElementById('codeModal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-enter');
}

// Copy code to clipboard
async function copyCodeToClipboard() {
    try {
        await navigator.clipboard.writeText(generatedCode);
        
        const button = document.getElementById('copyCode');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
        
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy code:', error);
        alert('Failed to copy code to clipboard');
    }
}

// Download generated code
function downloadGeneratedCode() {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartx_automation_${new Date().toISOString().split('T')[0]}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export files in different formats
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
                stats: workspaceStats
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
            
        default:
            return;
    }
    
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

// Load predefined templates
function loadTemplate(templateType) {
    let xml;
    
    switch (templateType) {
        case 'monitoring':
            xml = `<xml xmlns="https://developers.google.com/blockly/xml">
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
                                <block type="smartx_read_temperature"></block>
                            </value>
                            <next>
                                <block type="controls_if">
                                    <value name="IF0">
                                        <block type="logic_compare">
                                            <field name="OP">GT</field>
                                            <value name="A">
                                                <block type="variables_get">
                                                    <field name="VAR">temperature</field>
                                                </block>
                                            </value>
                                            <value name="B">
                                                <block type="math_number">
                                                    <field name="NUM">85</field>
                                                </block>
                                            </value>
                                        </block>
                                    </value>
                                    <statement name="DO0">
                                        <block type="smartx_send_alert">
                                            <value name="MESSAGE">
                                                <block type="text">
                                                    <field name="TEXT">High temperature detected!</field>
                                                </block>
                                            </value>
                                        </block>
                                    </statement>
                                </block>
                            </next>
                        </block>
                    </statement>
                </block>
            </xml>`;
            break;
            
        case 'alert':
            xml = `<xml xmlns="https://developers.google.com/blockly/xml">
                <block type="controls_if" x="50" y="50">
                    <value name="IF0">
                        <block type="logic_operation">
                            <field name="OP">OR</field>
                            <value name="A">
                                <block type="logic_compare">
                                    <field name="OP">GT</field>
                                    <value name="A">
                                        <block type="smartx_read_temperature"></block>
                                    </value>
                                    <value name="B">
                                        <block type="math_number">
                                            <field name="NUM">90</field>
                                        </block>
                                    </value>
                                </block>
                            </value>
                            <value name="B">
                                <block type="logic_compare">
                                    <field name="OP">GT</field>
                                    <value name="A">
                                        <block type="smartx_read_pressure"></block>
                                    </value>
                                    <value name="B">
                                        <block type="math_number">
                                            <field name="NUM">2</field>
                                        </block>
                                    </value>
                                </block>
                            </value>
                        </block>
                    </value>
                    <statement name="DO0">
                        <block type="smartx_send_alert">
                            <value name="MESSAGE">
                                <block type="text">
                                    <field name="TEXT">Critical system condition!</field>
                                </block>
                            </value>
                            <next>
                                <block type="smartx_control_machine">
                                    <field name="ACTION">STOP</field>
                                </block>
                            </next>
                        </block>
                    </statement>
                </block>
            </xml>`;
            break;
            
        case 'maintenance':
            xml = `<xml xmlns="https://developers.google.com/blockly/xml">
                <block type="variables_set" x="50" y="50">
                    <field name="VAR">runtime_hours</field>
                    <value name="VALUE">
                        <block type="math_number">
                            <field name="NUM">500</field>
                        </block>
                    </value>
                    <next>
                        <block type="controls_if">
                            <value name="IF0">
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
                            <statement name="DO0">
                                <block type="smartx_schedule_maintenance">
                                    <value name="HOURS">
                                        <block type="math_number">
                                            <field name="NUM">24</field>
                                        </block>
                                    </value>
                                    <next>
                                        <block type="smartx_log_event">
                                            <value name="EVENT">
                                                <block type="text">
                                                    <field name="TEXT">Maintenance scheduled due to runtime</field>
                                                </block>
                                            </value>
                                        </block>
                                    </next>
                                </block>
                            </statement>
                        </block>
                    </next>
                </block>
            </xml>`;
            break;
            
        case 'control':
            xml = `<xml xmlns="https://developers.google.com/blockly/xml">
                <block type="variables_set" x="50" y="50">
                    <field name="VAR">efficiency</field>
                    <value name="VALUE">
                        <block type="math_arithmetic">
                            <field name="OP">DIVIDE</field>
                            <value name="A">
                                <block type="smartx_read_temperature"></block>
                            </value>
                            <value name="B">
                                <block type="math_number">
                                    <field name="NUM">100</field>
                                </block>
                            </value>
                        </block>
                    </value>
                    <next>
                        <block type="controls_if">
                            <mutation elseif="1"></mutation>
                            <value name="IF0">
                                <block type="logic_compare">
                                    <field name="OP">LT</field>
                                    <value name="A">
                                        <block type="variables_get">
                                            <field name="VAR">efficiency</field>
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
                                <block type="smartx_control_machine">
                                    <field name="ACTION">RESET</field>
                                </block>
                            </statement>
                            <value name="IF1">
                                <block type="logic_compare">
                                    <field name="OP">GT</field>
                                    <value name="A">
                                        <block type="variables_get">
                                            <field name="VAR">efficiency</field>
                                        </block>
                                    </value>
                                    <value name="B">
                                        <block type="math_number">
                                            <field name="NUM">0.95</field>
                                        </block>
                                    </value>
                                </block>
                            </value>
                            <statement name="DO1">
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
            break;
            
        default:
            return;
    }
    
    try {
        workspace.clear();
        const xmlDom = Blockly.Xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);
        
        // Show feedback
        showTemplateFeedback(templateType);
        
    } catch (error) {
        console.error('Error loading template:', error);
        alert('Error loading template');
    }
}

// Show template load feedback
function showTemplateFeedback(templateType) {
    const templateName = templateType.charAt(0).toUpperCase() + templateType.slice(1);
    
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.innerHTML = `<i class="fas fa-check mr-2"></i>${templateName} template loaded!`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Initialize workspace from saved data on load
window.addEventListener('load', function() {
    if (!loadWorkspace()) {
        console.log('No saved workspace found');
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
