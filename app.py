import os
from flask import Flask, render_template, request, jsonify
import random
import json
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard_page():
    return render_template("dashboard.html")

@app.route("/api/dashboard")
def dashboard_api():
    """API endpoint for real-time dashboard data"""
    data = {
        "temperature": random.randint(60, 100),
        "pressure": round(random.uniform(1.0, 2.5), 2),
        "vibration": round(random.uniform(0.1, 1.0), 2),
        "humidity": random.randint(30, 70),
        "status": random.choice(["Running", "Maintenance", "Idle"]),
        "efficiency": random.randint(75, 95),
        "timestamp": datetime.now().isoformat()
    }
    return jsonify(data)

@app.route("/twin")
def twin_page():
    return render_template("twin.html")

@app.route("/api/twin-data")
def twin_data():
    """API endpoint for 3D twin sensor data"""
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
def predict_page():
    return render_template("predict.html")

@app.route("/api/predict", methods=["POST"])
def predict_api():
    """API endpoint for predictive analytics"""
    try:
        data = request.get_json()
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
def nocode():
    return render_template("blockly.html")

@app.route("/api/generate-code", methods=["POST"])
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
