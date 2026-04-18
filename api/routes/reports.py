from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from models.entities import User
from models.schemas import FireReportCreate, FireReportResponse, FireReportStatusUpdate
from services.authz_service import require_permission
from services.report_service import create_fire_report, list_fire_reports, update_fire_report_status

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/fire", response_model=FireReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(payload: FireReportCreate, db: Session = Depends(get_db)) -> FireReportResponse:
    report = create_fire_report(db, payload)
    return FireReportResponse.model_validate(report, from_attributes=True)


@router.get("/fire", response_model=list[FireReportResponse])
def get_reports(db: Session = Depends(get_db)) -> list[FireReportResponse]:
    reports = list_fire_reports(db)
    return [FireReportResponse.model_validate(report, from_attributes=True) for report in reports]


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
