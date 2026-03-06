import json
import socket
import subprocess
import time
import unittest
import urllib.request
from pathlib import Path


class HealthReadinessTests(unittest.TestCase):
    @staticmethod
    def _get_free_port() -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            return int(sock.getsockname()[1])

    @classmethod
    def setUpClass(cls) -> None:
        backend_root = Path(__file__).resolve().parents[1]
        cls.port = cls._get_free_port()
        cls.base_url = f"http://127.0.0.1:{cls.port}"
        cls.server = subprocess.Popen(
            [
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(cls.port),
            ],
            cwd=backend_root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        for _ in range(30):
            try:
                with urllib.request.urlopen(f"{cls.base_url}/health") as response:
                    if response.status == 200:
                        return
            except Exception:
                time.sleep(0.2)

        raise RuntimeError("Backend server did not start in time for tests")

    @classmethod
    def tearDownClass(cls) -> None:
        if cls.server.poll() is None:
            cls.server.terminate()
            cls.server.wait(timeout=5)

    def test_health_endpoint(self) -> None:
        with urllib.request.urlopen(f"{self.base_url}/health") as response:
            payload = json.loads(response.read().decode("utf-8"))

        self.assertEqual(payload, {"status": "ok"})

    def test_readiness_endpoint(self) -> None:
        with urllib.request.urlopen(f"{self.base_url}/ready") as response:
            payload = json.loads(response.read().decode("utf-8"))

        self.assertEqual(payload, {"status": "ready"})

    def test_health_simple_cors_response_includes_allow_origin_for_frontend(self) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/health",
            headers={"Origin": "http://localhost:5173"},
            method="GET",
        )

        with urllib.request.urlopen(request) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(
                response.headers.get("Access-Control-Allow-Origin"),
                "http://localhost:5173",
            )

    def test_todos_preflight_cors_response_includes_required_headers(self) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/todos",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
            method="OPTIONS",
        )

        with urllib.request.urlopen(request) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(
                response.headers.get("Access-Control-Allow-Origin"),
                "http://localhost:5173",
            )
            self.assertIn("GET", response.headers.get("Access-Control-Allow-Methods", ""))


if __name__ == "__main__":
    unittest.main()
