from __future__ import annotations

import argparse
import time
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import func, inspect, select

import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from db import SessionLocal, engine
from main import app
from models.entities import FireEvent, Region, RiskSnapshot, User
from services.seed_service import ensure_seed_data


REQUIRED_TABLES = {
    "users",
    "fire_reports",
    "regions",
    "fire_events",
    "risk_snapshots",
    "climate_monthly",
}


def _log(message: str) -> None:
    print(f"[predeploy] {message}")


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def check_database_tables() -> None:
    _log("Validating database connectivity and required tables")
    existing = set(inspect(engine).get_table_names())
    missing = sorted(REQUIRED_TABLES - existing)
    _require(not missing, f"Missing tables: {', '.join(missing)}")


def run_seed(seed_runs: int) -> None:
    _log(f"Running seed routine ({seed_runs} run(s))")
    with SessionLocal() as db:
        for index in range(seed_runs):
            ensure_seed_data(db)
            _log(f"Seed run {index + 1}/{seed_runs} completed")


def validate_core_counts() -> None:
    _log("Checking core records after seed")
    with SessionLocal() as db:
        user_count = db.scalar(select(func.count()).select_from(User)) or 0
        region_count = db.scalar(select(func.count()).select_from(Region)) or 0
        fire_count = db.scalar(select(func.count()).select_from(FireEvent)) or 0
        risk_count = db.scalar(select(func.count()).select_from(RiskSnapshot)) or 0

    _require(user_count > 0, "No users found after seed")
    _require(region_count > 0, "No regions found after seed")
    _require(fire_count > 0, "No fire events found after seed")
    _require(risk_count > 0, "No risk snapshots found after seed")
    _log(
        "Counts ok: "
        f"users={user_count}, regions={region_count}, fire_events={fire_count}, risk_snapshots={risk_count}"
    )


def expect_status(status_code: int, expected: set[int], context: str) -> None:
    _require(status_code in expected, f"{context} returned {status_code}, expected {sorted(expected)}")


def smoke_test_api() -> None:
    _log("Running API smoke tests")
    timestamp = int(time.time())
    test_email = f"predeploy_{timestamp}@cerrado.local"

    with TestClient(app) as client:
        health = client.get("/health")
        expect_status(health.status_code, {200}, "GET /health")

        regions = client.get("/regions")
        expect_status(regions.status_code, {200}, "GET /regions")
        _require(isinstance(regions.json(), list), "GET /regions did not return a list")

        risk = client.get("/risk", params={"limit": 3, "offset": 0})
        expect_status(risk.status_code, {200}, "GET /risk")
        _require(isinstance(risk.json(), list), "GET /risk did not return a list")

        fires = client.get("/fires", params={"limit": 3, "offset": 0})
        expect_status(fires.status_code, {200}, "GET /fires")
        _require(isinstance(fires.json(), list), "GET /fires did not return a list")

        points = client.get("/fires/points", params={"limit": 1, "offset": 0})
        expect_status(points.status_code, {200}, "GET /fires/points")
        _require(isinstance(points.json(), list), "GET /fires/points did not return a list")

        register_payload = {
            "name": "Predeploy User",
            "email": test_email,
            "organization": "Predeploy QA",
            "role": "fazendeiro",
            "password": "predeploy123",
        }
        register = client.post("/auth/register", json=register_payload)
        expect_status(register.status_code, {201, 409}, "POST /auth/register")

        login = client.post("/auth/login", json={"email": test_email, "password": "predeploy123"})
        expect_status(login.status_code, {200}, "POST /auth/login")

        report_payload = {
            "location": "Area de teste predeploy",
            "description": "Registro automatico para smoke test predeploy",
            "phone": "61999990000",
            "reporter_name": "Predeploy Bot",
        }
        create_report = client.post("/reports/fire", json=report_payload)
        expect_status(create_report.status_code, {201}, "POST /reports/fire")

        list_reports = client.get("/reports/fire")
        expect_status(list_reports.status_code, {200}, "GET /reports/fire")
        _require(isinstance(list_reports.json(), list), "GET /reports/fire did not return a list")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run pre-deploy checks for API and database")
    parser.add_argument(
        "--skip-seed",
        action="store_true",
        help="Skip seed execution and only validate existing data",
    )
    parser.add_argument(
        "--seed-runs",
        type=int,
        default=1,
        help="How many times to execute seed routine (use 2 to validate idempotency)",
    )
    args = parser.parse_args()

    try:
        _require(args.seed_runs >= 1, "--seed-runs must be >= 1")
        check_database_tables()
        if not args.skip_seed:
            run_seed(args.seed_runs)
        validate_core_counts()
        smoke_test_api()
        _log("Pre-deploy check passed")
        return 0
    except Exception as exc:
        _log(f"Pre-deploy check failed: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
