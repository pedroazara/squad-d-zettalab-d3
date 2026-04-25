from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db import get_db
from models.entities import User
from models.schemas import FireReportCreate, FireReportResponse, FireReportStatusUpdate
from services.authz_service import get_current_user, require_permission
from services.report_service import create_fire_report, get_fire_report, list_fire_reports, update_fire_report_status

router = APIRouter(tags=["reports"], dependencies=[Depends(get_current_user)])


@router.post("/fire", response_model=FireReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(payload: FireReportCreate, db: Session = Depends(get_db)) -> FireReportResponse:
    report = create_fire_report(db, payload)
    return FireReportResponse.model_validate(report, from_attributes=True)


@router.get("/fire", response_model=list[FireReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[FireReportResponse]:
    reports = list_fire_reports(db, limit, offset)
    return [FireReportResponse.model_validate(report, from_attributes=True) for report in reports]


@router.get("/fire/{report_id}", response_model=FireReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)) -> FireReportResponse:
    report = get_fire_report(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte nao encontrado")

    return FireReportResponse.model_validate(report, from_attributes=True)


@router.patch("/fire/{report_id}/status", response_model=FireReportResponse)
def update_report_status(
    report_id: int,
    payload: FireReportStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("reports.review")),
) -> FireReportResponse:
    report = update_fire_report_status(db, report_id, payload.status)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte nao encontrado")

    return FireReportResponse.model_validate(report, from_attributes=True)
