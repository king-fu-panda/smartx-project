
from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/nocode")
def nocode():
    return render_template("blockly.html")

@app.route("/dashboard")
def dashboard():
    data = {
        "temperature": random.randint(60, 100),
        "pressure": round(random.uniform(1.0, 2.5), 2),
        "status": "Running"
    }
    return jsonify(data)

@app.route("/predict")
def predict():
    temperature = float(request.args.get("temperature", 75))
    if temperature > 85:
        risk = "High Risk of Overheat"
    else:
        risk = "Normal Operation"
    return jsonify({
        "temperature": temperature,
        "prediction": risk
    })

@app.route("/twin")
def twin():
    return '''
    <!DOCTYPE html>
    <html><head><title>3D Twin</title></head><body>
    <script src="https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js"></script>
    <div id="scene"></div>
    <script>
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({color: 0x007BFF});
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 5;
    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();
    </script>
    </body></html>
    '''

if __name__ == "__main__":
    app.run(debug=True)
