import requests
import numpy as np

# 1. Generate "Dropped Phone" data (A sudden, short spike)
def get_drop_noise():
    data = np.random.normal(0, 0.1, (3, 100)) # Background static
    spike_idx = 50
    data[:, spike_idx:spike_idx+5] += 4.0      # Sharp, high-amplitude spike
    return data.tolist()

# 2. Generate "Walking/Jitter" data (High-frequency, rhythmic)
def get_jitter_noise():
    t = np.linspace(0, 50, 100)
    data = np.sin(t * 10) * 0.5 + np.random.normal(0, 0.1, (3, 100))
    return data.tolist()

print("Testing Noise/Non-Earthquake data...")
url = "http://localhost:8000/analyze-seismic"

# Test Case A: Drop
resp_a = requests.post(url, json={"payload": get_drop_noise()})
print("\n--- TEST: DROPPED PHONE ---")
print(resp_a.json())

# Test Case B: Rhythmic Jitter
resp_b = requests.post(url, json={"payload": get_jitter_noise()})
print("\n--- TEST: RHYTHMIC JITTER ---")
print(resp_b.json())