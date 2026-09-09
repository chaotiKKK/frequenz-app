"""Kleiner statischer Server ohne Cache (fuer die Entwicklung)."""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8472

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True   # sofortiges Re-Bind trotz TIME_WAIT (Windows)
    daemon_threads = True

with ReusableTCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
    print(f"Serving on http://127.0.0.1:{PORT}")
    httpd.serve_forever()
