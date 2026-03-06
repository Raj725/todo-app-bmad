import os

DEFAULT_CORS_ALLOW_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./todo.db")
        self.cors_allow_origins = self._parse_cors_allow_origins(
            os.getenv("CORS_ALLOW_ORIGINS", ",".join(DEFAULT_CORS_ALLOW_ORIGINS))
        )

    @staticmethod
    def _parse_cors_allow_origins(raw_value: str) -> list[str]:
        parsed = [origin.strip() for origin in raw_value.split(",") if origin.strip()]
        return parsed or DEFAULT_CORS_ALLOW_ORIGINS.copy()


settings = Settings()
