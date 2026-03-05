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


class TodoCreateIntegrationTests(unittest.TestCase):
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
        cls.test_db_path = backend_root / "test_todo_create.db"
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

    def test_create_todo_success_returns_envelope_and_persists(self) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/todos",
            data=json.dumps({"description": "Buy milk"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request) as response:
            payload = json.loads(response.read().decode("utf-8"))
            status_code = response.status

        self.assertEqual(status_code, 201)
        self.assertIn("data", payload)

        data = payload["data"]
        self.assertIsInstance(data["id"], int)
        self.assertEqual(data["description"], "Buy milk")
        self.assertEqual(data["is_completed"], False)
        self.assertIn("created_at", data)

        with sqlite3.connect(self.test_db_path) as connection:
            row = connection.execute("SELECT COUNT(*), MIN(description) FROM todos").fetchone()
            self.assertEqual(row[0], 1)
            self.assertEqual(row[1], "Buy milk")

    def test_create_todo_invalid_payloads_return_error_and_do_not_persist(self) -> None:
        with sqlite3.connect(self.test_db_path) as connection:
            initial_count = connection.execute("SELECT COUNT(*) FROM todos").fetchone()[0]

        invalid_payloads = [
            {"description": "   "},
            {},
            {"description": None},
            {"description": 123},
            {"description": ["bad"]},
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                request = urllib.request.Request(
                    f"{self.base_url}/todos",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )

                try:
                    urllib.request.urlopen(request)
                    self.fail("Expected HTTP 400 for invalid payload")
                except urllib.error.HTTPError as http_error:
                    self.assertEqual(http_error.code, 400)
                    error_payload = json.loads(http_error.read().decode("utf-8"))
                    http_error.close()

                self.assertIn("error", error_payload)

                error = error_payload["error"]
                self.assertEqual(error["code"], "VALIDATION_ERROR")
                self.assertEqual(error["message"], "Request validation failed")
                self.assertIsInstance(error["details"], list)
                self.assertTrue(error["request_id"])

        with sqlite3.connect(self.test_db_path) as connection:
            final_count = connection.execute("SELECT COUNT(*) FROM todos").fetchone()[0]

        self.assertEqual(final_count, initial_count)

    def test_get_todos_returns_empty_list_in_success_envelope(self) -> None:
        with sqlite3.connect(self.test_db_path) as connection:
            connection.execute("DELETE FROM todos")
            connection.commit()

        with urllib.request.urlopen(f"{self.base_url}/todos") as response:
            payload = json.loads(response.read().decode("utf-8"))
            status_code = response.status

        self.assertEqual(status_code, 200)
        self.assertEqual(payload, {"data": []})

    def test_get_todos_returns_populated_list_with_expected_fields(self) -> None:
        for description in ["First task", "Second task"]:
            request = urllib.request.Request(
                f"{self.base_url}/todos",
                data=json.dumps({"description": description}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(request) as response:
                self.assertEqual(response.status, 201)

        with urllib.request.urlopen(f"{self.base_url}/todos") as response:
            payload = json.loads(response.read().decode("utf-8"))
            status_code = response.status

        self.assertEqual(status_code, 200)
        self.assertIn("data", payload)
        self.assertEqual(len(payload["data"]), 2)

        first_item = payload["data"][0]
        self.assertSetEqual(set(first_item.keys()), {"id", "description", "is_completed", "created_at"})
        self.assertIsInstance(first_item["id"], int)
        self.assertIsInstance(first_item["description"], str)
        self.assertIs(first_item["is_completed"], False)
        self.assertIsInstance(first_item["created_at"], str)

        descriptions = [item["description"] for item in payload["data"]]
        self.assertEqual(descriptions, ["Second task", "First task"])


if __name__ == "__main__":
    unittest.main()
