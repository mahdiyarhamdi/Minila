"""Reports API router for user feedback and reports."""
from fastapi import APIRouter, status

from ..deps import DBSession, CurrentUser
from ...schemas.report import ReportCreate, ReportOut
from ...models.report import Report
from ...utils.logger import logger


router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.post(
    "",
    response_model=ReportOut,
    status_code=status.HTTP_201_CREATED,
    summary="ارسال گزارش",
    description="ارسال گزارش یا بازخورد توسط کاربر"
)
async def create_report(
    data: ReportCreate,
    db: DBSession,
    user: CurrentUser,
) -> ReportOut:
    """ایجاد گزارش جدید.
    
    کاربر می‌تواند:
    - گزارش عمومی (فقط متن) ارسال کند
    - کاربر دیگری را گزارش کند (با reported_id)
    - کارتی را گزارش کند (با card_id)
    """
    logger.info(f"User {user['user_id']} creating report")
    
    # ایجاد گزارش
    report = Report(
        reporter_id=user["user_id"],
        reported_id=data.reported_id,
        card_id=data.card_id,
        body=data.body,
    )
    
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    # بارگذاری روابط
    await db.refresh(report, ["reporter", "reported"])
    
    logger.info(f"Report {report.id} created by user {user['user_id']}")
    
    return report

