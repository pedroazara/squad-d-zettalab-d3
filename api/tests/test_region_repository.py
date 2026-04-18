from types import SimpleNamespace

from services.ingestion.file_loaders import FocoRecord
from services.repositories import region_repository


class FakeInsertStatement:
    def __init__(self, model):
        self.model = model
        self.payload = None
        self.conflict_action = None

    def values(self, **kwargs):
        self.payload = kwargs
        return self

    def on_conflict_do_nothing(self, **kwargs):
        self.conflict_action = ("nothing", kwargs)
        return self

    def on_conflict_do_update(self, **kwargs):
        self.conflict_action = ("update", kwargs)
        return self

    def returning(self, *columns):
        return self


class FakeResult:
    def __init__(self, scalar_one_or_none_value=None):
        self.scalar_one_or_none_value = scalar_one_or_none_value

    def scalar_one_or_none(self):
        return self.scalar_one_or_none_value


class FakeSession:
    def __init__(self, scalar_results, insert_return_value=None):
        self.scalar_results = list(scalar_results)
        self.insert_return_value = insert_return_value
        self.executed = []
        self.scalars_requested = []

    def execute(self, statement):
        self.executed.append(statement)
        if isinstance(statement, FakeInsertStatement):
            return FakeResult(self.insert_return_value)
        return FakeResult()

    def scalar(self, statement):
        self.scalars_requested.append(statement)
        return self.scalar_results.pop(0)


class InsertFactory:
    def __call__(self, model):
        return FakeInsertStatement(model)


def test_build_region_coordinates():
    record = FocoRecord("Minas Gerais", "Lavras", 2024, 8, "2024-08", 12, 0.4, 18.0, "Cerrado")
    assert region_repository.build_region_coordinates(record)[0] < 0


def test_upsert_region_insert_and_update(monkeypatch):
    inserted_region = SimpleNamespace(id=3, bioma_predominante="Cerrado", latitude=-18.1, longitude=-44.3)
    session = FakeSession([inserted_region], insert_return_value=3)
    monkeypatch.setattr(region_repository, "pg_insert", InsertFactory())

    record = FocoRecord("Minas Gerais", "Lavras", 2024, 8, "2024-08", 12, 0.4, 18.0, "Cerrado")
    result = region_repository.upsert_region(session, record)

    assert result is inserted_region
    assert len(session.executed) == 1


def test_upsert_region_fallback_updates_existing(monkeypatch):
    existing_region = SimpleNamespace(id=4, bioma_predominante=None, latitude=None, longitude=None)
    session = FakeSession([existing_region], insert_return_value=None)
    monkeypatch.setattr(region_repository, "pg_insert", InsertFactory())

    record = FocoRecord("Minas Gerais", "Lavras", 2024, 8, "2024-08", 12, 0.4, 18.0, "Cerrado")
    result = region_repository.upsert_region(session, record)

    assert result is existing_region
    assert existing_region.bioma_predominante == "Cerrado"


def test_upsert_fire_event_and_risk_snapshot(monkeypatch):
    fire_event = SimpleNamespace(id=7)
    snapshot = SimpleNamespace(id=9)
    session = FakeSession([fire_event, snapshot], insert_return_value=7)
    monkeypatch.setattr(region_repository, "pg_insert", InsertFactory())

    record = FocoRecord("Minas Gerais", "Lavras", 2024, 8, "2024-08", 12, 0.4, 18.0, "Cerrado")
    fire_result = region_repository.upsert_fire_event(session, 1, record)

    session.insert_return_value = 9
    snapshot_result = region_repository.upsert_risk_snapshot(session, 1, record, 52.0, "medio", 55.0, "medio", "estavel")

    assert fire_result is fire_event
    assert snapshot_result is snapshot
    assert len(session.executed) == 2
