# استفاده از Python 3.12 slim
FROM python:3.12-slim

# تنظیم متغیرهای محیطی
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# نصب dependencies سیستمی
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# تنظیم working directory
WORKDIR /app

# کپی فایل requirements و نصب dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# کپی کد اپلیکیشن
COPY . .

# Port که اپلیکیشن روی آن اجرا می‌شود
EXPOSE 8000

# دستور اجرا
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

