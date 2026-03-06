import json
import os
import socket
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path


class _BaseDeleteIntegrationTest(unittest.TestCase):
    @staticmethod
    def _get_free_port() -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            return int(sock.getsockname()[1])

    def _create_todo(self, description: str) -> int:
        """Helper: POST /todos and return the created todo's id."""
        payload = json.dumps({"description": description}).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/todos",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        return int(body["data"]["id"])


class TodoDeleteSuccessTests(_BaseDeleteIntegrationTest):
    @classmethod
    def setUpClass(cls) -> None:
        backend_root = Path(__file__).resolve().parents[1]
        cls.backend_root = backend_root
        cls.test_db_path = backend_root / "test_todo_delete.db"
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

    def test_delete_existing_todo_returns_204_no_content(self) -> None:
        """DELETE /todos/{id} with an existing id returns 204 and no body."""
        todo_id = self._create_todo("Task to be deleted")

        request = urllib.request.Request(
            f"{self.base_url}/todos/{todo_id}",
            method="DELETE",
        )
        with urllib.request.urlopen(request) as resp:
            self.assertEqual(resp.status, 204)
            body = resp.read()
        self.assertEqual(body, b"")

    def test_deleted_todo_no_longer_appears_in_list(self) -> None:
        """After deletion the item should not be present in GET /todos."""
        todo_id = self._create_todo("Task to verify removal")

        # Delete it
        delete_req = urllib.request.Request(
            f"{self.base_url}/todos/{todo_id}",
            method="DELETE",
        )
        with urllib.request.urlopen(delete_req):
            pass

        # Verify it's gone
        with urllib.request.urlopen(f"{self.base_url}/todos") as resp:
            body = json.loads(resp.read().decode("utf-8"))

        ids_in_list = [item["id"] for item in body["data"]]
        self.assertNotIn(todo_id, ids_in_list)


class TodoDeleteNotFoundTests(_BaseDeleteIntegrationTest):
    @classmethod
    def setUpClass(cls) -> None:
        backend_root = Path(__file__).resolve().parents[1]
        cls.backend_root = backend_root
        cls.test_db_path = backend_root / "test_todo_delete_notfound.db"
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

    def test_delete_nonexistent_todo_returns_404_error_envelope(self) -> None:
        """DELETE /todos/{id} with a non-existent id returns 404 standardized error envelope."""
        request = urllib.request.Request(
            f"{self.base_url}/todos/99999",
            headers={"x-request-id": "qa-delete-not-found"},
            method="DELETE",
        )
        with self.assertRaises(urllib.error.HTTPError) as context:
            urllib.request.urlopen(request)

        self.assertEqual(context.exception.code, 404)
        payload = json.loads(context.exception.read().decode("utf-8"))

        self.assertIn("error", payload)
        self.assertEqual(payload["error"]["code"], "NOT_FOUND")
        self.assertIsInstance(payload["error"]["message"], str)
        self.assertTrue(len(payload["error"]["message"]) > 0)
        self.assertEqual(payload["error"]["request_id"], "qa-delete-not-found")


if __name__ == "__main__":
    unittest.main()
