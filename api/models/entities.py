from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(40), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FireReport(Base):
    __tablename__ = "fire_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    reporter_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pendente")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Region(Base):
    __tablename__ = "regions"
    __table_args__ = (UniqueConstraint("estado", "municipio", name="uq_regions_estado_municipio"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    estado: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    municipio: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    bioma_predominante: Mapped[str | None] = mapped_column(String(120), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FireEvent(Base):
    __tablename__ = "fire_events"
    __table_args__ = (UniqueConstraint("region_id", "ano_mes", name="uq_fire_events_region_ano_mes"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)
    ano_mes: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    quantidade_focos: Mapped[int] = mapped_column(Integer, nullable=False)
    risco_fogo_mediano: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    frp_mediano: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClimateMonthly(Base):
    __tablename__ = "climate_monthly"
    __table_args__ = (UniqueConstraint("estacao_codigo", "ano", "mes", name="uq_climate_monthly_station_period"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    estacao_codigo: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)
    temp_max_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    temp_min_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    umidade_min_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    precipitacao_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshots"
    __table_args__ = (UniqueConstraint("region_id", "ano_mes", name="uq_risk_snapshots_region_ano_mes"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)
    ano_mes: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    risco: Mapped[str] = mapped_column(String(20), nullable=False)
    score_amanha: Mapped[float] = mapped_column(Float, nullable=False)
    risco_amanha: Mapped[str] = mapped_column(String(20), nullable=False)
    tendencia: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BurnScarMonthly(Base):
    __tablename__ = "burn_scar_monthly"
    __table_args__ = (UniqueConstraint("estado", "bioma", "ano", "mes", name="uq_burn_scar_monthly_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    estado: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    bioma: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    mes: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    area_queimada_ha: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BurnScarAnnual(Base):
    __tablename__ = "burn_scar_annual"
    __table_args__ = (UniqueConstraint("estado", "bioma", "ano", name="uq_burn_scar_annual_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    estado: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    bioma: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    area_queimada_ha: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PastureRisk(Base):
    __tablename__ = "pasture_risk"
    __table_args__ = (UniqueConstraint("estado", "bioma", "ano", name="uq_pasture_risk_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    estado: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    uf: Mapped[str | None] = mapped_column(String(2), nullable=True)
    bioma: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    area_pastagem_risco_ha: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CrossRiskHistorical(Base):
    __tablename__ = "cross_risk_historical"
    __table_args__ = (UniqueConstraint("estado", "bioma", "ano", name="uq_cross_risk_historical_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    estado: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    uf: Mapped[str | None] = mapped_column(String(2), nullable=True)
    bioma: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    area_queimada_ha: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    area_pastagem_risco_ha: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    perc_pastagem_queimada: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    nivel_risco_historico: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
