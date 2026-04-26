import requests

# Login
login_data = {"email": "farmer1@agro.com", "password": "password123"}
resp = requests.post("http://127.0.0.1:8000/auth/login", json=login_data)
if resp.status_code != 200:
    print(f"Login failed: {resp.status_code} - {resp.text}")
else:
    token = resp.json()["access_token"]
    print(f"✓ Logged in as farmer1@agro.com")
    
    # Test /farmer/alerts
    headers = {"Authorization": f"Bearer {token}"}
    alerts_resp = requests.get("http://127.0.0.1:8000/farmer/alerts?limit=30", headers=headers)
    print(f"\n/farmer/alerts Status: {alerts_resp.status_code}")
    if alerts_resp.status_code == 200:
        alerts = alerts_resp.json()
        print(f"✓ Got {len(alerts)} alerts")
        for alert in alerts[:3]:
            print(f"  - {alert['title']}")
    else:
        print(f"✗ Error: {alerts_resp.text[:200]}")
