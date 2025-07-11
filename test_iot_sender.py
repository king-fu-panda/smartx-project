
import requests
import json
import time
import random
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"  # Change this to your actual URL when deployed
DEVICE_DATA_ENDPOINT = f"{BASE_URL}/api/device-data"

def generate_sample_data():
    """Generate realistic sample sensor data"""
    return {
        "temperature": random.randint(65, 95),
        "pressure": round(random.uniform(1.2, 2.3), 2),
        "vibration": round(random.uniform(0.2, 0.9), 2),
        "humidity": random.randint(35, 65),
        "status": random.choice(["Running", "Maintenance", "Idle"]),
        "efficiency": random.randint(70, 98)
    }

def send_data():
    """Send sample data to the IoT endpoint"""
    try:
        data = generate_sample_data()
        print(f"Sending data: {json.dumps(data, indent=2)}")
        
        response = requests.post(
            DEVICE_DATA_ENDPOINT,
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print(f"✅ Data sent successfully: {response.json()}")
        else:
            print(f"❌ Failed to send data: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure your Flask app is running")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    """Main function to send test data"""
    print("🚀 SmartX IoT Data Sender")
    print(f"📡 Sending data to: {DEVICE_DATA_ENDPOINT}")
    print("-" * 50)
    
    # Send one batch of data
    send_data()
    
    # Ask if user wants to send continuous data
    while True:
        choice = input("\nSend another batch? (y/n/continuous): ").lower().strip()
        
        if choice == 'y':
            send_data()
        elif choice == 'n':
            print("👋 Goodbye!")
            break
        elif choice == 'continuous':
            print("📊 Sending continuous data every 10 seconds. Press Ctrl+C to stop...")
            try:
                while True:
                    send_data()
                    time.sleep(10)
            except KeyboardInterrupt:
                print("\n🛑 Stopped sending data")
                break
        else:
            print("Please enter 'y', 'n', or 'continuous'")

if __name__ == "__main__":
    main()
