import json
import subprocess
import time
import unittest
import urllib.request
from pathlib import Path


class HealthReadinessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        backend_root = Path(__file__).resolve().parents[1]
        cls.server = subprocess.Popen(
            [
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                "8001",
            ],
            cwd=backend_root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        for _ in range(30):
            try:
                with urllib.request.urlopen("http://127.0.0.1:8001/health") as response:
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
        with urllib.request.urlopen("http://127.0.0.1:8001/health") as response:
            payload = json.loads(response.read().decode("utf-8"))

        self.assertEqual(payload, {"status": "ok"})

    def test_readiness_endpoint(self) -> None:
        with urllib.request.urlopen("http://127.0.0.1:8001/ready") as response:
            payload = json.loads(response.read().decode("utf-8"))

        self.assertEqual(payload, {"status": "ready"})


if __name__ == "__main__":
    unittest.main()
