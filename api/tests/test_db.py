from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

import db as db_module


def test_get_db_calls_ensure_and_closes_session(monkeypatch):
    calls = {"ensure": 0, "closed": 0}

    class DummySession:
        def close(self):
            calls["closed"] += 1

    monkeypatch.setattr(db_module, "ensure_users_active_column", lambda: calls.__setitem__("ensure", calls["ensure"] + 1))
    monkeypatch.setattr(db_module, "SessionLocal", lambda: DummySession())

    gen = db_module.get_db()
    _ = next(gen)
    try:
        next(gen)
    except StopIteration:
        pass

    assert calls["ensure"] == 1
    assert calls["closed"] == 1


def test_ensure_users_active_column_sqlite_adds_column(monkeypatch, tmp_path):
    test_engine = create_engine(f"sqlite:///{tmp_path / 'db_test.sqlite'}", connect_args={"check_same_thread": False})

    with test_engine.begin() as conn:
        conn.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT)"))
        conn.execute(text("INSERT INTO users (id, email) VALUES (1, 'a@example.com')"))

    monkeypatch.setattr(db_module, "engine", test_engine)

    db_module.ensure_users_active_column()

    inspector = inspect(test_engine)
    columns = {c["name"] for c in inspector.get_columns("users")}
    assert "active" in columns

    SessionLocal = sessionmaker(bind=test_engine)
    session = SessionLocal()
    try:
        active_value = session.execute(text("SELECT active FROM users WHERE id = 1")).scalar_one()
        assert active_value in (1, True)
    finally:
        session.close()


def test_ensure_users_active_column_no_users_table(monkeypatch, tmp_path):
    test_engine = create_engine(f"sqlite:///{tmp_path / 'db_empty.sqlite'}", connect_args={"check_same_thread": False})
    monkeypatch.setattr(db_module, "engine", test_engine)

    # Should not raise even when users table does not exist.
    db_module.ensure_users_active_column()
