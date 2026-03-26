import http.server
import socketserver
import json
import urllib.parse
from datetime import datetime
import os

PORT = 8080
DIRECTORY = "frontend"

MOCK_EVENTS = [
    {
        "id": 1,
        "title": "Neon Symphony Concert",
        "description": "An electronic synthwave night.",
        "date": "2026-06-15",
        "time": "20:00",
        "venue": "Cyber Arena",
        "price": 45.00,
        "seats": 500,
        "available_seats": 230
    },
    {
        "id": 2,
        "title": "Tech UI/UX Conference",
        "description": "Designing the future.",
        "date": "2026-07-10",
        "time": "09:00",
        "venue": "Grand Expo Center",
        "price": 120.00,
        "seats": 1000,
        "available_seats": 54
    }
]

class MockAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/backend/api/'):
            self.handle_api_get(parsed)
        else:
            return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/backend/api/'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b""
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
            except:
                data = {}
            self.handle_api_post(parsed, data)
        else:
            self.send_response(405)
            self.end_headers()

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/backend/api/'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b""
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
            except:
                data = {}
            self.handle_api_post(parsed, data)
        else:
            self.send_response(405)
            self.end_headers()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/backend/api/'):
            self.handle_api_delete(parsed)
        else:
            self.send_response(405)
            self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def handle_api_get(self, parsed):
        endpoint = parsed.path.replace('/backend/api/', '')
        if endpoint == 'events.php':
            self.send_json(MOCK_EVENTS)
            
        elif endpoint == 'bookings.php':
            # Mock My Bookings
            self.send_json([
                {
                    "id": 1,
                    "title": "Mock Past Event",
                    "date": "2026-01-01",
                    "time": "12:00",
                    "venue": "Local Hall",
                    "tickets_count": 2,
                    "total_price": 40.00
                }
            ])
            
        elif endpoint == 'payment.php':
            # Analytics
            self.send_json({
                "total_revenue": "14500.00",
                "events_performance": []
            })
        else:
            self.send_json({"error": "Not Found"}, 404)

    def handle_api_post(self, parsed, data):
        endpoint = parsed.path.replace('/backend/api/', '')
        if endpoint.startswith('events.php'):
            new_id = len(MOCK_EVENTS) + 1
            try:
                price = float(data.get("price") or 0)
            except:
                price = 0.0
            try:
                seats = int(data.get("seats") or 0)
            except:
                seats = 0

            new_event = {
                "id": new_id,
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "date": data.get("date", ""),
                "time": data.get("time", ""),
                "venue": data.get("venue", ""),
                "price": price,
                "seats": seats,
                "available_seats": seats
            }
            MOCK_EVENTS.append(new_event)
            self.send_json({"message": "Event created successfully", "id": new_id})

        elif endpoint == 'auth.php':
            action = urllib.parse.parse_qs(parsed.query).get('action', [''])[0]
            if action == 'login':
                self.send_json({
                    "message": "Login successful (Admin permissions granted)", 
                    "user": {
                        "id": 1, 
                        "name": data.get('email', 'Admin').split('@')[0], 
                        "email": data.get('email'), 
                        "role": "Admin"
                    }
                })
            else:
                self.send_json({"message": "Registration successful. Please login."})
        elif endpoint == 'bookings.php':
            self.send_json({"message": "Booking successful", "booking_id": 99, "total_price": 50.00})
        elif endpoint == 'payment.php':
            self.send_json({"message": "Payment completed", "status": "Completed", "transaction_id": "TXN_MOCK_123"})
        else:
            self.send_json({"error": "Not Found"}, 404)

    def handle_api_delete(self, parsed):
        endpoint = parsed.path.replace('/backend/api/', '')
        if endpoint.startswith('events.php'):
            query = urllib.parse.parse_qs(parsed.query)
            event_id = int(query.get('id', ['0'])[0])
            global MOCK_EVENTS
            MOCK_EVENTS = [e for e in MOCK_EVENTS if e['id'] != event_id]
            self.send_json({"message": "Event deleted successfully"})
        else:
            self.send_json({"error": "Not Found"}, 404)

class ResuableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

with ResuableTCPServer(("127.0.0.1", PORT), MockAPIHandler) as httpd:
    print(f"Serving securely at http://127.0.0.1:{PORT}")
    httpd.serve_forever()
