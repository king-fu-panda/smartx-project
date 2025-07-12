
import os
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_pymongo import PyMongo
import paho.mqtt.client as mqtt
import random
from datetime import datetime, timedelta
import logging
import threading
import time

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# MongoDB Configuration (optional for prototype)
try:
    app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/smartx_iot")
    mongo = PyMongo(app)
    # Test connection
    mongo.db.list_collection_names()
    MONGODB_AVAILABLE = True
    app.logger.info("MongoDB connected successfully")
except Exception as e:
    app.logger.warning(f"MongoDB not available, using fallback mode: {str(e)}")
    mongo = None
    MONGODB_AVAILABLE = False

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'start_page'

# MQTT Configuration
MQTT_BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
MQTT_TOPIC = "smartx/sensors/+"
MQTT_USERNAME = os.environ.get("MQTT_USERNAME", "")
MQTT_PASSWORD = os.environ.get("MQTT_PASSWORD", "")

# Global MQTT client
mqtt_client = None
latest_sensor_data = {}

# User class for Flask-Login
class User(UserMixin):
    def __init__(self, username, role):
        self.id = username
        self.username = username
        self.role = role

# In-memory dummy users
users = {
    'admin': {'password': 'admin123', 'role': 'admin'},
    'tech': {'password': 'tech123', 'role': 'technician'},
    'viewer': {'password': 'viewer123', 'role': 'viewer'}
}

@login_manager.user_loader
def load_user(user_id):
    if user_id in users:
        return User(user_id, users[user_id]['role'])
    return None

