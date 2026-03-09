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


class TodoUpdateIntegrationTests(unittest.TestCase):
    @staticmethod
    def _get_free_port() -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            return int(sock.getsockname()[1])

    @classmethod
    def setUpClass(cls) -> None:
        backend_root = Path(__file__).resolve().parents[1]
        cls.backend_root = backend_root
        cls.test_db_path = backend_root / "test_todo_update.db"
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

    def setUp(self) -> None:
        # Create a todo to update
        req = urllib.request.Request(
            f"{self.base_url}/todos",
            data=json.dumps({"description": "Original Task"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))["data"]
            self.todo_id = data["id"]

    def test_update_todo_completion_status(self) -> None:
        req = urllib.request.Request(
            f"{self.base_url}/todos/{self.todo_id}",
            data=json.dumps({"is_completed": True}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PATCH",
        )
        with urllib.request.urlopen(req) as response:
            self.assertEqual(response.status, 200)
            data = json.loads(response.read().decode("utf-8"))["data"]
            self.assertTrue(data["is_completed"])
            self.assertEqual(data["description"], "Original Task")

        # Verify persistence
        with sqlite3.connect(self.test_db_path) as connection:
            row = connection.execute("SELECT is_completed FROM todos WHERE id=?", (self.todo_id,)).fetchone()
            self.assertTrue(row[0])  # SQLite boolean is 1/0, but usually stored as int. Wait, check schema type.
            # Usually strict type systems handle this. Let's assume 1.

    def test_update_todo_description(self) -> None:
        req = urllib.request.Request(
            f"{self.base_url}/todos/{self.todo_id}",
            data=json.dumps({"description": "Updated Task"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PATCH",
        )
        with urllib.request.urlopen(req) as response:
            self.assertEqual(response.status, 200)
            data = json.loads(response.read().decode("utf-8"))["data"]
            self.assertEqual(data["description"], "Updated Task")
            self.assertFalse(data["is_completed"])

    def test_update_non_existent_todo_returns_404(self) -> None:
        req = urllib.request.Request(
            f"{self.base_url}/todos/99999",
            data=json.dumps({"description": "Ghost"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PATCH",
        )
        try:
            urllib.request.urlopen(req)
            self.fail("Should have raised HTTPError")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 404)
