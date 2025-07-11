
import os
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import random
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

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

# Helper functions for data management
def load_data():
    """Load data from data.json file"""
    try:
        with open('data.json', 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def save_data(data):
    """Save data to data.json file"""
    try:
        with open('data.json', 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        app.logger.error(f"Error saving data: {str(e)}")
        return False

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
            return redirect(url_for('dashboard_page'))
        else:
            flash("Invalid username or password", "error")
    
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out", "info")
    return redirect(url_for('login'))

@app.route("/")
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
    # Try to load real data first, fallback to random if none exists
    data = load_data()
    if data is None:
        data = get_fallback_data()
    
    return jsonify(data)

# New IoT Device Data Receiver
@app.route("/api/device-data", methods=["POST"])
def receive_device_data():
    """API endpoint to receive sensor data from IoT devices"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['temperature', 'pressure', 'vibration', 'humidity', 'status', 'efficiency']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Add timestamp
        data['timestamp'] = datetime.now().isoformat()
        
        # Save to file
        if save_data(data):
            app.logger.info(f"Received and saved device data: {data}")
            return jsonify({"message": "Data received successfully", "timestamp": data['timestamp']}), 200
        else:
            return jsonify({"error": "Failed to save data"}), 500
            
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
    # Try to load real data first, fallback to random if none exists
    stored_data = load_data()
    
    if stored_data:
        # Use stored data but add twin-specific fields
        data = {
            "temperature": stored_data.get("temperature", 75),
            "pressure": stored_data.get("pressure", 1.5),
            "rpm": random.randint(1000, 3000),  # RPM not typically sent by basic sensors
            "power": round(random.uniform(50, 200), 1),
            "status": stored_data.get("status", "Operating").replace("Running", "Operating"),
            "alerts": []
        }
    else:
        # Fallback to random data
        data = {
            "temperature": random.randint(60, 100),
            "pressure": round(random.uniform(1.0, 2.5), 2),
            "rpm": random.randint(1000, 3000),
            "power": round(random.uniform(50, 200), 1),
            "status": random.choice(["Operating", "Warning", "Critical"]),
            "alerts": []
        }
    
    # Add alerts based on conditions
    if data["temperature"] > 85:
        data["alerts"].append("High Temperature Alert")
    if data["pressure"] > 2.0:
        data["alerts"].append("Pressure Warning")
    
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
        
        # If no input data provided, try to use stored data
        if not data:
            stored_data = load_data()
            if stored_data:
                data = stored_data
            else:
                return jsonify({"error": "No data available for prediction"}), 400
        
        temperature = float(data.get("temperature", 75))
        pressure = float(data.get("pressure", 1.5))
        vibration = float(data.get("vibration", 0.5))
        humidity = float(data.get("humidity", 50))
        
        # Simple prediction logic
        risk_score = 0
        risk_factors = []
        
        if temperature > 85:
            risk_score += 30
            risk_factors.append("High temperature detected")
        elif temperature > 75:
            risk_score += 10
            risk_factors.append("Elevated temperature")
            
        if pressure > 2.0:
            risk_score += 25
            risk_factors.append("High pressure levels")
        elif pressure > 1.8:
            risk_score += 10
            risk_factors.append("Moderate pressure increase")
            
        if vibration > 0.8:
            risk_score += 20
            risk_factors.append("Excessive vibration")
        elif vibration > 0.6:
            risk_score += 10
            risk_factors.append("Elevated vibration levels")
            
        if humidity > 60 or humidity < 40:
            risk_score += 15
            risk_factors.append("Humidity outside optimal range")
        
        # Determine risk level
        if risk_score >= 50:
            risk_level = "High Risk"
            recommendation = "Immediate maintenance required"
        elif risk_score >= 25:
            risk_level = "Medium Risk"
            recommendation = "Schedule maintenance within 24 hours"
        else:
            risk_level = "Low Risk"
            recommendation = "Normal operation - continue monitoring"
        
        return jsonify({
            "temperature": temperature,
            "pressure": pressure,
            "vibration": vibration,
            "humidity": humidity,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendation": recommendation,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        app.logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": "Invalid input data"}), 400

@app.route("/nocode")
@login_required
def nocode():
    return render_template("blockly.html")

@app.route("/api/generate-code", methods=["POST"])
@login_required
def generate_code():
    """Generate Python code from Blockly workspace"""
    try:
        data = request.get_json()
        blocks_xml = data.get("xml", "")
        
        # Simple code generation based on common blocks
        # In a real implementation, you'd parse the XML and generate proper code
        generated_code = """# Generated SmartX Automation Code
import time
import random

def monitor_system():
    \"\"\"Generated monitoring function\"\"\"
    temperature = random.randint(60, 100)
    pressure = round(random.uniform(1.0, 2.5), 2)
    
    if temperature > 85:
        print("Alert: High temperature detected!")
        return "maintenance_required"
    else:
        print("System operating normally")
        return "normal"

def main():
    \"\"\"Main execution function\"\"\"
    while True:
        status = monitor_system()
        if status == "maintenance_required":
            print("Initiating maintenance protocol...")
            break
        time.sleep(5)

if __name__ == "__main__":
    main()
"""
        
        return jsonify({
            "code": generated_code,
            "filename": f"smartx_automation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py"
        })
        
    except Exception as e:
        app.logger.error(f"Code generation error: {str(e)}")
        return jsonify({"error": "Code generation failed"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
