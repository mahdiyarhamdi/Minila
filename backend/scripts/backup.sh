#!/bin/bash
# Minila Database Backup Script
# Runs daily via cron to backup PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/opt/minila/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="minila_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="/var/log/minila_backup.log"

# Database connection (from environment or defaults)
DB_HOST="${POSTGRES_HOST:-minila_db}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-minila}"
DB_USER="${POSTGRES_USER:-postgres}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting backup..."

# Create backup using pg_dump
if docker exec minila_db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log "Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Delete old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "minila_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR"/minila_backup_*.sql.gz 2>/dev/null | wc -l)
log "Cleanup complete. ${REMAINING_BACKUPS} backups remaining."

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup storage: ${TOTAL_SIZE}"

log "Backup process completed successfully."

