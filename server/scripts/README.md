# Database Migration Scripts

This directory contains scripts for migrating and verifying encrypted data in the database.

## Prerequisites

1. **Backup your database** before running any migration scripts
2. Set the `ENCRYPTION_KEY` environment variable (production only)
3. Ensure database connection is properly configured

## Scripts

### 1. migrate-encrypt-data.ts

Encrypts existing sensitive data in the database.

**What it does:**
- Finds all records with unencrypted sensitive data
- Encrypts using AES-256-GCM
- Updates records in the database
- Provides detailed progress and summary

**Encrypted fields:**
- `externalUnitAccessControls.accessCode`
- `users.bankAccountNumber`
- `users.bankClabe`

**Usage:**
```bash
# Development
tsx server/scripts/migrate-encrypt-data.ts

# Production (with ENCRYPTION_KEY set)
ENCRYPTION_KEY=your-secure-key tsx server/scripts/migrate-encrypt-data.ts
```

**Important Notes:**
- Script is idempotent (safe to run multiple times)
- Skips already encrypted data
- Detects encryption by checking for 'ENC:v1:' prefix (not by length)
- Automatically preserves original updatedAt timestamps
- Run during maintenance window for production

### 2. verify-encryption.ts

Verifies that encrypted data can be correctly decrypted.

**What it does:**
- Samples encrypted records from database
- Attempts to decrypt them
- Reports success/failure for each record

**Usage:**
```bash
# Development
tsx server/scripts/verify-encryption.ts

# Production
ENCRYPTION_KEY=your-secure-key tsx server/scripts/verify-encryption.ts
```

**When to use:**
- After running migration script
- After changing ENCRYPTION_KEY
- As part of deployment verification
- Regular health checks

## Migration Workflow

### First-Time Setup (Development)

```bash
# 1. Backup database (optional for dev)
# 2. Run migration
tsx server/scripts/migrate-encrypt-data.ts

# 3. Verify encryption works
tsx server/scripts/verify-encryption.ts

# 4. Test application
npm run dev
```

### Production Deployment

```bash
# 1. BACKUP DATABASE (MANDATORY)
# Take full database backup before proceeding

# 2. Set encryption key
export ENCRYPTION_KEY="your-secure-32-byte-key"

# 3. Enter maintenance mode
# Prevent writes to affected tables

# 4. Run migration
tsx server/scripts/migrate-encrypt-data.ts

# 5. Verify encryption
tsx server/scripts/verify-encryption.ts

# 6. Test application
# Verify reads/writes work correctly

# 7. Exit maintenance mode
# Resume normal operations

# 8. Monitor logs
# Watch for decryption errors
```

## Generating Encryption Key

For production, generate a secure random key:

```bash
# Generate 32-byte key (recommended)
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Store the key securely in:
- Replit Secrets (for Replit deployment)
- AWS Secrets Manager
- Azure Key Vault
- Environment variables (with restricted access)

## Troubleshooting

### "ENCRYPTION_KEY not set" warning

**Development:** This is expected. The script uses a default key.
**Production:** This is a critical error. Set ENCRYPTION_KEY before proceeding.

### Decryption errors after migration

**Possible causes:**
1. ENCRYPTION_KEY changed after migration
2. Database restored from pre-encryption backup
3. Corruption during migration

**Solution:**
1. Restore from backup
2. Verify ENCRYPTION_KEY is correct
3. Re-run migration with correct key

### Some records not encrypted

**Check:**
1. Review migration logs for failed records
2. Verify database permissions
3. Check for null/empty values (these are skipped)
4. Run verification script to identify unencrypted records

**Query to find unencrypted data**:
```sql
-- Find unencrypted access codes
SELECT id, unit_id FROM external_unit_access_controls 
WHERE access_code IS NOT NULL AND access_code NOT LIKE 'ENC:v1:%';

-- Find unencrypted bank info
SELECT id, email FROM users 
WHERE (bank_account_number IS NOT NULL AND bank_account_number NOT LIKE 'ENC:v1:%')
   OR (bank_clabe IS NOT NULL AND bank_clabe NOT LIKE 'ENC:v1:%');
```

### Performance considerations

- Migration locks affected tables
- Large datasets may take time
- Consider batching for very large tables (>1M records)
- Run during low-traffic periods

## Security Best Practices

1. **Never commit ENCRYPTION_KEY** to version control
2. **Rotate keys periodically** (requires key versioning - not yet implemented)
3. **Backup key securely** (loss = permanent data loss)
4. **Restrict access** to encryption key
5. **Audit key usage** regularly
6. **Test recovery** procedures

## Monitoring

After migration, monitor for:

1. **Decryption errors** in application logs
2. **Performance degradation** (encryption adds overhead)
3. **Failed database operations**
4. **Audit log anomalies**

Example log queries:
```
# Search for decryption failures
grep "Failed to decrypt" logs/app.log

# Count decryption attempts
grep "decrypt" logs/app.log | wc -l
```

## Rollback

If migration fails and you need to rollback:

1. **Stop application immediately**
2. **Restore from backup** (taken before migration)
3. **Investigate error** in migration logs
4. **Fix issue** (permissions, key, etc.)
5. **Re-run migration** with fixes

## Support

For issues or questions:
- Review `SECURITY_IMPROVEMENTS.md`
- Check application logs
- Verify ENCRYPTION_KEY is set correctly
- Ensure database connection works

## Future Enhancements

Planned improvements:
- [ ] Key versioning for rotation
- [ ] Batch processing for large datasets
- [ ] Progress indicators for long operations
- [ ] Dry-run mode
- [ ] Automated backup verification
- [ ] Rollback command
