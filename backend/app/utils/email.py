"""Email utilities با پشتیبانی SendGrid و SMTP."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from ..core.config import get_settings
from .logger import logger
from .email_templates import get_template

settings = get_settings()


def _send_via_smtp(to_email: str, subject: str, body: str) -> bool:
    """ارسال ایمیل با SMTP (برای dev/MailHog)."""
    try:
        from_addr = settings.EMAIL_FROM
        
        msg = MIMEMultipart()
        msg['From'] = from_addr
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
        
        logger.info(f"Email sent via SMTP to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"SMTP email failed to {to_email}: {str(e)}")
        return False


def _send_via_resend(to_email: str, subject: str, body: str) -> bool:
    """ارسال ایمیل با Resend."""
    try:
        import resend
        
        resend.api_key = settings.RESEND_API_KEY
        
        response = resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": subject,
            "text": body
        })
        
        if response and response.get("id"):
            logger.info(f"Email sent via Resend to {to_email}, id: {response['id']}")
            return True
        else:
            logger.error(f"Resend failed: {response}")
            return False
            
    except Exception as e:
        logger.error(f"Resend email failed to {to_email}: {str(e)}")
        return False


def send_email(to_email: str, subject: str, body: str) -> bool:
    """ارسال ایمیل با provider تنظیم‌شده.
    
    Args:
        to_email: آدرس گیرنده
        subject: موضوع ایمیل
        body: متن ایمیل
        
    Returns:
        True در صورت موفقیت
    """
    if settings.EMAIL_PROVIDER == "resend" and settings.RESEND_API_KEY:
        return _send_via_resend(to_email, subject, body)
    else:
        return _send_via_smtp(to_email, subject, body)


# ==================== Email Functions ====================

def send_otp_email(email: str, otp_code: str, language: str = "fa") -> bool:
    """ارسال کد OTP به ایمیل کاربر."""
    subject, body = get_template("otp", language, otp_code=otp_code)
    return send_email(email, subject, body)


def send_welcome_email(email: str, first_name: str, language: str = "fa") -> bool:
    """ارسال ایمیل خوش‌آمدگویی."""
    subject, body = get_template("welcome", language, first_name=first_name or "کاربر")
    return send_email(email, subject, body)


def send_message_notification(
    email: str,
    sender_name: str,
    language: str = "fa",
    app_url: str = "https://minila.app"
) -> bool:
    """اطلاع‌رسانی دریافت پیام جدید."""
    subject, body = get_template(
        "new_message", 
        language, 
        sender_name=sender_name,
        app_url=app_url
    )
    return send_email(email, subject, body)


def send_unread_summary(
    email: str,
    count: int,
    language: str = "fa",
    app_url: str = "https://minila.app"
) -> bool:
    """ارسال خلاصه پیام‌های خوانده نشده."""
    subject, body = get_template(
        "unread_summary",
        language,
        count=count,
        app_url=app_url
    )
    return send_email(email, subject, body)


def send_membership_request_notification(
    email: str,
    user_name: str,
    community_name: str,
    language: str = "fa"
) -> bool:
    """اطلاع‌رسانی درخواست عضویت جدید."""
    subject, body = get_template(
        "membership_request",
        language,
        user_name=user_name,
        community_name=community_name
    )
    return send_email(email, subject, body)


def send_membership_result(
    email: str,
    community_name: str,
    approved: bool,
    language: str = "fa"
) -> bool:
    """اطلاع‌رسانی نتیجه درخواست عضویت."""
    template_name = "membership_approved" if approved else "membership_rejected"
    subject, body = get_template(
        template_name,
        language,
        community_name=community_name
    )
    return send_email(email, subject, body)


def send_role_change_notification(
    email: str,
    community_name: str,
    new_role: str,
    language: str = "en"
) -> bool:
    """اطلاع‌رسانی تغییر نقش کاربر."""
    subject, body = get_template(
        "role_change",
        language,
        community_name=community_name,
        new_role=new_role
    )
    return send_email(email, subject, body)
