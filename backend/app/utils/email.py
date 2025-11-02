"""Email utilities برای ارسال ایمیل با SMTP."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from ..core.config import get_settings
from .logger import logger

settings = get_settings()


def send_email(
    to_email: str,
    subject: str,
    body: str,
    from_email: Optional[str] = None
) -> bool:
    """ارسال ایمیل با SMTP.
    
    Args:
        to_email: آدرس گیرنده
        subject: موضوع ایمیل
        body: متن ایمیل (plain text)
        from_email: آدرس فرستنده (اختیاری)
        
    Returns:
        True در صورت موفقیت، False در غیر این صورت
    """
    try:
        from_addr = from_email or settings.EMAIL_FROM
        
        # ساخت پیام
        msg = MIMEMultipart()
        msg['From'] = from_addr
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # اتصال به SMTP server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            # برای MailHog نیازی به authentication نیست
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def send_otp_email(email: str, otp_code: str) -> bool:
    """ارسال کد OTP به ایمیل کاربر.
    
    Args:
        email: آدرس ایمیل کاربر
        otp_code: کد OTP
        
    Returns:
        True در صورت موفقیت
    """
    subject = "کد ورود شما - Minila"
    body = f"""سلام،

کد ورود شما به سیستم:

{otp_code}

این کد تا 10 دقیقه اعتبار دارد.

اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.

---
تیم Minila
"""
    return send_email(email, subject, body)


def send_message_notification(email: str, sender_name: str, card_title: str) -> bool:
    """اطلاع‌رسانی دریافت پیام جدید.
    
    Args:
        email: آدرس ایمیل گیرنده
        sender_name: نام فرستنده پیام
        card_title: عنوان کارت
        
    Returns:
        True در صورت موفقیت
    """
    subject = "پیام جدید دریافت کردید - Minila"
    body = f"""سلام،

شما یک پیام جدید از {sender_name} دریافت کردید.

موضوع: {card_title}

برای مشاهده و پاسخ به پیام، وارد حساب کاربری خود شوید.

---
تیم Minila
"""
    return send_email(email, subject, body)


def send_membership_request_notification(
    email: str,
    user_name: str,
    community_name: str
) -> bool:
    """اطلاع‌رسانی درخواست عضویت جدید به مدیران کامیونیتی.
    
    Args:
        email: آدرس ایمیل مدیر
        user_name: نام درخواست‌دهنده
        community_name: نام کامیونیتی
        
    Returns:
        True در صورت موفقیت
    """
    subject = f"درخواست عضویت جدید در {community_name}"
    body = f"""سلام،

{user_name} درخواست عضویت در کامیونیتی {community_name} را ارسال کرده است.

لطفاً وارد پنل مدیریت شوید تا درخواست را بررسی کنید.

---
تیم Minila
"""
    return send_email(email, subject, body)


def send_membership_result(
    email: str,
    community_name: str,
    approved: bool
) -> bool:
    """اطلاع‌رسانی نتیجه درخواست عضویت به کاربر.
    
    Args:
        email: آدرس ایمیل کاربر
        community_name: نام کامیونیتی
        approved: آیا درخواست تایید شده؟
        
    Returns:
        True در صورت موفقیت
    """
    if approved:
        subject = f"عضویت شما در {community_name} تایید شد"
        body = f"""سلام،

خبر خوب! درخواست عضویت شما در کامیونیتی {community_name} تایید شد.

اکنون می‌توانید به امکانات این کامیونیتی دسترسی داشته باشید.

---
تیم Minila
"""
    else:
        subject = f"درخواست عضویت در {community_name}"
        body = f"""سلام،

متأسفانه درخواست عضویت شما در کامیونیتی {community_name} رد شد.

می‌توانید در آینده دوباره درخواست دهید یا کامیونیتی‌های دیگر را بررسی کنید.

---
تیم Minila
"""
    return send_email(email, subject, body)


def send_welcome_email(email: str, first_name: str) -> bool:
    """ارسال ایمیل خوش‌آمدگویی پس از ثبت‌نام.
    
    Args:
        email: آدرس ایمیل کاربر
        first_name: نام کاربر
        
    Returns:
        True در صورت موفقیت
    """
    subject = "خوش آمدید به Minila"
    body = f"""سلام {first_name}،

به Minila خوش آمدید!

حساب کاربری شما با موفقیت ایجاد شد. اکنون می‌توانید:
- به کامیونیتی‌ها بپیوندید
- کارت‌های سفر یا بسته ایجاد کنید
- با سایر کاربران ارتباط برقرار کنید

برای شروع، وارد حساب کاربری خود شوید.

---
تیم Minila
"""
    return send_email(email, subject, body)

