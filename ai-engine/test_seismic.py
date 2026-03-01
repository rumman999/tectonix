import requests
import numpy as np

print("Generating synthetic earthquake data...")

# Create fake data: 3 axes, 100 readings each (2 seconds of data)
# We will use a sine wave mixed with noise to simulate an earthquake!
t = np.linspace(0, 10, 100)
fake_earthquake = []
for _ in range(3):
    axis_data = np.sin(t) * np.cos(t/2) + np.random.normal(0, 0.5, 100)
    fake_earthquake.append(axis_data.tolist())

# Format the JSON payload exactly how our FastAPI endpoint expects it
data = {
    "payload": fake_earthquake
}

print("Sending to FastAPI Server...")
url = "http://localhost:8000/analyze-seismic"

try:
    response = requests.post(url, json=data)
    print("\n--- SERVER RESPONSE ---")
    print(response.json())
except Exception as e:
    print("Error connecting to server:", e)