# MQTT Functions
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        app.logger.info("Connected to MQTT broker")
        client.subscribe(MQTT_TOPIC)
    else:
        app.logger.error(f"Failed to connect to MQTT broker: {rc}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        
        # Extract device ID from topic (e.g., smartx/sensors/device01)
        device_id = topic.split('/')[-1]
        
        # Add metadata
        sensor_data = {
            'device_id': device_id,
            'timestamp': datetime.utcnow(),
            'data': payload
        }
        
        # Store in MongoDB if available, otherwise use JSON file
        if MONGODB_AVAILABLE and mongo:
            mongo.db.sensor_data.insert_one(sensor_data)
        else:
            store_data_to_file(sensor_data)
        
        # Update latest data cache
        latest_sensor_data[device_id] = payload
        
        app.logger.info(f"Received MQTT data from {device_id}: {payload}")
        
    except Exception as e:
        app.logger.error(f"Error processing MQTT message: {str(e)}")

def store_data_to_file(sensor_data):
    """Store sensor data to JSON file as fallback"""
    try:
        # Convert datetime to string for JSON serialization
        data_to_store = sensor_data.copy()
        data_to_store['timestamp'] = sensor_data['timestamp'].isoformat()
        
        # Read existing data
        try:
            with open('sensor_data.json', 'r') as f:
                existing_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = []
        
        # Add new data and keep only last 100 records
        existing_data.append(data_to_store)
        if len(existing_data) > 100:
            existing_data = existing_data[-100:]
        
        # Save back to file
        with open('sensor_data.json', 'w') as f:
            json.dump(existing_data, f, indent=2)
            
    except Exception as e:
        app.logger.error(f"Error storing data to file: {str(e)}")

def get_data_from_file():
    """Get latest sensor data from JSON file"""
    try:
        with open('sensor_data.json', 'r') as f:
            data = json.load(f)
            if data:
                return data[-1]['data']  # Return latest data
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        pass
    return None

def initialize_mqtt():
    global mqtt_client
    try:
        mqtt_client = mqtt.Client()
        mqtt_client.on_connect = on_connect
        mqtt_client.on_message = on_message
        
        if MQTT_USERNAME and MQTT_PASSWORD:
            mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        
    except Exception as e:
        app.logger.error(f"Failed to initialize MQTT: {str(e)}")

# Helper functions for data management
def get_latest_sensor_data():
    """Get the latest sensor data from MongoDB, file, or cache"""
    try:
        # Try to get from cache first
        if latest_sensor_data:
            # Get the most recent device data
            latest_device = max(latest_sensor_data.keys(), 
                              key=lambda k: latest_sensor_data[k].get('timestamp', 0))
            return latest_sensor_data[latest_device]
        
        # Try MongoDB if available
        if MONGODB_AVAILABLE and mongo:
            latest_doc = mongo.db.sensor_data.find_one(sort=[('timestamp', -1)])
            if latest_doc:
                return latest_doc['data']
        
        # Try file storage
        file_data = get_data_from_file()
        if file_data:
            return file_data
            
    except Exception as e:
        app.logger.error(f"Error getting sensor data: {str(e)}")
    
    return None

def get_fallback_data():
    """Generate random fallback data when no real data exists"""
    return {
        "temperature": random.randint(60, 100),
        "pressure": round(random.uniform(1.0, 2.5), 2),
        "vibration": round(random.uniform(0.1, 1.0), 2),
        "humidity": random.randint(30, 70),
        "status": random.choice(["Running", "Maintenance", "Idle"]),
        "efficiency": random.randint(75, 95),
        "timestamp": datetime.now().isoformat()
    }

def get_historical_data(hours=24):
    """Get historical sensor data from MongoDB"""
    try:
        since = datetime.utcnow() - timedelta(hours=hours)
        cursor = mongo.db.sensor_data.find(
            {'timestamp': {'$gte': since}},
            sort=[('timestamp', 1)]
        )
        return list(cursor)
    except Exception as e:
        app.logger.error(f"Error getting historical data: {str(e)}")
        return []

# Authentication routes
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        if username in users and users[username]['password'] == password:
            user = User(username, users[username]['role'])
            login_user(user)
            flash(f"Welcome, {username}!", "success")
            return redirect(url_for('home'))
        else:
            flash("Invalid username or password", "error")
    
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out", "info")
    return redirect(url_for('start_page'))

@app.route("/back-to-features")
@login_required
def back_to_features():
    """Route to go back to main features page"""
    return redirect(url_for('home'))

@app.route("/")
def start_page():
    return render_template("start.html")

@app.route("/home")
@login_required
def home():
    return render_template("index.html")

@app.route("/dashboard")
@login_required
def dashboard_page():
    return render_template("dashboard.html")

@app.route("/api/dashboard")
@login_required
def dashboard_api():
    """API endpoint for real-time dashboard data"""
    data = get_latest_sensor_data()
    if data is None:
        data = get_fallback_data()
    
    return jsonify(data)

@app.route("/api/historical-data")
@login_required
def historical_data_api():
    """API endpoint for historical data charts"""
    hours = request.args.get('hours', 24, type=int)
    data = get_historical_data(hours)
    
    # Format data for charts
    formatted_data = []
    for record in data:
        formatted_data.append({
            'timestamp': record['timestamp'].isoformat(),
            'device_id': record['device_id'],
            **record['data']
        })
    
    return jsonify(formatted_data)

# MQTT Data Receiver (still keep for direct HTTP posts)
@app.route("/api/device-data", methods=["POST"])
def receive_device_data():
    """API endpoint to receive sensor data from IoT devices via HTTP"""
    try:
        data = request.get_json()
        device_id = request.headers.get('Device-ID', 'http_device')
        
        # Validate required fields
        required_fields = ['temperature', 'pressure', 'vibration', 'humidity', 'status', 'efficiency']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Store in MongoDB or file
        sensor_data = {
            'device_id': device_id,
            'timestamp': datetime.utcnow(),
            'data': data
        }
        
        if MONGODB_AVAILABLE and mongo:
            mongo.db.sensor_data.insert_one(sensor_data)
        else:
            store_data_to_file(sensor_data)
        
        # Update cache
        latest_sensor_data[device_id] = data
        
        app.logger.info(f"Received HTTP device data from {device_id}: {data}")
        return jsonify({"message": "Data received successfully", "timestamp": sensor_data['timestamp'].isoformat()}), 200
            
    except Exception as e:
        app.logger.error(f"Device data error: {str(e)}")
        return jsonify({"error": "Invalid data format"}), 400

@app.route("/twin")
@login_required
def twin_page():
    return render_template("twin.html")

@app.route("/api/twin-data")
@login_required
def twin_data():
    """API endpoint for 3D twin sensor data"""
    stored_data = get_latest_sensor_data()
    
    if stored_data:
        data = {
            "temperature": stored_data.get("temperature", 75),
            "pressure": stored_data.get("pressure", 1.5),
            "vibration": stored_data.get("vibration", 0.5),
            "humidity": stored_data.get("humidity", 50),
            "rpm": stored_data.get("rpm", random.randint(1000, 3000)),
            "power": stored_data.get("power", round(random.uniform(50, 200), 1)),
            "status": stored_data.get("status", "Operating").replace("Running", "Operating"),
            "alerts": []
        }
    else:
        # Generate realistic random sensor data
        base_temp = 75
        temp_variation = random.gauss(0, 8)
        temperature = max(60, min(100, base_temp + temp_variation))
        
        base_pressure = 1.5
        pressure_variation = random.gauss(0, 0.3)
        pressure = max(1.0, min(2.5, base_pressure + pressure_variation))
        
        base_vibration = 0.3
        vibration_variation = random.gauss(0, 0.15)
        vibration = max(0.1, min(1.2, base_vibration + vibration_variation))
        
        base_humidity = 50
        humidity_variation = random.gauss(0, 5)
        humidity = max(30, min(70, base_humidity + humidity_variation))
        
        # RPM varies based on machine load
        base_rpm = 1800
        rpm_variation = random.gauss(0, 200)
        rpm = max(800, min(3000, base_rpm + rpm_variation))
        
        # Power consumption correlates with RPM and load
        base_power = 120
        power_variation = (rpm - 1800) * 0.05 + random.gauss(0, 15)
        power = max(50, min(250, base_power + power_variation))
        
        # Status based on sensor readings
        if temperature > 90 or pressure > 2.2 or vibration > 1.0:
            status = "Critical"
        elif temperature > 85 or pressure > 2.0 or vibration > 0.8:
            status = "Warning"
        else:
            status = "Operating"
        
        data = {
            "temperature": round(temperature, 1),
            "pressure": round(pressure, 2),
            "vibration": round(vibration, 2),
            "humidity": round(humidity, 1),
            "rpm": round(rpm),
            "power": round(power, 1),
            "status": status,
            "alerts": [],
            "efficiency": max(60, min(98, 95 - (temperature - 75) * 0.5 - (vibration - 0.3) * 10)),
            "uptime": f"{random.randint(12, 168)}h {random.randint(0, 59)}m"
        }
    
    # Add alerts based on conditions
    alerts = []
    if data["temperature"] > 85:
        alerts.append("High Temperature Alert")
    if data["pressure"] > 2.0:
        alerts.append("Pressure Warning")
    if data["vibration"] > 0.8:
        alerts.append("Excessive Vibration")
    if data["humidity"] < 35 or data["humidity"] > 65:
        alerts.append("Humidity Out of Range")
    if data["rpm"] > 2800:
        alerts.append("High RPM Warning")
    
    data["alerts"] = alerts
    
    return jsonify(data)

@app.route("/predict")
@login_required
def predict_page():
    return render_template("predict.html")

@app.route("/api/predict", methods=["POST"])
@login_required
def predict_api():
    """API endpoint for predictive analytics"""
    try:
        data = request.get_json()
        
        if not data:
            stored_data = get_latest_sensor_data()
            if stored_data:
                data = stored_data
            else:
                return jsonify({"error": "No data available for prediction"}), 400
        
        temperature = float(data.get("temperature", 75))
        pressure = float(data.get("pressure", 1.5))
        vibration = float(data.get("vibration", 0.5))
        humidity = float(data.get("humidity", 50))
        
        # Enhanced prediction logic with machine learning concepts
        risk_score = 0
        risk_factors = []
        maintenance_recommendations = []
        
        # Temperature analysis
        if temperature > 90:
            risk_score += 40
            risk_factors.append("Critical temperature levels")
            maintenance_recommendations.append("Immediate cooling system inspection required")
        elif temperature > 85:
            risk_score += 25
            risk_factors.append("High temperature detected")
            maintenance_recommendations.append("Check cooling system within 24 hours")
        elif temperature > 75:
            risk_score += 10
            risk_factors.append("Elevated temperature")
            
        # Pressure analysis
        if pressure > 2.2:
            risk_score += 35
            risk_factors.append("Critical pressure levels")
            maintenance_recommendations.append("Pressure relief system check required")
        elif pressure > 2.0:
            risk_score += 20
            risk_factors.append("High pressure levels")
            maintenance_recommendations.append("Monitor pressure trends closely")
        elif pressure > 1.8:
            risk_score += 10
            risk_factors.append("Moderate pressure increase")
            
        # Vibration analysis
        if vibration > 0.9:
            risk_score += 30
            risk_factors.append("Severe vibration detected")
            maintenance_recommendations.append("Bearing and alignment inspection needed")
        elif vibration > 0.7:
            risk_score += 20
            risk_factors.append("High vibration levels")
            maintenance_recommendations.append("Schedule vibration analysis")
        elif vibration > 0.5:
            risk_score += 10
            risk_factors.append("Elevated vibration")
            
        # Humidity analysis
        if humidity > 70 or humidity < 30:
            risk_score += 15
            risk_factors.append("Humidity outside optimal range")
            maintenance_recommendations.append("Check environmental controls")
        
        # Determine risk level and overall recommendation
        if risk_score >= 60:
            risk_level = "Critical Risk"
            overall_recommendation = "Stop operation immediately - maintenance required"
            predicted_failure_time = "< 4 hours"
        elif risk_score >= 40:
            risk_level = "High Risk"
            overall_recommendation = "Schedule immediate maintenance"
            predicted_failure_time = "12-24 hours"
        elif risk_score >= 20:
            risk_level = "Medium Risk"
            overall_recommendation = "Schedule maintenance within 48 hours"
            predicted_failure_time = "2-7 days"
        else:
            risk_level = "Low Risk"
            overall_recommendation = "Normal operation - continue monitoring"
            predicted_failure_time = "> 30 days"
        
        # Calculate confidence based on data completeness
        confidence = min(100, 70 + (10 if temperature else 0) + (10 if pressure else 0) + 
                        (10 if vibration else 0) + (10 if humidity else 0))
        
        return jsonify({
            "temperature": temperature,
            "pressure": pressure,
            "vibration": vibration,
            "humidity": humidity,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "maintenance_recommendations": maintenance_recommendations,
            "overall_recommendation": overall_recommendation,
            "predicted_failure_time": predicted_failure_time,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        app.logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": "Invalid input data"}), 400

@app.route("/nocode")
@login_required
def nocode():
    return render_template("blockly.html")

# Device Connection Routes
@app.route("/api/device-connection/qr-setup", methods=["POST"])
@login_required
def qr_setup():
    """Handle QR code device setup"""
    try:
        data = request.get_json()
        qr_code = data.get("qr_code")
        
        if not qr_code:
            return jsonify({"error": "QR code data required"}), 400
        
        # In a real implementation, you would decode the QR code
        # and extract device configuration information
        device_config = {
            "device_id": f"qr_device_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "setup_method": "qr_code",
            "status": "connected",
            "timestamp": datetime.now().isoformat()
        }
        
        # Store device configuration in MongoDB
        mongo.db.connected_devices.insert_one(device_config)
        
        return jsonify({
            "message": "Device connected successfully via QR code",
            "device_id": device_config["device_id"],
            "status": "connected"
        }), 200
        
    except Exception as e:
        app.logger.error(f"QR setup error: {str(e)}")
        return jsonify({"error": "QR setup failed"}), 500

@app.route("/api/device-connection/wifi-setup", methods=["POST"])
@login_required
def wifi_setup():
    """Handle WiFi device setup"""
    try:
        data = request.get_json()
        wifi_ssid = data.get("wifi_ssid")
        wifi_password = data.get("wifi_password")
        device_type = data.get("device_type", "generic")
        
        if not wifi_ssid:
            return jsonify({"error": "WiFi SSID required"}), 400
        
        device_config = {
            "device_id": f"wifi_device_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "setup_method": "wifi",
            "wifi_ssid": wifi_ssid,
            "device_type": device_type,
            "status": "connected",
            "timestamp": datetime.now().isoformat()
        }
        
        # Store device configuration
        mongo.db.connected_devices.insert_one(device_config)
        
        return jsonify({
            "message": "Device connected successfully via WiFi",
            "device_id": device_config["device_id"],
            "wifi_ssid": wifi_ssid,
            "status": "connected"
        }), 200
        
    except Exception as e:
        app.logger.error(f"WiFi setup error: {str(e)}")
        return jsonify({"error": "WiFi setup failed"}), 500

@app.route("/api/device-connection/mqtt-setup", methods=["POST"])
@login_required
def mqtt_setup():
    """Handle MQTT device setup"""
    try:
        data = request.get_json()
        mqtt_topic = data.get("mqtt_topic")
        device_id = data.get("device_id")
        
        if not mqtt_topic or not device_id:
            return jsonify({"error": "MQTT topic and device ID required"}), 400
        
        device_config = {
            "device_id": device_id,
            "setup_method": "mqtt",
            "mqtt_topic": mqtt_topic,
            "mqtt_broker": MQTT_BROKER,
            "mqtt_port": MQTT_PORT,
            "status": "connected",
            "timestamp": datetime.now().isoformat()
        }
        
        # Store device configuration
        mongo.db.connected_devices.insert_one(device_config)
        
        # Subscribe to the device's MQTT topic
        if mqtt_client:
            mqtt_client.subscribe(mqtt_topic)
        
        return jsonify({
            "message": "Device connected successfully via MQTT",
            "device_id": device_id,
            "mqtt_topic": mqtt_topic,
            "status": "connected"
        }), 200
        
    except Exception as e:
        app.logger.error(f"MQTT setup error: {str(e)}")
        return jsonify({"error": "MQTT setup failed"}), 500

@app.route("/api/device-connection/bulk-import", methods=["POST"])
@login_required
def bulk_import():
    """Handle bulk device import via CSV"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({"error": "Only CSV files are allowed"}), 400
        
        # Read CSV content
        csv_content = file.read().decode('utf-8')
        lines = csv_content.strip().split('\n')
        
        if len(lines) < 2:
            return jsonify({"error": "CSV must contain header and at least one device"}), 400
        
        # Parse CSV (expecting: device_id, device_type, location, description)
        header = lines[0].split(',')
        devices_added = 0
        
        for line in lines[1:]:
            if line.strip():
                values = line.split(',')
                if len(values) >= 2:
                    device_config = {
                        "device_id": values[0].strip(),
                        "device_type": values[1].strip() if len(values) > 1 else "generic",
                        "location": values[2].strip() if len(values) > 2 else "factory_floor",
                        "description": values[3].strip() if len(values) > 3 else "Bulk imported device",
                        "setup_method": "bulk_import",
                        "status": "connected",
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # Store device configuration
                    mongo.db.connected_devices.insert_one(device_config)
                    devices_added += 1
        
        return jsonify({
            "message": f"Successfully imported {devices_added} devices",
            "devices_added": devices_added,
            "status": "success"
        }), 200
        
    except Exception as e:
        app.logger.error(f"Bulk import error: {str(e)}")
        return jsonify({"error": "Bulk import failed"}), 500

@app.route("/api/connected-devices")
@login_required
def get_connected_devices():
    """Get list of all connected devices"""
    try:
        devices = list(mongo.db.connected_devices.find({}, {"_id": 0}))
        return jsonify({
            "devices": devices,
            "total_count": len(devices)
        }), 200
        
    except Exception as e:
        app.logger.error(f"Get devices error: {str(e)}")
        return jsonify({"error": "Failed to retrieve devices"}), 500

@app.route("/api/generate-code", methods=["POST"])
@login_required
def generate_code():
    """Generate Python code from enhanced block configurations"""
    try:
        data = request.get_json()
        blocks_config = data.get("blocks", [])
        code_type = data.get("type", "monitoring")
        
        # Enhanced code generation based on block types
        if code_type == "iot_automation":
            generated_code = generate_iot_automation_code(blocks_config)
        elif code_type == "data_processing":
            generated_code = generate_data_processing_code(blocks_config)
        elif code_type == "ml_prediction":
            generated_code = generate_ml_code(blocks_config)
        elif code_type == "mqtt_handler":
            generated_code = generate_mqtt_code(blocks_config)
        else:
            generated_code = generate_basic_monitoring_code(blocks_config)
        
        return jsonify({
            "code": generated_code,
            "filename": f"smartx_{code_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py",
            "type": code_type
        })
        
    except Exception as e:
        app.logger.error(f"Code generation error: {str(e)}")
        return jsonify({"error": "Code generation failed"}), 400

def generate_iot_automation_code(blocks):
    return """#!/usr/bin/env python3
\"\"\"
SmartX IoT Automation Code
Generated automatically from visual blocks
\"\"\"
import paho.mqtt.client as mqtt
import json
import time
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IoTAutomationSystem:
    def __init__(self, broker_host="localhost", broker_port=1883):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.thresholds = {
            'temperature': {'min': 60, 'max': 85},
            'pressure': {'min': 1.0, 'max': 2.0},
            'vibration': {'min': 0.1, 'max': 0.7},
            'humidity': {'min': 40, 'max': 60}
        }
        
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Connected to MQTT broker")
            client.subscribe("smartx/sensors/+")
            client.subscribe("smartx/control/+")
        else:
            logger.error(f"Connection failed: {rc}")
    
    def on_message(self, client, userdata, msg):
        try:
            topic_parts = msg.topic.split('/')
            device_id = topic_parts[-1]
            data = json.loads(msg.payload.decode())
            
            logger.info(f"Received data from {device_id}: {data}")
            
            # Process automation rules
            self.process_automation_rules(device_id, data)
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    def process_automation_rules(self, device_id, data):
        \"\"\"Process automation rules based on sensor data\"\"\"
        alerts = []
        actions = []
        
        # Temperature control
        if 'temperature' in data:
            temp = data['temperature']
            if temp > self.thresholds['temperature']['max']:
                alerts.append(f"High temperature alert: {temp}°F")
                actions.append("activate_cooling_system")
            elif temp < self.thresholds['temperature']['min']:
                alerts.append(f"Low temperature alert: {temp}°F")
                actions.append("activate_heating_system")
        
        # Pressure control
        if 'pressure' in data:
            pressure = data['pressure']
            if pressure > self.thresholds['pressure']['max']:
                alerts.append(f"High pressure alert: {pressure} bar")
                actions.append("open_pressure_relief_valve")
        
        # Vibration monitoring
        if 'vibration' in data:
            vibration = data['vibration']
            if vibration > self.thresholds['vibration']['max']:
                alerts.append(f"Excessive vibration: {vibration}")
                actions.append("reduce_machine_speed")
        
        # Execute actions
        for action in actions:
            self.execute_action(device_id, action)
        
        # Send alerts
        if alerts:
            self.send_alerts(device_id, alerts)
    
    def execute_action(self, device_id, action):
        \"\"\"Execute automation action\"\"\"
        control_topic = f"smartx/control/{device_id}"
        control_message = {
            'action': action,
            'timestamp': datetime.now().isoformat(),
            'source': 'automation_system'
        }
        
        self.client.publish(control_topic, json.dumps(control_message))
        logger.info(f"Executed action: {action} for device {device_id}")
    
    def send_alerts(self, device_id, alerts):
        \"\"\"Send alert notifications\"\"\"
        alert_topic = f"smartx/alerts/{device_id}"
        alert_message = {
            'alerts': alerts,
            'timestamp': datetime.now().isoformat(),
            'device_id': device_id
        }
        
        self.client.publish(alert_topic, json.dumps(alert_message))
        logger.warning(f"Alerts sent for {device_id}: {alerts}")
    
    def start(self):
        \"\"\"Start the automation system\"\"\"
        logger.info("Starting IoT Automation System...")
        self.client.connect(self.broker_host, self.broker_port, 60)
        self.client.loop_forever()

if __name__ == "__main__":
    system = IoTAutomationSystem()
    system.start()
"""

def generate_data_processing_code(blocks):
    return """#!/usr/bin/env python3
\"\"\"
SmartX Data Processing Pipeline
Generated automatically from visual blocks
\"\"\"
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import matplotlib.pyplot as plt
import seaborn as sns

class DataProcessor:
    def __init__(self):
        self.data_buffer = []
        self.analysis_results = {}
        
    def load_sensor_data(self, source_type="mongodb", **kwargs):
        \"\"\"Load sensor data from various sources\"\"\"
        if source_type == "mongodb":
            return self.load_from_mongodb(**kwargs)
        elif source_type == "csv":
            return self.load_from_csv(**kwargs)
        elif source_type == "json":
            return self.load_from_json(**kwargs)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")
    
    def load_from_mongodb(self, collection_name="sensor_data", hours=24):
        \"\"\"Load data from MongoDB\"\"\"
        try:
            from pymongo import MongoClient
            client = MongoClient('mongodb://localhost:27017/')
            db = client['smartx_iot']
            collection = db[collection_name]
            
            since = datetime.utcnow() - timedelta(hours=hours)
            cursor = collection.find({'timestamp': {'$gte': since}})
            
            data = []
            for record in cursor:
                record['_id'] = str(record['_id'])
                data.append(record)
            
            return pd.DataFrame(data)
        except Exception as e:
            print(f"Error loading from MongoDB: {e}")
            return pd.DataFrame()
    
    def clean_data(self, df):
        \"\"\"Clean and preprocess sensor data\"\"\"
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Handle missing values
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].mean())
        
        # Remove outliers using IQR method
        for column in numeric_columns:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
        
        return df
    
    def calculate_statistics(self, df):
        \"\"\"Calculate comprehensive statistics\"\"\"
        stats = {}
        
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        for column in numeric_columns:
            stats[column] = {
                'mean': df[column].mean(),
                'median': df[column].median(),
                'std': df[column].std(),
                'min': df[column].min(),
                'max': df[column].max(),
                'q25': df[column].quantile(0.25),
                'q75': df[column].quantile(0.75)
            }
        
        return stats
    
    def detect_anomalies(self, df, threshold=2):
        \"\"\"Detect anomalies using statistical methods\"\"\"
        anomalies = {}
        
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        for column in numeric_columns:
            mean = df[column].mean()
            std = df[column].std()
            
            # Z-score method
            z_scores = np.abs((df[column] - mean) / std)
            anomaly_indices = df.index[z_scores > threshold].tolist()
            
            anomalies[column] = {
                'count': len(anomaly_indices),
                'indices': anomaly_indices,
                'values': df.loc[anomaly_indices, column].tolist()
            }
        
        return anomalies
    
    def generate_trends(self, df):
        \"\"\"Generate trend analysis\"\"\"
        trends = {}
        
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            for column in numeric_columns:
                # Calculate moving averages
                df[f'{column}_ma_5'] = df[column].rolling(window=5).mean()
                df[f'{column}_ma_10'] = df[column].rolling(window=10).mean()
                
                # Calculate trend slope
                x = np.arange(len(df))
                slope = np.polyfit(x, df[column].dropna(), 1)[0]
                
                trends[column] = {
                    'slope': slope,
                    'direction': 'increasing' if slope > 0 else 'decreasing',
                    'magnitude': abs(slope)
                }
        
        return trends
    
    def generate_report(self, df):
        \"\"\"Generate comprehensive analysis report\"\"\"
        report = {
            'timestamp': datetime.now().isoformat(),
            'data_summary': {
                'total_records': len(df),
                'date_range': {
                    'start': df['timestamp'].min() if 'timestamp' in df.columns else None,
                    'end': df['timestamp'].max() if 'timestamp' in df.columns else None
                }
            },
            'statistics': self.calculate_statistics(df),
            'anomalies': self.detect_anomalies(df),
            'trends': self.generate_trends(df)
        }
        
        return report
    
    def export_results(self, report, format='json'):
        \"\"\"Export analysis results\"\"\"
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if format == 'json':
            filename = f'smartx_analysis_{timestamp}.json'
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2, default=str)
        
        elif format == 'csv':
            filename = f'smartx_analysis_{timestamp}.csv'
            # Convert nested dict to flat structure for CSV
            flat_data = []
            for metric, stats in report['statistics'].items():
                for stat_name, value in stats.items():
                    flat_data.append({
                        'metric': metric,
                        'statistic': stat_name,
                        'value': value
                    })
            
            pd.DataFrame(flat_data).to_csv(filename, index=False)
        
        return filename

