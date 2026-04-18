from services import seed_service


class DummyDB:
    def __init__(self, existing_user_id=None):
        self.existing_user_id = existing_user_id

    def scalar(self, _query):
        return self.existing_user_id


def test_run_all_dataset_syncs_calls_all(monkeypatch):
    called = []

    monkeypatch.setattr(seed_service, "sync_burn_scar_dataset", lambda db: called.append("burn"))
    monkeypatch.setattr(seed_service, "sync_pasture_risk_dataset", lambda db: called.append("pasture"))
    monkeypatch.setattr(seed_service, "sync_cross_risk_dataset", lambda db: called.append("cross"))
    monkeypatch.setattr(seed_service, "sync_fire_points_dataset", lambda db: called.append("points"))
    monkeypatch.setattr(seed_service, "sync_climate_dataset", lambda db: called.append("climate"))
    monkeypatch.setattr(seed_service, "sync_foco_dataset", lambda db: called.append("foco"))
    monkeypatch.setattr(seed_service, "sync_state_risk_dataset", lambda db: called.append("state_risk"))

    seed_service._run_all_dataset_syncs(DummyDB())

    assert called == ["burn", "pasture", "cross", "points", "climate", "foco", "state_risk"]


def test_ensure_seed_data_when_user_exists(monkeypatch):
    created = []
    sync_called = []

    monkeypatch.setattr(seed_service, "create_user", lambda db, payload: created.append(payload.email))
    monkeypatch.setattr(seed_service, "_run_all_dataset_syncs", lambda db: sync_called.append(True))

    seed_service.ensure_seed_data(DummyDB(existing_user_id=1))

    assert created == []
    assert sync_called == [True]


def test_ensure_seed_data_creates_default_users(monkeypatch):
    created = []
    sync_called = []

    def fake_create_user(_db, payload):
        created.append((payload.name, payload.email, payload.role))

    monkeypatch.setattr(seed_service, "create_user", fake_create_user)
    monkeypatch.setattr(seed_service, "_run_all_dataset_syncs", lambda db: sync_called.append(True))

    seed_service.ensure_seed_data(DummyDB(existing_user_id=None))

    assert len(created) == 2
    assert ("Ana Ribeiro", "comando@guarawatch.org", "coordenacao") in created
    assert ("Lucas Martins", "brigada@guarawatch.org", "brigadista") in created
    assert sync_called == [True]
