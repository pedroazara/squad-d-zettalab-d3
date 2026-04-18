from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from models.entities import FireReport
from models.schemas import FireReportCreate, FireReportStatusType


def create_fire_report(db: Session, payload: FireReportCreate) -> FireReport:
    report = FireReport(
        location=payload.location.strip(),
        description=payload.description.strip(),
        phone=payload.phone.strip(),
        reporter_name=payload.reporter_name.strip() if payload.reporter_name else None,
        status="pendente",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def list_fire_reports(db: Session, limit: int = 100, offset: int = 0) -> list[FireReport]:
    statement = select(FireReport).order_by(desc(FireReport.created_at), desc(FireReport.id)).limit(limit).offset(offset)
    return list(db.scalars(statement).all())


def get_fire_report(db: Session, report_id: int) -> FireReport | None:
    return db.get(FireReport, report_id)


def update_fire_report_status(db: Session, report_id: int, status: FireReportStatusType) -> FireReport | None:
    report = db.get(FireReport, report_id)
    if not report:
        return None

    report.status = status
    db.commit()
    db.refresh(report)
    return report