def main():
    processor = DataProcessor()
    
    # Load and process data
    df = processor.load_sensor_data(source_type="mongodb", hours=24)
    
    if not df.empty:
        # Clean data
        df_clean = processor.clean_data(df)
        
        # Generate analysis report
        report = processor.generate_report(df_clean)
        
        # Export results
        filename = processor.export_results(report, format='json')
        print(f"Analysis complete. Results saved to: {filename}")
    else:
        print("No data available for processing")

if __name__ == "__main__":
    main()
"""

def generate_ml_code(blocks):
    return """#!/usr/bin/env python3
\"\"\"
SmartX Machine Learning Prediction System
Generated automatically from visual blocks
\"\"\"
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class SmartXMLSystem:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        
    def prepare_features(self, df):
        \"\"\"Prepare features for machine learning\"\"\"
        features = []
        
        # Basic sensor readings
        sensor_cols = ['temperature', 'pressure', 'vibration', 'humidity']
        for col in sensor_cols:
            if col in df.columns:
                features.append(col)
        
        # Time-based features
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            features.extend(['hour', 'day_of_week'])
        
        # Rolling statistics (if enough data)
        if len(df) > 10:
            for col in sensor_cols:
                if col in df.columns:
                    df[f'{col}_rolling_mean'] = df[col].rolling(window=5, min_periods=1).mean()
                    df[f'{col}_rolling_std'] = df[col].rolling(window=5, min_periods=1).std()
                    features.extend([f'{col}_rolling_mean', f'{col}_rolling_std'])
        
        # Lag features
        for col in sensor_cols:
            if col in df.columns and len(df) > 5:
                df[f'{col}_lag1'] = df[col].shift(1)
                df[f'{col}_lag2'] = df[col].shift(2)
                features.extend([f'{col}_lag1', f'{col}_lag2'])
        
        return df[features].fillna(method='forward').fillna(0)
    
    def train_failure_prediction(self, df):
        \"\"\"Train model to predict equipment failure\"\"\"
        try:
            # Prepare features
            X = self.prepare_features(df)
            
            # Create failure labels (simplified logic)
            y = (
                (df['temperature'] > 85) |
                (df['pressure'] > 2.0) |
                (df['vibration'] > 0.8)
            ).astype(int)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train model
            model = RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                max_depth=10
            )
            model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = model.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Store model and scaler
            self.models['failure_prediction'] = model
            self.scalers['failure_prediction'] = scaler
            self.feature_importance['failure_prediction'] = dict(
                zip(X.columns, model.feature_importances_)
            )
            
            return {
                'model_type': 'failure_prediction',
                'mse': mse,
                'r2_score': r2,
                'feature_importance': self.feature_importance['failure_prediction']
            }
            
        except Exception as e:
            print(f"Error training failure prediction model: {e}")
            return None
    
    def train_anomaly_detection(self, df):
        \"\"\"Train anomaly detection model\"\"\"
        try:
            # Prepare features
            X = self.prepare_features(df)
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Train isolation forest
            model = IsolationForest(
                contamination=0.1,
                random_state=42,
                n_estimators=100
            )
            model.fit(X_scaled)
            
            # Store model and scaler
            self.models['anomaly_detection'] = model
            self.scalers['anomaly_detection'] = scaler
            
            # Detect anomalies in training data
            anomaly_scores = model.decision_function(X_scaled)
            anomalies = model.predict(X_scaled)
            
            return {
                'model_type': 'anomaly_detection',
                'anomaly_count': sum(anomalies == -1),
                'anomaly_percentage': (sum(anomalies == -1) / len(anomalies)) * 100
            }
            
        except Exception as e:
            print(f"Error training anomaly detection model: {e}")
            return None
    
    def predict_failure_probability(self, sensor_data):
        \"\"\"Predict failure probability for new sensor data\"\"\"
        try:
            if 'failure_prediction' not in self.models:
                return None
            
            # Convert to DataFrame
            df = pd.DataFrame([sensor_data])
            
            # Prepare features
            X = self.prepare_features(df)
            
            # Scale features
            X_scaled = self.scalers['failure_prediction'].transform(X)
            
            # Predict
            probability = self.models['failure_prediction'].predict(X_scaled)[0]
            
            # Convert to risk level
            if probability > 0.8:
                risk_level = "Critical"
            elif probability > 0.6:
                risk_level = "High"
            elif probability > 0.4:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            return {
                'failure_probability': float(probability),
                'risk_level': risk_level,
                'confidence': min(100, max(60, probability * 100)),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error predicting failure: {e}")
            return None
    
    def detect_anomaly(self, sensor_data):
        \"\"\"Detect if sensor data is anomalous\"\"\"
        try:
            if 'anomaly_detection' not in self.models:
                return None
            
            # Convert to DataFrame
            df = pd.DataFrame([sensor_data])
            
            # Prepare features
            X = self.prepare_features(df)
            
            # Scale features
            X_scaled = self.scalers['anomaly_detection'].transform(X)
            
            # Predict
            is_anomaly = self.models['anomaly_detection'].predict(X_scaled)[0] == -1
            anomaly_score = self.models['anomaly_detection'].decision_function(X_scaled)[0]
            
            return {
                'is_anomaly': bool(is_anomaly),
                'anomaly_score': float(anomaly_score),
                'severity': 'High' if anomaly_score < -0.5 else 'Medium' if anomaly_score < 0 else 'Low',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error detecting anomaly: {e}")
            return None
    
    def save_models(self, filepath_prefix="smartx_ml_models"):
        \"\"\"Save trained models to disk\"\"\"
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        for model_name, model in self.models.items():
            model_file = f"{filepath_prefix}_{model_name}_{timestamp}.joblib"
            scaler_file = f"{filepath_prefix}_{model_name}_scaler_{timestamp}.joblib"
            
            joblib.dump(model, model_file)
            joblib.dump(self.scalers[model_name], scaler_file)
            
            print(f"Saved {model_name} model: {model_file}")
            print(f"Saved {model_name} scaler: {scaler_file}")
    
    def load_models(self, model_files):
        \"\"\"Load pre-trained models from disk\"\"\"
        for model_name, files in model_files.items():
            self.models[model_name] = joblib.load(files['model'])
            self.scalers[model_name] = joblib.load(files['scaler'])
            print(f"Loaded {model_name} model")

def main():
    # Example usage
    ml_system = SmartXMLSystem()
    
    # Generate sample data for demonstration
    np.random.seed(42)
    n_samples = 1000
    
    sample_data = pd.DataFrame({
        'temperature': np.random.normal(75, 10, n_samples),
        'pressure': np.random.normal(1.5, 0.3, n_samples),
        'vibration': np.random.exponential(0.3, n_samples),
        'humidity': np.random.normal(50, 8, n_samples),
        'timestamp': pd.date_range(start='2024-01-01', periods=n_samples, freq='H')
    })
    
    # Add some anomalies
    anomaly_indices = np.random.choice(n_samples, size=50, replace=False)
    sample_data.loc[anomaly_indices, 'temperature'] += 20
    sample_data.loc[anomaly_indices, 'pressure'] += 1.0
    
    print("Training ML models...")
    
    # Train models
    failure_results = ml_system.train_failure_prediction(sample_data)
    anomaly_results = ml_system.train_anomaly_detection(sample_data)
    
    if failure_results:
        print(f"Failure Prediction Model - R2 Score: {failure_results['r2_score']:.3f}")
    
    if anomaly_results:
        print(f"Anomaly Detection Model - Anomalies Found: {anomaly_results['anomaly_count']}")
    
    # Test prediction on new data
    test_data = {
        'temperature': 95,
        'pressure': 2.5,
        'vibration': 0.9,
        'humidity': 45
    }
    
    failure_pred = ml_system.predict_failure_probability(test_data)
    anomaly_pred = ml_system.detect_anomaly(test_data)
    
    if failure_pred:
        print(f"Failure Prediction: {failure_pred}")
    
    if anomaly_pred:
        print(f"Anomaly Detection: {anomaly_pred}")
    
    # Save models
    ml_system.save_models()

if __name__ == "__main__":
    main()
"""

def generate_mqtt_code(blocks):
    return """#!/usr/bin/env python3
\"\"\"
SmartX MQTT Device Simulator
Generated automatically from visual blocks
\"\"\"
import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime
import threading

class MQTTDeviceSimulator:
    def __init__(self, broker_host="localhost", broker_port=1883, device_id="smartx_device_01"):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.device_id = device_id
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.running = False
        
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"Device {self.device_id} connected to MQTT broker")
            # Subscribe to control messages
            client.subscribe(f"smartx/control/{self.device_id}")
        else:
            print(f"Connection failed: {rc}")
    
    def on_message(self, client, userdata, msg):
        try:
            control_data = json.loads(msg.payload.decode())
            print(f"Received control message: {control_data}")
            self.handle_control_message(control_data)
        except Exception as e:
            print(f"Error processing control message: {e}")
    
    def handle_control_message(self, control_data):
        \"\"\"Handle control messages from the system\"\"\"
        action = control_data.get('action')
        
        if action == "activate_cooling_system":
            print("Activating cooling system...")
        elif action == "activate_heating_system":
            print("Activating heating system...")
        elif action == "open_pressure_relief_valve":
            print("Opening pressure relief valve...")
        elif action == "reduce_machine_speed":
            print("Reducing machine speed...")
        else:
            print(f"Unknown action: {action}")
    
    def generate_sensor_data(self):
        \"\"\"Generate realistic sensor data\"\"\"
        base_temp = 75
        base_pressure = 1.5
        base_vibration = 0.3
        base_humidity = 50
        
        # Add some realistic variation
        temperature = base_temp + random.gauss(0, 5)
        pressure = base_pressure + random.gauss(0, 0.2)
        vibration = max(0.1, base_vibration + random.gauss(0, 0.1))
        humidity = max(30, min(70, base_humidity + random.gauss(0, 3)))
        
        # Occasionally simulate issues
        if random.random() < 0.05:  # 5% chance of high temperature
            temperature += random.uniform(10, 20)
        
        if random.random() < 0.03:  # 3% chance of high pressure
            pressure += random.uniform(0.5, 1.0)
        
        if random.random() < 0.04:  # 4% chance of high vibration
            vibration += random.uniform(0.3, 0.6)
        
        # Determine status based on readings
        if temperature > 85 or pressure > 2.0 or vibration > 0.8:
            status = "Warning"
        elif temperature > 90 or pressure > 2.2 or vibration > 1.0:
            status = "Critical"
        else:
            status = "Running"
        
        # Calculate efficiency (decreases with problems)
        efficiency = 95
        if temperature > 80:
            efficiency -= (temperature - 80) * 2
        if pressure > 1.8:
            efficiency -= (pressure - 1.8) * 10
        if vibration > 0.6:
            efficiency -= (vibration - 0.6) * 20
        
        efficiency = max(60, min(100, efficiency))
        
        return {
            "device_id": self.device_id,
            "temperature": round(temperature, 1),
            "pressure": round(pressure, 2),
            "vibration": round(vibration, 2),
            "humidity": round(humidity, 1),
            "status": status,
            "efficiency": round(efficiency, 1),
            "timestamp": datetime.now().isoformat()
        }
    
    def publish_sensor_data(self):
        \"\"\"Publish sensor data to MQTT topic\"\"\"
        data = self.generate_sensor_data()
        topic = f"smartx/sensors/{self.device_id}"
        
        try:
            self.client.publish(topic, json.dumps(data))
            print(f"Published data: {json.dumps(data, indent=2)}")
        except Exception as e:
            print(f"Error publishing data: {e}")
    
    def start_simulation(self, interval=5):
        \"\"\"Start the device simulation\"\"\"
        print(f"Starting MQTT device simulation for {self.device_id}")
        self.running = True
        
        # Connect to broker
        try:
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"Failed to connect to MQTT broker: {e}")
            return
        
        # Publish data at regular intervals
        while self.running:
            self.publish_sensor_data()
            time.sleep(interval)
    
    def stop_simulation(self):
        \"\"\"Stop the device simulation\"\"\"
        self.running = False
        self.client.loop_stop()
        self.client.disconnect()
        print(f"Stopped simulation for {self.device_id}")

