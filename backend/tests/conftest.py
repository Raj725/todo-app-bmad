from collections.abc import Generator

import pytest

from app.db import session as db_session


@pytest.fixture(autouse=True)
def dispose_sqlalchemy_engine_after_each_test() -> Generator[None, None, None]:
    # Keep tests deterministic by closing pooled sqlite connections after each test.
    yield
    db_session.engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def dispose_sqlalchemy_engine_at_session_end() -> Generator[None, None, None]:
    # Final safety net for any pooled connection that survives function teardown.
    yield
    db_session.engine.dispose()
