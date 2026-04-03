from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

RoleType = Literal["brigadista", "fazendeiro", "coordenacao", "administrador"]
RiskLevel = Literal["baixo", "medio", "alto"]


class UserCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    organization: str = Field(min_length=3, max_length=255)
    role: RoleType
    password: str = Field(min_length=6, max_length=128)

    @field_validator("name", "organization")
    @classmethod
    def validate_non_blank_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Campo obrigatorio")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_non_blank_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Senha invalida")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_non_blank_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Senha invalida")
        return value


class UserPublic(BaseModel):
    """Representa o usuario retornado pelas rotas publicas de autenticacao."""

    id: int
    name: str
    email: EmailStr
    organization: str
    role: RoleType


class AuthResponse(BaseModel):
    message: str
    token: str
    user: UserPublic


class RegionSnapshot(BaseModel):
    id: int
    nome: str
    latitude: float
    longitude: float
    temperatura: float
    umidade: float
    vento: float
    precipitacao: float
    focos_calor: int


class RiskResponse(BaseModel):
    regiao_id: int
    regiao_nome: str
    score: float
    risco: RiskLevel


class RiskForecastResponse(RiskResponse):
    score_amanha: float
    risco_amanha: RiskLevel
    tendencia: Literal["crescente", "estavel", "decrescente"]


class FireReportCreate(BaseModel):
    location: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=10, max_length=2000)
    phone: str = Field(min_length=8, max_length=40)
    reporter_name: str | None = Field(default=None, max_length=120)


class FireReportResponse(BaseModel):
    id: int
    location: str
    description: str
    phone: str
    reporter_name: str | None
    status: str
    created_at: datetime


class ApiMessage(BaseModel):
    message: str