class MultiDeviceSimulator:
    def __init__(self, broker_host="localhost", broker_port=1883):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.devices = []
        self.threads = []
    
    def add_device(self, device_id, interval=5):
        \"\"\"Add a device to the simulation\"\"\"
        device = MQTTDeviceSimulator(
            self.broker_host, 
            self.broker_port, 
            device_id
        )
        self.devices.append((device, interval))
        print(f"Added device: {device_id}")
    
    def start_all_devices(self):
        \"\"\"Start simulation for all devices\"\"\"
        print(f"Starting simulation for {len(self.devices)} devices...")
        
        for device, interval in self.devices:
            thread = threading.Thread(
                target=device.start_simulation,
                args=(interval,)
            )
            thread.daemon = True
            thread.start()
            self.threads.append(thread)
        
        try:
            # Keep the main thread alive
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\\nStopping all device simulations...")
            for device, _ in self.devices:
                device.stop_simulation()

def main():
    # Single device simulation
    print("SmartX MQTT Device Simulator")
    print("Choose simulation mode:")
    print("1. Single device")
    print("2. Multiple devices")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "1":
        device_id = input("Enter device ID (default: smartx_device_01): ").strip()
        if not device_id:
            device_id = "smartx_device_01"
        
        interval = input("Enter data publish interval in seconds (default: 5): ").strip()
        try:
            interval = int(interval) if interval else 5
        except ValueError:
            interval = 5
        
        device = MQTTDeviceSimulator(device_id=device_id)
        device.start_simulation(interval)
    
    elif choice == "2":
        num_devices = input("Enter number of devices (default: 3): ").strip()
        try:
            num_devices = int(num_devices) if num_devices else 3
        except ValueError:
            num_devices = 3
        
        simulator = MultiDeviceSimulator()
        
        for i in range(num_devices):
            device_id = f"smartx_device_{i+1:02d}"
            interval = random.randint(3, 8)  # Random interval between 3-8 seconds
            simulator.add_device(device_id, interval)
        
        simulator.start_all_devices()
    
    else:
        print("Invalid choice. Exiting.")

