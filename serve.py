"""Local dev server for the rangoli generator.

Same as `python3 -m http.server`, but tells the browser never to cache, so a normal reload
always picks up the latest code (the plain server lets browsers keep stale copies).
"""
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5317


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    http.server.ThreadingHTTPServer(("", PORT), NoCache).serve_forever()
