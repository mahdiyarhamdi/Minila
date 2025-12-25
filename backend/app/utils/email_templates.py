"""Email templates - چندزبانه."""
from typing import Dict, Any

# Languages supported: fa (Farsi), en (English), ar (Arabic)

TEMPLATES: Dict[str, Dict[str, Dict[str, str]]] = {
    # ==================== OTP Login ====================
    "otp": {
        "fa": {
            "subject": "کد ورود شما - Minila",
            "body": """سلام {first_name}،

کد ورود شما به سیستم:

{otp_code}

این کد تا ۱۰ دقیقه اعتبار دارد.

اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.

---
تیم Minila"""
        },
        "en": {
            "subject": "Your Login Code - Minila",
            "body": """Hello {first_name},

Your login code is:

{otp_code}

This code is valid for 10 minutes.

If you didn't request this, please ignore this email.

---
Minila Team"""
        },
        "ar": {
            "subject": "رمز الدخول الخاص بك - Minila",
            "body": """مرحباً {first_name}،

رمز الدخول الخاص بك:

{otp_code}

هذا الرمز صالح لمدة ١٠ دقائق.

إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.

---
فريق Minila"""
        }
    },
    
    # ==================== Welcome ====================
    "welcome": {
        "fa": {
            "subject": "خوش آمدید به Minila",
            "body": """سلام {first_name}،

به Minila خوش آمدید!

حساب کاربری شما با موفقیت ایجاد شد. اکنون می‌توانید:
• به کامیونیتی‌ها بپیوندید
• کارت‌های سفر یا بسته ایجاد کنید
• با سایر کاربران ارتباط برقرار کنید

برای شروع، وارد حساب کاربری خود شوید.

---
تیم Minila"""
        },
        "en": {
            "subject": "Welcome to Minila",
            "body": """Hello {first_name},

Welcome to Minila!

Your account has been created successfully. Now you can:
• Join communities
• Create travel or package cards
• Connect with other users

To get started, log in to your account.

---
Minila Team"""
        },
        "ar": {
            "subject": "مرحباً بك في Minila",
            "body": """مرحباً {first_name}،

أهلاً بك في Minila!

تم إنشاء حسابك بنجاح. الآن يمكنك:
• الانضمام إلى المجتمعات
• إنشاء بطاقات السفر أو الطرود
• التواصل مع المستخدمين الآخرين

للبدء، قم بتسجيل الدخول إلى حسابك.

---
فريق Minila"""
        }
    },
    
    # ==================== New Message ====================
    "new_message": {
        "fa": {
            "subject": "شما پیام جدید دارید - Minila",
            "body": """سلام {first_name}،

شما یک پیام جدید از {sender_name} دریافت کردید.

برای مشاهده و پاسخ به پیام، وارد حساب کاربری خود شوید:
{app_url}

---
تیم Minila

برای غیرفعال کردن اعلان‌های ایمیلی، تنظیمات حساب خود را تغییر دهید."""
        },
        "en": {
            "subject": "You have a new message - Minila",
            "body": """Hello {first_name},

You have received a new message from {sender_name}.

To view and reply to the message, log in to your account:
{app_url}

---
Minila Team

To disable email notifications, change your account settings."""
        },
        "ar": {
            "subject": "لديك رسالة جديدة - Minila",
            "body": """مرحباً {first_name}،

لقد تلقيت رسالة جديدة من {sender_name}.

لعرض الرسالة والرد عليها، قم بتسجيل الدخول إلى حسابك:
{app_url}

---
فريق Minila

لإيقاف إشعارات البريد الإلكتروني، قم بتغيير إعدادات حسابك."""
        }
    },
    
    # ==================== Unread Messages Summary ====================
    "unread_summary": {
        "fa": {
            "subject": "شما {count} پیام خوانده نشده دارید - Minila",
            "body": """سلام {first_name}،

شما {count} پیام خوانده نشده دارید.

برای مشاهده پیام‌های خود، وارد حساب کاربری شوید:
{app_url}

---
تیم Minila"""
        },
        "en": {
            "subject": "You have {count} unread messages - Minila",
            "body": """Hello {first_name},

You have {count} unread messages.

To view your messages, log in to your account:
{app_url}

---
Minila Team"""
        },
        "ar": {
            "subject": "لديك {count} رسائل غير مقروءة - Minila",
            "body": """مرحباً {first_name}،

لديك {count} رسائل غير مقروءة.

لعرض رسائلك، قم بتسجيل الدخول إلى حسابك:
{app_url}

---
فريق Minila"""
        }
    },
    
    # ==================== Membership Request ====================
    "membership_request": {
        "fa": {
            "subject": "درخواست عضویت جدید در {community_name}",
            "body": """سلام،

{user_name} درخواست عضویت در کامیونیتی {community_name} را ارسال کرده است.

لطفاً وارد پنل مدیریت شوید تا درخواست را بررسی کنید.

---
تیم Minila"""
        },
        "en": {
            "subject": "New membership request for {community_name}",
            "body": """Hello,

{user_name} has requested to join {community_name}.

Please log in to the admin panel to review the request.

---
Minila Team"""
        },
        "ar": {
            "subject": "طلب عضوية جديد في {community_name}",
            "body": """مرحباً،

أرسل {user_name} طلب انضمام إلى {community_name}.

يرجى تسجيل الدخول إلى لوحة الإدارة لمراجعة الطلب.

---
فريق Minila"""
        }
    },
    
    # ==================== Membership Approved ====================
    "membership_approved": {
        "fa": {
            "subject": "عضویت شما در {community_name} تایید شد",
            "body": """سلام {first_name}،

خبر خوب! درخواست عضویت شما در کامیونیتی {community_name} تایید شد.

اکنون می‌توانید به امکانات این کامیونیتی دسترسی داشته باشید.

---
تیم Minila"""
        },
        "en": {
            "subject": "Your membership in {community_name} has been approved",
            "body": """Hello {first_name},

Great news! Your membership request for {community_name} has been approved.

You can now access all features of this community.

---
Minila Team"""
        },
        "ar": {
            "subject": "تمت الموافقة على عضويتك في {community_name}",
            "body": """مرحباً {first_name}،

خبر سار! تمت الموافقة على طلب عضويتك في {community_name}.

يمكنك الآن الوصول إلى جميع ميزات هذا المجتمع.

---
فريق Minila"""
        }
    },
    
    # ==================== Membership Rejected ====================
    "membership_rejected": {
        "fa": {
            "subject": "درخواست عضویت در {community_name}",
            "body": """سلام {first_name}،

متأسفانه درخواست عضویت شما در کامیونیتی {community_name} رد شد.

می‌توانید در آینده دوباره درخواست دهید یا کامیونیتی‌های دیگر را بررسی کنید.

---
تیم Minila"""
        },
        "en": {
            "subject": "Membership request for {community_name}",
            "body": """Hello {first_name},

Unfortunately, your membership request for {community_name} was declined.

You may reapply in the future or explore other communities.

---
Minila Team"""
        },
        "ar": {
            "subject": "طلب العضوية في {community_name}",
            "body": """مرحباً {first_name}،

للأسف، تم رفض طلب عضويتك في {community_name}.

يمكنك التقديم مرة أخرى في المستقبل أو استكشاف مجتمعات أخرى.

---
فريق Minila"""
        }
    },
    
    # ==================== Role Change ====================
    "role_change": {
        "fa": {
            "subject": "تغییر نقش شما در {community_name}",
            "body": """سلام {first_name}،

نقش شما در کامیونیتی {community_name} به «{new_role}» تغییر یافت.

---
تیم Minila"""
        },
        "en": {
            "subject": "Your role in {community_name} has changed",
            "body": """Hello {first_name},

Your role in {community_name} has been changed to "{new_role}".

---
Minila Team"""
        },
        "ar": {
            "subject": "تم تغيير دورك في {community_name}",
            "body": """مرحباً {first_name}،

تم تغيير دورك في {community_name} إلى "{new_role}".

---
فريق Minila"""
        }
    },
}


def get_template(template_name: str, language: str = "en", **kwargs: Any) -> tuple[str, str]:
    """دریافت قالب ایمیل با متغیرها.
    
    Args:
        template_name: نام قالب
        language: زبان - ignored, always uses English
        **kwargs: متغیرهای قالب
        
    Returns:
        tuple (subject, body)
    """
    # Always use English templates
    template = TEMPLATES.get(template_name, {}).get("en")
    if not template:
        # Fallback to any available language
        template = TEMPLATES.get(template_name, {}).get("fa", {
            "subject": template_name,
            "body": str(kwargs)
        })
    
    subject = template["subject"].format(**kwargs)
    body = template["body"].format(**kwargs)
    
    return subject, body