if __name__ == "__main__":
    main()
"""

def generate_basic_monitoring_code(blocks):
    return """#!/usr/bin/env python3
\"\"\"
SmartX Basic Monitoring System
Generated automatically from visual blocks
\"\"\"
import time
import random
import json
from datetime import datetime

class BasicMonitoringSystem:
    def __init__(self):
        self.thresholds = {
            'temperature': {'min': 60, 'max': 85},
            'pressure': {'min': 1.0, 'max': 2.0},
            'vibration': {'min': 0.1, 'max': 0.7},
            'humidity': {'min': 40, 'max': 60}
        }
    
    def monitor_system(self):
        \"\"\"Generated monitoring function\"\"\"
        # Simulate sensor readings
        temperature = random.randint(60, 100)
        pressure = round(random.uniform(1.0, 2.5), 2)
        vibration = round(random.uniform(0.1, 1.0), 2)
        humidity = random.randint(30, 70)
        
        print(f"Temperature: {temperature}°F")
        print(f"Pressure: {pressure} bar")
        print(f"Vibration: {vibration}")
        print(f"Humidity: {humidity}%")
        
        # Check thresholds
        alerts = []
        
        if temperature > self.thresholds['temperature']['max']:
            alerts.append(f"High temperature alert: {temperature}°F")
        
        if pressure > self.thresholds['pressure']['max']:
            alerts.append(f"High pressure alert: {pressure} bar")
        
        if vibration > self.thresholds['vibration']['max']:
            alerts.append(f"Excessive vibration: {vibration}")
        
        if humidity < self.thresholds['humidity']['min'] or humidity > self.thresholds['humidity']['max']:
            alerts.append(f"Humidity out of range: {humidity}%")
        
        if alerts:
            print("🚨 ALERTS:")
            for alert in alerts:
                print(f"  - {alert}")
            return "maintenance_required"
        else:
            print("✅ All systems normal")
            return "normal"
    
    def main(self):
        \"\"\"Main execution function\"\"\"
        print("Starting SmartX monitoring system...")
        
        while True:
            print(f"\\n--- {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---")
            status = self.monitor_system()
            
            if status == "maintenance_required":
                print("⚠️ Initiating maintenance protocol...")
                # In a real system, this would trigger maintenance workflows
            
            time.sleep(5)

if __name__ == "__main__":
    system = BasicMonitoringSystem()
    try:
        system.main()
    except KeyboardInterrupt:
        print("\\nMonitoring system stopped.")
"""

if __name__ == "__main__":
    # Initialize MQTT when app starts
    initialize_mqtt()
    app.run(host="0.0.0.0", port=5000, debug=True)
