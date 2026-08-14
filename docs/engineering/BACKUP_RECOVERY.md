# Backup, Restore, dan Monitoring SATU

## 1. Tujuan

Dokumen ini menetapkan kontrak backup, restore, dan monitoring untuk production SATU. Operator dapat memulai, memverifikasi, dan menjalankan seluruh prosedur tanpa implicit knowledge. Dokumen ini hanya memuat kontrak yang sudah didukung oleh implementasi saat ini.

## 2. Backup Schedule

### 2.1 Environment Variables Required

Backup script memerlukan environment variables berikut:

- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` - Koneksi database
- `BACKUP_DIR` - Direktori penyimpanan backup (default: `/var/backups/satu`)
- `FILESYSTEM_DISK_PATH` - Path storage untuk file backup
- `RETENTION_DAYS` - Jumlah hari retention (default: 30)
- `STORAGE_THRESHOLD_PERCENT` - Threshold kapasitas storage (default: 80)

### 2.2 Database Backup

- **Frekuensi**: Harian pada pukul 02:00 UTC
- **Metode**: `mysqldump` dengan `--single-transaction --quick --routines --triggers --events`
- **Retention**: 30 hari (7 hari hot + 23 hari cold)
- **Storage**: Local backup directory (`/var/backups/satu/`) atau S3 bucket production

```bash
# Backup script example
mysqldump \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --compress \
  --result-file="/var/backups/satu/db-$(date +%Y%m%d-%H%M%S).sql.gz" \
  "${DB_DATABASE}"
```

### 2.2 File Backup

- **Ditujukan**: `storage/app/private/` (attachments, evidence)
- **Frekuensi**: Harian setelah database backup
- **Metode**: `rsync` dengan `--archive --compress --delete`
- **Retention**: 30 hari (same as database)

### 2.3 Backup Verification

Setiap backup harus diverifikasi:

1. Checksum file (SHA-256)
2. Verifikasi restore ke environment terpisah (staging/minimal)
3. Validasi database integrity (`mysqlcheck --check`)

### 2.4 Monitoring Backup Health

- Alert jika backup gagal 2 kali berturut-turut
- Alert jika storage capacity melebihi 80%
- Alert jika backup older than 26 hours

## 3. Restore Procedures

### 3.1 Pre-Restore Checklist

- [ ] Konfirmasi environment (staging/production)
- [ ] Backup terakhir berhasil dan tidak corrupted
- [ ] Notification ke stakeholders (opsional)
- [ ] Maintenance window configured

### 3.2 Database Restore

```bash
# Stop queue worker dan scheduler sebelum restore
php artisan queue:restart
php artisan schedule:work --stop

# Restore database
gunzip -c "/var/backups/satu/db-YYYYMMDD-HHMMSS.sql.gz" | mysql "${DB_DATABASE}"

