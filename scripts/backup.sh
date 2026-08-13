#!/usr/bin/env bash
set -euo pipefail

# Backup script for SATU production
# Execute: ./backup.sh [staging|production]
# Environment variables required:
#   - DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
#   - BACKUP_DIR (default: /var/backups/satu)
#   - FILESYSTEM_DISK_PATH (for file backup)

BACKUP_DIR="${BACKUP_DIR:-/var/backups/satu}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_BACKUP="${BACKUP_DIR}/db-${TIMESTAMP}.sql.gz"
FILE_BACKUP="${BACKUP_DIR}/storage-${TIMESTAMP}.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Validate required environment
validate_env() {
    local missing=0
    for var in DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD; do
        if [ -z "${!var:-}" ]; then
            log_error "Missing required environment variable: ${var}"
            missing=1
        fi
    done
    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# Create backup directory
ensure_backup_dir() {
    if [ ! -d "${BACKUP_DIR}" ]; then
        log_info "Creating backup directory: ${BACKUP_DIR}"
        mkdir -p "${BACKUP_DIR}"
    fi
}

# Backup database
backup_database() {
    log_info "Starting database backup..."
    
    if ! mysqldump \
        --single-transaction \
        --quick \
        --routines \
        --triggers \
        --events \
        --compress \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --user="${DB_USERNAME}" \
        --password="${DB_PASSWORD}" \
        "${DB_DATABASE}" \
        2>"${BACKUP_DIR}/db-${TIMESTAMP}.log" \
        | gzip > "${DB_BACKUP}"; then
        log_error "Database backup failed"
        cat "${BACKUP_DIR}/db-${TIMESTAMP}.log"
        exit 1
    fi
    
    # Verify backup integrity
    if ! gunzip -t "${DB_BACKUP}" 2>/dev/null; then
        log_error "Backup file verification failed: ${DB_BACKUP}"
        exit 1
    fi
    
    # Generate checksum
    sha256sum "${DB_BACKUP}" > "${DB_BACKUP}.sha256"
    
    log_info "Database backup completed: ${DB_BACKUP}"
}

# Backup storage
backup_storage() {
    log_info "Starting storage backup..."
    
    local storage_path="${FILESYSTEM_DISK_PATH:-storage/app/private}"
    
    if [ ! -d "${storage_path}" ]; then
        log_warn "Storage path does not exist: ${storage_path}"
        touch "${FILE_BACKUP}"
        return 0
    fi
    
    if ! tar -czf "${FILE_BACKUP}" -C "$(dirname "${storage_path}")" "$(basename "${storage_path}")" 2>/dev/null; then
        log_error "Storage backup failed"
        exit 1
    fi
    
    # Generate checksum
    sha256sum "${FILE_BACKUP}" > "${FILE_BACKUP}.sha256"
    
    log_info "Storage backup completed: ${FILE_BACKUP}"
}

# Cleanup old backups
cleanup_old_backups() {
    local retention_days="${RETENTION_DAYS:-30}"
    log_info "Cleaning up backups older than ${retention_days} days..."
    
    find "${BACKUP_DIR}" -type f \( -name "db-*.sql.gz" -o -name "storage-*.tar.gz" \) -mtime +${retention_days} -delete 2>/dev/null || true
    find "${BACKUP_DIR}" -type f \( -name "db-*.sql.gz.sha256" -o -name "storage-*.tar.gz.sha256" \) -mtime +${retention_days} -delete 2>/dev/null || true
}

# Test restore (basic verification)
test_restore() {
    local backup_file="$1"
    log_info "Testing restore integrity for: ${backup_file}"
    
    if [ ! -f "${backup_file}" ]; then
        log_error "Backup file not found: ${backup_file}"
        return 1
    fi
    
    # Verify gzip integrity
    if ! gunzip -t "${backup_file}" 2>/dev/null; then
        log_error "Backup file corrupted: ${backup_file}"
        return 1
    fi
    
    # Verify checksum
    if [ -f "${backup_file}.sha256" ]; then
        if ! sha256sum -c "${backup_file}.sha256" > /dev/null 2>&1; then
            log_error "Checksum verification failed for: ${backup_file}"
            return 1
        fi
    fi
    
    log_info "Restore test passed: ${backup_file}"
    return 0
}

# Monitor storage capacity
check_storage_capacity() {
    local threshold="${STORAGE_THRESHOLD_PERCENT:-80}"
    local capacity=$(df -h "${BACKUP_DIR}" | awk 'NR==2 {print $5}' | tr -d '%')
    
    if [ "${capacity}" -gt "${threshold}" ]; then
        log_error "Storage capacity exceeds ${threshold}%: ${capacity}%"
        return 1
    fi
    
    log_info "Storage capacity OK: ${capacity}%"
    return 0
}

# Main execution
main() {
    local mode="${1:-staging}"
    
    if [ "${mode}" = "production" ]; then
        log_warn "Running in PRODUCTION mode. backups are irreversible."
    fi
    
    validate_env
    ensure_backup_dir
    
    # Pre-checks
    check_storage_capacity || exit 1
    
    # Backup
    backup_database
    backup_storage
    
    # Post-backup
    cleanup_old_backups
    
    # Verify backups
    log_info "Verifying backups..."
    test_restore "${DB_BACKUP}"
    test_restore "${FILE_BACKUP}"
    
    # Summary
    log_info "Backup completed successfully"
    log_info "Database backup: ${DB_BACKUP}"
    log_info "Storage backup: ${FILE_BACKUP}"
}

main "$@"
