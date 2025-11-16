# ADR-20251116: Community Context و Conversations API

**تاریخ**: 2025-11-16  
**وضعیت**: تایید شده  
**نویسنده**: Development Team

---

## مسأله

در نسخه اولیه MVP، APIهای Communities و Messages فاقد برخی قابلیت‌های ضروری برای UX بهتر بودند:

1. **Community Context**: کاربران نمی‌توانستند در GET `/api/v1/communities/{id}` بفهمند که آیا عضو آن کامیونیتی هستند یا نه و چه نقشی دارند
2. **Conversations List**: کاربران راهی برای مشاهده لیست مکالمات خود نداشتند
3. **User Join Requests**: کاربران نمی‌توانستند وضعیت درخواست‌های عضویت خود را مشاهده کنند

---

## گزینه‌ها

### Community Context:
- **گزینه 1**: ایجاد endpoint جداگانه `/api/v1/communities/{id}/my-membership`
- **گزینه 2**: اضافه کردن فیلدهای `is_member` و `my_role` به `CommunityOut` (انتخاب شده)
- **گزینه 3**: ایجاد endpoint جداگانه برای کاربران لاگین کرده

### Conversations:
- **گزینه 1**: فقط استفاده از `/inbox` و `/sent` موجود
- **گزینه 2**: اضافه کردن `/conversations` که لیست مکالمات با آخرین پیام را برمی‌گرداند (انتخاب شده)
- **گزینه 3**: Real-time با WebSocket

---

## تصمیم

### تغییرات اعمال شده:

#### 1. Community Context API
- **Endpoint**: `GET /api/v1/communities/{id}`
- **تغییر**: اضافه شدن فیلدهای اختیاری به `CommunityOut`:
  - `is_member: Optional[bool]` - آیا کاربر فعلی عضو است؟
  - `my_role: Optional[str]` - نقش کاربر (owner, manager, moderator, member)
- **رفتار**:
  - اگر کاربر لاگین نباشد: `null`
  - اگر کاربر owner باشد: `is_member=True, my_role="owner"`
  - اگر کاربر عضو فعال باشد: `is_member=True, my_role=<role_name>`
  - اگر کاربر عضو نباشد: `is_member=False, my_role=null`

#### 2. Conversations API
- **Endpoint جدید**: `GET /api/v1/messages/conversations`
- **Response**: لیست مکالمات با ساختار:
  ```json
  {
    "items": [
      {
        "user": {"id": 2, "first_name": "...", "last_name": "...", "email": "..."},
        "last_message": {"body": "...", "created_at": "..."},
        "unread_count": 0
      }
    ],
    "total": 5
  }
  ```
- **Endpoint جدید**: `GET /api/v1/messages/{other_user_id}`
- **Response**: PaginatedResponse از پیام‌های رد و بدل شده با یک کاربر

#### 3. User Join Requests API
- **Endpoint جدید**: `GET /api/v1/users/me/join-requests`
- **Response**: لیست تمام درخواست‌های عضویت کاربر (pending, approved, rejected)
- **فیلد جدید**: `status` (computed field از روی `is_approved`)

---

## چرا

### مزایا:
1. **بهبود UX**: کاربر در یک request متوجه می‌شود که عضو کامیونیتی است یا خیر
2. **کاهش درخواست‌ها**: نیازی به endpoint جداگانه برای چک کردن عضویت نیست
3. **Backward Compatible**: فیلدها optional هستند و APIهای قبلی کماکان کار می‌کنند
4. **مدیریت مکالمات**: کاربران می‌توانند به راحتی لیست مکالمات خود را مشاهده کنند
5. **شفافیت درخواست‌ها**: کاربران می‌توانند وضعیت درخواست‌های خود را پیگیری کنند

### معایب:
1. **پیچیدگی Query**: نیاز به join اضافی برای محاسبه `my_role`
2. **Response Size**: اندکی بزرگتر شدن response (قابل قبول)

---

## تأثیر بر آینده

### تغییرات Backend:
- `CommunityOut` schema: اضافه شدن 2 فیلد اختیاری
- `community_service.get_community()`: محاسبه `is_member` و `my_role`
- `message_repo`: اضافه شدن `get_conversations()`
- `membership_repo`: اضافه شدن `get_user_requests()`

### تغییرات Frontend:
- صفحات community می‌توانند دکمه "Join" یا "Member Badge" را conditional نمایش دهند
- صفحه جدید Conversations برای مدیریت مکالمات
- صفحه جدید My Requests برای پیگیری درخواست‌ها

### تغییرات Tests:
- تست‌های جدید برای `TestGetMyJoinRequests`
- تست‌های جدید برای `TestGetConversations`
- آپدیت تست‌های موجود `TestGetCommunity` برای بررسی فیلدهای جدید

### Migration:
- نیاز به migration جدید: **خیر** (فقط تغییرات API)
- Backward compatible: **بله**

---

## مستندسازی

- ✅ README.md آپدیت شد
- ✅ ARCHITECTURE.md آپدیت شد
- ✅ OpenAPI docs خودکار توسط FastAPI
- ✅ تست‌های جامع نوشته شد

---

## نتیجه‌گیری

این تغییرات UX را به‌طور قابل توجهی بهبود می‌بخشند بدون اینکه breaking change ایجاد کنند. کاربران اکنون می‌توانند:
- وضعیت عضویت خود در کامیونیتی‌ها را فوراً ببینند
- مکالمات خود را مدیریت کنند
- درخواست‌های عضویت خود را پیگیری کنند