# Restart worker dan scheduler
php artisan queue:work &
php artisan schedule:work &
```

### 3.3 File Restore

```bash
rsync -avz /var/backups/satu/storage/ /path/to/storage/
chown -R www-data:www-data /path/to/storage/
```

### 3.4 Post-Restore Verification

- [ ] Run `php artisan migrate:status` (cek schema)
- [ ] Run `php artisan about` (cek config)
- [ ] Verifikasi endpoint `/up`
- [ ] Verifikasi sample read/write query
- [ ] Verify queue worker dan scheduler aktif

### 3.5 Recovery Time Objective (RTO)

- Database restore: <= 30 menit
- File restore: <= 10 menit
- Full system recovery: <= 1 jam

## 4. Monitoring dan Alerting

### 4.1 Queue Failure Monitoring

**Command**: `php artisan queue:work`

**Checks**:

- Queue length > 1000 items untuk > 15 menit → critical
- Job failed count > 50 dalam 1 jam → warning
- Queue worker tidak aktif > 5 menit → critical

**Implementation**: Custom health check endpoint atau external monitoring (UptimeRobot, PagerDuty)

### 4.2 Reverb Health Monitoring

**Command**: `php artisan reverb:start`

**Checks**:

- WebSocket connection count stable (sudden drop/collapse → alert)
- Reverb process alive (systemd/cron check)
- Reverb logs tidak mengandung error berulang

**Implementation**: `GET /up` endpoint already included; tambahkan `/health/reverb` custom endpoint

### 4.3 Application Error Monitoring

**Checks**:

- `LOG_CHANNEL=single` untuk production
- Error rate > 100/min → critical
- Specific error patterns (database connection, Reverb, provider API)

**Implementation**: Gunakan Laravel logging dengan custom logger yang forward ke external service (Sentry, Logflare)

### 4.4 Academic Sync Monitoring

**Command**: `integration:alert-sync-anomalies` (jalan setiap 15 menit)

**Checks**:

- Sync failures > threshold dalam window tertentu
- Data stale detection (no update > 24 jam)

**Implementation**: `DetectSyncAnomalies` action yang emit alert

### 4.5 Database Health

**Checks**:

- Connection pool available
- Replication lag (jika menggunakan replica)
- Slow query log > threshold

**Implementation**: Custom health check `/health/database`

## 5. Incident Response

### 5.1 Incident Classification

| Level | Deskripsi                                   | Response Time     |
| ----- | ------------------------------------------- | ----------------- |
| P1    | Service down, data loss risk                | Immediate         |
| P2    | Service degraded, major feature unavailable | 15 menit          |
| P3    | Minor issues, workaround available          | 4 jam             |
| P4    | Questions, enhancements                     | Next business day |

### 5.2 Incident Response Procedure

1. **Acknowledgment**: Assign incident owner within 5 menit
2. **Triage**: Assess scope, severity, and impact
3. **Containment**: Implement temporary fix jika perlu
4. **Resolution**: Root cause analysis dan permanent fix
5. **Postmortem**: Document within 48 jam

### 5.3 Escalation Procedures

| Level | Escalation Path                          |
| ----- | ---------------------------------------- |
| P1    | Incident owner → Tech lead → CTO         |
| P2    | Incident owner → Tech lead               |
| P3    | Incident owner (no automatic escalation) |
| P4    | No escalation                            |

## 6. Privacy Incident Response

### 6.1 Definition

Privacy incident: unauthorized access, exposure, atau loss data pribadi (phone, NIM, evidence, message).

### 6.2 Response

1. **Contain**: Immediately disable access, revoke tokens
2. **Assess**: Identify scope, affected users, data types
3. **Notify**:
    - Internal: Tech lead, legal, compliance
    - External: Users terdampak (jika wajib hukum)
4. **Remediate**: Fix root cause, implement additional controls
5. **Report**: Document dalam 72 jam (sesuai GDPR if applicable)

### 6.3 Documentation

Setiap privacy incident wajib didokumentasikan:

- Timeline
- Data types affected
- Number of users
- Root cause
- Remediation steps
- Preventive measures

## 7. Recovery Objectives

| Objective                        | Target | Description                       |
| -------------------------------- | ------ | --------------------------------- |
| RTO (Recovery Time Objective)    | 1 jam  | Waktu total恢复 dari incident     |
| RPO (Recovery Point Objective)   | 24 jam | Data loss maximum (1 hari backup) |
| MTD (Maximum Tolerable Downtime) | 4 jam  | Waktu maximum service can be down |

## 8. Verification Checklist

### 8.1 Backup Verification

- [ ] Backup script berjalan setiap hari
- [ ] Backup file tersimpan di location aman
- [ ] Backup checksum valid
- [ ] Verifikasi restore berhasil ke staging

### 8.2 Restore Drill (quarterly)

- [ ] Simulasi database restore
- [ ] Verifikasi data integrity
- [ ] Verifikasi application functionality
- [ ] Document lessons learned

### 8.3 Monitoring Verification

- [ ] Alert channel aktif (Slack/email/pager)
- [ ] Verifikasi alert manual trigger
- [ ] Verify alert threshold sesuai RTO/RPO

## 9. External Dependencies

### 9.1 Fonnte WhatsApp Provider

- SLA monitoring: Delivery success rate > 95%
- Alert: Delivery failure > 10% dalam 1 jam

### 9.2 Academic Provider

- SLA monitoring: Sync success rate > 99%
- Alert: Sync failure > 3 kali dalam 1 jam

## 10. References

- [OPERATIONS.md](./OPERATIONS.md) - Deployment dan runtime contract
- [SECURITY_PRIVACY.md](./SECURITY_PRIVACY.md) - Security dan privacy requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture dan data flow
