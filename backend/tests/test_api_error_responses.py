import json
import os
import socket
import sqlite3
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path


class _BaseApiIntegrationTest(unittest.TestCase):
    @staticmethod
    def _get_free_port() -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            return int(sock.getsockname()[1])


class ApiValidationAndRoutingErrorTests(_BaseApiIntegrationTest):
    @classmethod
    def setUpClass(cls) -> None:
        backend_root = Path(__file__).resolve().parents[1]
        cls.backend_root = backend_root
        cls.test_db_path = backend_root / "test_api_errors_migrated.db"
        if cls.test_db_path.exists():
            cls.test_db_path.unlink()

        env = os.environ.copy()
        env["DATABASE_URL"] = f"sqlite:///{cls.test_db_path}"

        subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=backend_root,
            env=env,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

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
            env=env,
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
        if cls.test_db_path.exists():
            cls.test_db_path.unlink()

    def test_unknown_route_returns_404(self) -> None:
        with self.assertRaises(urllib.error.HTTPError) as context:
            urllib.request.urlopen(f"{self.base_url}/not-a-real-route")

        self.assertEqual(context.exception.code, 404)

    def test_create_todo_invalid_json_returns_validation_envelope_and_request_id(self) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/todos",
            data=b'{"description": "Missing quote}',
            headers={
                "Content-Type": "application/json",
                "x-request-id": "qa-e2e-invalid-json",
            },
            method="POST",
        )

        with self.assertRaises(urllib.error.HTTPError) as context:
            urllib.request.urlopen(request)

        self.assertEqual(context.exception.code, 400)
        payload = json.loads(context.exception.read().decode("utf-8"))

        self.assertIn("error", payload)
        self.assertEqual(payload["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(payload["error"]["message"], "Request validation failed")
        self.assertIsInstance(payload["error"]["details"], list)
        self.assertEqual(payload["error"]["request_id"], "qa-e2e-invalid-json")


class ApiUnhandledExceptionErrorTests(_BaseApiIntegrationTest):
    @classmethod
    def setUpClass(cls) -> None:
        backend_root = Path(__file__).resolve().parents[1]
        cls.backend_root = backend_root
        cls.test_db_path = backend_root / "test_api_errors_unmigrated.db"
        if cls.test_db_path.exists():
            cls.test_db_path.unlink()

        env = os.environ.copy()
        env["DATABASE_URL"] = f"sqlite:///{cls.test_db_path}"

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
            env=env,
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
        if cls.test_db_path.exists():
            cls.test_db_path.unlink()

    def test_list_todos_returns_500_internal_error_envelope_when_storage_unavailable(self) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/todos",
            headers={"x-request-id": "qa-e2e-internal-error"},
            method="GET",
        )

        with self.assertRaises(urllib.error.HTTPError) as context:
            urllib.request.urlopen(request)

        self.assertEqual(context.exception.code, 500)
        payload = json.loads(context.exception.read().decode("utf-8"))

        self.assertIn("error", payload)
        self.assertEqual(payload["error"]["code"], "INTERNAL_SERVER_ERROR")
        self.assertEqual(payload["error"]["message"], "An unexpected error occurred")
        self.assertEqual(payload["error"]["details"], [])
        self.assertEqual(payload["error"]["request_id"], "qa-e2e-internal-error")


if __name__ == "__main__":
    unittest.main()
