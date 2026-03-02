import requests
import json

BASE_URL = "https://aquasense-api-cqdy.onrender.com" # Or local URL if testing locally
# BASE_URL = "http://localhost:8000"

def test_add_ph_voltage():
    url = f"{BASE_URL}/sensors/add/ph_voltage"
    payload = {
        "device_id": "test_device",
        "voltage": 2.5
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print(f"POST /sensors/add/ph_voltage status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_get_latest_ph_voltage():
    url = f"{BASE_URL}/sensors/latest/ph_voltage"
    
    try:
        response = requests.get(url)
        print(f"GET /sensors/latest/ph_voltage status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_add_ph_voltage()
    test_get_latest_ph_voltage()
