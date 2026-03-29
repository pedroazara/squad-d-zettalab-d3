from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db import get_db
from models.schemas import FireReportCreate, FireReportResponse
from services.report_service import create_fire_report, list_fire_reports

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/fire", response_model=FireReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(payload: FireReportCreate, db: Session = Depends(get_db)) -> FireReportResponse:
    report = create_fire_report(db, payload)
    return FireReportResponse.model_validate(report, from_attributes=True)


@router.get("/fire", response_model=list[FireReportResponse])
def get_reports(db: Session = Depends(get_db)) -> list[FireReportResponse]:
    reports = list_fire_reports(db)
    return [FireReportResponse.model_validate(report, from_attributes=True) for report in reports]
