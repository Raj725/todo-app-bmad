import json
import os
import socket
import subprocess
import sys
import time
import unittest
import urllib.request
from pathlib import Path


class PersistenceDurabilityTests(unittest.TestCase):
    @staticmethod
    def _get_free_port() -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            return int(sock.getsockname()[1])

    @classmethod
    def _wait_for_server_ready(cls) -> None:
        for _ in range(40):
            try:
                with urllib.request.urlopen(f"{cls.base_url}/health") as response:
                    if response.status == 200:
                        return
            except Exception:
                time.sleep(0.2)

        raise RuntimeError("Backend server did not start in time for tests")

    @classmethod
    def _start_server(cls) -> None:
        cls.server = subprocess.Popen(
            [
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(cls.port),
            ],
            cwd=cls.backend_root,
            env=cls.env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        cls._wait_for_server_ready()

    @classmethod
    def _stop_server(cls) -> None:
        if cls.server.poll() is None:
            cls.server.terminate()
            cls.server.wait(timeout=5)

    @classmethod
    def _restart_server(cls) -> None:
        cls._stop_server()
        cls._start_server()

    @classmethod
    def setUpClass(cls) -> None:
        cls.backend_root = Path(__file__).resolve().parents[1]
        cls.test_db_path = cls.backend_root / "test_persistence_durability.db"
        if cls.test_db_path.exists():
            cls.test_db_path.unlink()

        cls.env = os.environ.copy()
        cls.env["DATABASE_URL"] = f"sqlite:///{cls.test_db_path}"
        subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=cls.backend_root,
            env=cls.env,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        cls.port = cls._get_free_port()
        cls.base_url = f"http://127.0.0.1:{cls.port}"
        cls._start_server()

    @classmethod
    def tearDownClass(cls) -> None:
        cls._stop_server()
        if cls.test_db_path.exists():
            cls.test_db_path.unlink()

    def _create_todo(self, description: str) -> dict[str, object]:
        request = urllib.request.Request(
            f"{self.base_url}/todos",
            data=json.dumps({"description": description}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request) as response:
            self.assertEqual(response.status, 201)
            payload = json.loads(response.read().decode("utf-8"))
        return payload["data"]

    def _patch_todo(self, todo_id: int, is_completed: bool) -> dict[str, object]:
        request = urllib.request.Request(
            f"{self.base_url}/todos/{todo_id}",
            data=json.dumps({"is_completed": is_completed}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PATCH",
        )
        with urllib.request.urlopen(request) as response:
            self.assertEqual(response.status, 200)
            payload = json.loads(response.read().decode("utf-8"))
        return payload["data"]

    def _delete_todo(self, todo_id: int) -> None:
        request = urllib.request.Request(
            f"{self.base_url}/todos/{todo_id}",
            method="DELETE",
        )
        with urllib.request.urlopen(request) as response:
            self.assertEqual(response.status, 204)

    def _list_todos(self) -> list[dict[str, object]]:
        with urllib.request.urlopen(f"{self.base_url}/todos") as response:
            self.assertEqual(response.status, 200)
            payload = json.loads(response.read().decode("utf-8"))
        return payload["data"]

    def test_confirmed_mutations_survive_backend_restart(self) -> None:
        durable_todo = self._create_todo("Durable after restart")
        deleted_todo = self._create_todo("Delete before restart")

        updated = self._patch_todo(int(durable_todo["id"]), True)
        self.assertTrue(updated["is_completed"])

        self._delete_todo(int(deleted_todo["id"]))

        self._restart_server()

        todos_after_restart = self._list_todos()
        ids_after_restart = {int(todo["id"]) for todo in todos_after_restart}

        self.assertIn(int(durable_todo["id"]), ids_after_restart)
        self.assertNotIn(int(deleted_todo["id"]), ids_after_restart)

        durable_after_restart = next(todo for todo in todos_after_restart if int(todo["id"]) == int(durable_todo["id"]))
        self.assertEqual(durable_after_restart["description"], "Durable after restart")
        self.assertIs(durable_after_restart["is_completed"], True)


if __name__ == "__main__":
    unittest.main()
