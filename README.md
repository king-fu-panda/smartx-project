
# SmartX - Industrial IoT Platform

A comprehensive Industrial IoT platform for smart manufacturing with real-time monitoring, 3D digital twins, AI-powered predictive analytics, and no-code workflow automation.

## 🚀 Features

### 📊 Real-Time Dashboard
- Live sensor data visualization
- System performance metrics
- Active alerts and notifications
- Equipment status monitoring

### 🧊 3D Digital Twin
- Interactive 3D visualization of industrial equipment
- Real-time sensor data integration
- Visual status indicators
- Immersive monitoring experience

### 🤖 AI Predictive Analytics
- Machine learning-powered risk assessment
- Predictive maintenance recommendations
- Multi-parameter analysis (temperature, pressure, vibration, humidity)
- Real-time risk scoring and alerts

### 🧱 No-Code Workflow Builder
- Visual block-based programming interface
- Automated code generation
- Custom automation workflows
- Industrial process automation

## 🛠️ Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, JavaScript, Tailwind CSS
- **3D Graphics**: Three.js
- **Charts**: Chart.js
- **Deployment**: Gunicorn WSGI server

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/smartx-iot-platform.git
cd smartx-iot-platform
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python main.py
```

This app is avaliable at https://smartx-project.onrender.com

## 🚀 Deployment
https://smartx-project.onrender.com
```

## 📁 Project Structure

```
smartx-iot-platform/
├── app.py                 # Main Flask application
├── main.py               # Application entry point
├── templates/            # HTML templates
│   ├── index.html       # Landing page
│   ├── dashboard.html   # Real-time dashboard
│   ├── twin.html        # 3D digital twin
│   ├── predict.html     # Predictive analytics
│   └── blockly.html     # No-code builder
├── static/              # Static assets
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript files
├── export_project.py    # Project export utility
└── pyproject.toml      # Project configuration
```

## 🌟 API Endpoints

- `GET /` - Landing page
- `GET /dashboard` - Real-time dashboard
- `GET /api/dashboard` - Dashboard data API
- `GET /twin` - 3D digital twin interface
- `GET /api/twin-data` - Twin sensor data API
- `GET /predict` - Predictive analytics interface
- `POST /api/predict` - Prediction analysis API
- `GET /nocode` - No-code workflow builder
- `POST /api/generate-code` - Code generation API


## 📊 Sample Data

The platform generates realistic sample data for demonstration:
- Temperature: 60-100°F
- Pressure: 1.0-2.5 PSI
- Vibration: 0.1-1.0 units
- Humidity: 30-70%
- Equipment status and efficiency metrics



## 🏭 Industrial Applications

- Manufacturing process monitoring
- Equipment health monitoring
- Predictive maintenance
- Quality control automation
- Energy efficiency optimization
- Safety system integration




**SmartX Platform** - Transforming manufacturing through intelligent IoT solutions.
