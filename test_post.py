import urllib.request
import json

data = json.dumps({"title":"Test API Event", "price": 999.0, "seats": 100}).encode('utf-8')
req = urllib.request.Request("http://127.0.0.1:8080/backend/api/events.php", data=data, method="POST")
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req) as f:
        print("SUCCESS:", f.read().decode('utf-8'))
except Exception as e:
    print("FAILED:", e)
