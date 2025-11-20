# Security Implementation Testing Guide

## Purpose
This document provides step-by-step instructions for manually testing the encryption implementation to ensure it works correctly with both legacy plaintext data and newly encrypted data.

## Prerequisites
1. Development database accessible
2. Application running locally
3. Admin/test user credentials
4. API testing tool (curl, Postman, or browser DevTools)

---

## Test Suite 1: Access Control Encryption

### Test 1.1: Create New Access Control (Encrypted Path)

**Objective**: Verify new access controls are encrypted with ENC:v1: prefix

**Steps**:
1. Create a new access control via API:
```bash
curl -X POST http://localhost:5000/api/external-unit-access-controls \
  -H "Content-Type: application/json" \
  -d '{
    "unitId": "test-unit-id",
    "accessType": "door_code",
    "accessCode": "1234567890",
    "isActive": true
  }'
```

2. Verify the response contains decrypted accessCode
3. Check database directly:
```sql
SELECT id, access_code FROM external_unit_access_controls 
WHERE id = 'returned-id';
```

**Expected Results**:
- ✅ API response shows: `"accessCode": "1234567890"`
- ✅ Database shows: `"accessCode": "ENC:v1:...base64..."`
- ✅ Database value starts with `ENC:v1:`

### Test 1.2: Read Encrypted Access Control

**Objective**: Verify encrypted data is decrypted correctly on read

**Steps**:
1. Get the access control created in Test 1.1:
```bash
curl http://localhost:5000/api/external-unit-access-controls/[id]
```

**Expected Results**:
- ✅ Response shows decrypted value: `"accessCode": "1234567890"`
- ✅ No errors in logs

### Test 1.3: Update Encrypted Access Control

**Objective**: Verify updates preserve encryption

**Steps**:
1. Update the access control:
```bash
curl -X PATCH http://localhost:5000/api/external-unit-access-controls/[id] \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "9876543210"
  }'
```

2. Check database:
```sql
SELECT id, access_code FROM external_unit_access_controls 
WHERE id = 'id';
```

**Expected Results**:
- ✅ API response shows: `"accessCode": "9876543210"`
- ✅ Database shows: `"accessCode": "ENC:v1:...different-base64..."`
- ✅ Database value starts with `ENC:v1:` (not double-encrypted)

### Test 1.4: Legacy Plaintext Access Control (Backward Compatibility)

**Objective**: Verify system handles legacy plaintext data

**Steps**:
1. Manually insert plaintext data into database:
```sql
INSERT INTO external_unit_access_controls 
(id, unit_id, access_type, access_code, is_active, created_at, updated_at)
VALUES 
('test-legacy-1', 'test-unit', 'wifi', 'PlainTextPassword123', true, NOW(), NOW());
```

2. Read via API:
```bash
curl http://localhost:5000/api/external-unit-access-controls/test-legacy-1
```

**Expected Results**:
- ✅ API returns: `"accessCode": "PlainTextPassword123"`
- ✅ No decryption errors in logs
- ✅ Database still shows plaintext (not modified)

3. Update the legacy record:
```bash
curl -X PATCH http://localhost:5000/api/external-unit-access-controls/test-legacy-1 \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "NewPassword456"
  }'
```

**Expected Results**:
- ✅ API returns: `"accessCode": "NewPassword456"`
- ✅ Database now shows: `"accessCode": "ENC:v1:..."`
- ✅ Legacy plaintext was upgraded to encrypted

---

## Test Suite 2: Bank Information Encryption

### Test 2.1: Update Bank Info (New Encrypted Path)

**Objective**: Verify bank information is encrypted on update

**Steps**:
1. Update bank information via API:
```bash
curl -X PATCH http://localhost:5000/api/profile/bank-info \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "bank",
    "bankName": "Banco Test",
    "bankAccountName": "John Doe",
    "bankAccountNumber": "1234567890123456",
    "bankClabe": "012345678901234567"
  }'
```

2. Check database:
```sql
SELECT id, bank_account_number, bank_clabe FROM users 
WHERE id = 'your-user-id';
```

**Expected Results**:
- ✅ API response shows decrypted values
- ✅ Database shows: `bank_account_number: "ENC:v1:..."`
- ✅ Database shows: `bank_clabe: "ENC:v1:..."`

### Test 2.2: Read User with Encrypted Bank Info

**Objective**: Verify encrypted bank data is decrypted on read

**Steps**:
1. Get user profile (implementation dependent - may need custom endpoint):
```bash
curl http://localhost:5000/api/profile
```

**Expected Results**:
- ✅ Response shows decrypted bank info
- ✅ No decryption errors

### Test 2.3: Legacy Plaintext Bank Info

**Objective**: Verify backward compatibility with plaintext bank data

**Steps**:
1. Create user with plaintext bank info:
```sql
UPDATE users 
SET bank_account_number = '9999888877776666',
    bank_clabe = '987654321098765432'
WHERE id = 'test-user-id';
```

2. Update bank info via API:
```bash
curl -X PATCH http://localhost:5000/api/profile/bank-info \
  -H "Content-Type: application/json" \
  -d '{
    "bankAccountNumber": "1111222233334444"
  }'
```

**Expected Results**:
- ✅ Update succeeds without errors
- ✅ Database now shows: `bank_account_number: "ENC:v1:..."`
- ✅ Plaintext was upgraded to encrypted

---

## Test Suite 3: Migration Scripts

### Test 3.1: Dry Run Migration

**Objective**: Verify migration script detects unencrypted data

**Steps**:
1. Ensure you have some test data (both encrypted and plaintext)
2. Run migration script:
```bash
tsx server/scripts/migrate-encrypt-data.ts
```

**Expected Results**:
- ✅ Script completes successfully
- ✅ Shows count of encrypted vs skipped records
- ✅ No errors or exceptions
- ✅ Logs show "⏭️ Skipping" for already encrypted records

### Test 3.2: Verify Idempotence

**Objective**: Verify migration can be run multiple times safely

**Steps**:
1. Run migration first time:
```bash
tsx server/scripts/migrate-encrypt-data.ts
```

2. Run migration second time immediately:
```bash
tsx server/scripts/migrate-encrypt-data.ts
```

**Expected Results**:
- ✅ Second run shows 0 records encrypted
- ✅ All records marked as "already encrypted"
- ✅ No double-encryption occurred
- ✅ `updatedAt` timestamps not modified

### Test 3.3: Verification Script

**Objective**: Verify all data is correctly encrypted

**Steps**:
1. Run verification script:
```bash
tsx server/scripts/verify-encryption.ts
```

**Expected Results**:
- ✅ Script completes successfully
- ✅ All tested records decrypt successfully
- ✅ No plaintext warnings
- ✅ Exit code 0

---

## Test Suite 4: Error Handling

### Test 4.1: Corrupted Encrypted Data

**Objective**: Verify system handles corrupted encryption gracefully

**Steps**:
1. Manually corrupt encrypted data:
```sql
UPDATE external_unit_access_controls 
SET access_code = 'ENC:v1:CorruptedBase64!!!'
WHERE id = 'test-id';
```

2. Try to read via API:
```bash
curl http://localhost:5000/api/external-unit-access-controls/test-id
```

**Expected Results**:
- ✅ Request doesn't crash server
- ✅ Error logged to console
- ✅ Response shows empty accessCode or error message
- ✅ No sensitive data leaked

### Test 4.2: Wrong Encryption Key

**Objective**: Verify changing encryption key is detected

**Steps**:
1. Encrypt data with current key
2. Change ENCRYPTION_KEY environment variable
3. Try to decrypt
4. Restore original key

**Expected Results**:
- ✅ Decryption fails gracefully
- ✅ Error message indicates key issue
- ✅ No crashes

---

## Test Suite 5: Integration Tests

### Test 5.1: Full CRUD Cycle - Access Control

**Objective**: Verify complete lifecycle works correctly

**Steps**:
1. CREATE: Add new access control with code "ABC123"
2. READ: Retrieve and verify code shows "ABC123"
3. UPDATE: Change code to "DEF456"
4. READ: Verify shows "DEF456"
5. DELETE: Remove access control
6. Verify database shows encrypted values at each step

**Expected Results**:
- ✅ All operations succeed
- ✅ Data encrypted in database throughout
- ✅ Data decrypted correctly in responses

### Test 5.2: Full CRUD Cycle - Bank Info

**Objective**: Verify complete bank info lifecycle

**Steps**:
1. UPDATE: Set bank account "1111222233334444"
2. READ: Verify account number shown correctly
3. UPDATE: Change to "5555666677778888"
4. READ: Verify new number shown
5. Verify database encryption at each step

**Expected Results**:
- ✅ All operations succeed
- ✅ Bank data encrypted in database
- ✅ Bank data decrypted in responses

---

## Test Suite 6: Audit Logging

### Test 6.1: Verify Audit Metadata

**Objective**: Ensure audit logs capture IP and User-Agent

**Steps**:
1. Create access control
2. Query audit logs:
```sql
SELECT * FROM audit_logs 
WHERE entity_type = 'external_unit_access_control'
ORDER BY created_at DESC LIMIT 1;
```

**Expected Results**:
- ✅ `ip_address` field populated
- ✅ `user_agent` field populated
- ✅ Details field contains operation info
- ✅ No sensitive data (codes, passwords) in logs

---

## Checklist Before Production

Use this checklist before deploying to production:

### Pre-Deployment
- [ ] All Test Suite 1 tests pass (Access Controls)
- [ ] All Test Suite 2 tests pass (Bank Info)
- [ ] All Test Suite 3 tests pass (Migration Scripts)
- [ ] All Test Suite 4 tests pass (Error Handling)
- [ ] All Test Suite 5 tests pass (Integration)
- [ ] All Test Suite 6 tests pass (Audit Logging)

### Environment
- [ ] `ENCRYPTION_KEY` set in production environment
- [ ] Encryption key backed up securely
- [ ] Database backup completed
- [ ] Migration script tested on staging copy

### Documentation
- [ ] Team aware of new encryption
- [ ] Runbook updated with encryption procedures
- [ ] Monitoring configured for decryption errors

### Migration Execution
- [ ] Maintenance window scheduled
- [ ] Migration script run successfully
- [ ] Verification script confirms all data encrypted
- [ ] Application tested with encrypted data
- [ ] Rollback plan ready

---

## Troubleshooting

### Issue: Decryption errors in logs

**Check**:
1. Verify ENCRYPTION_KEY matches what was used to encrypt
2. Check if data has `ENC:v1:` prefix
3. Look for corrupted base64 data

**Solution**:
- Restore from backup if key changed
- Re-encrypt if data corrupted

### Issue: Double encryption (ENC:v1:ENC:v1:...)

**Check**:
1. This should be impossible with current implementation
2. Verify `isEncrypted()` is being used

**Solution**:
- Report as bug
- Do NOT attempt to decrypt manually

### Issue: Plaintext data in database

**Check**:
1. Run verification script
2. Query for non-prefixed values

**Solution**:
- Run migration script
- Verify in staging first

---

## Automated Testing (Future)

### Recommended Test Framework
- Jest or Vitest for unit tests
- Supertest for API integration tests
- Drizzle with in-memory database for DB tests

### Test Coverage Goals
- Unit tests: `encrypt()`, `decrypt()`, `isEncrypted()`
- Integration tests: All API routes with encrypted data
- Migration tests: Idempotence, backward compatibility
- Error tests: Corruption, wrong keys, validation

### Example Unit Test
```typescript
import { encrypt, decrypt, isEncrypted } from './encryption';

describe('Encryption', () => {
  test('encrypt adds ENC:v1: prefix', () => {
    const encrypted = encrypt('test123');
    expect(encrypted).toMatch(/^ENC:v1:/);
  });

  test('decrypt handles plaintext', () => {
    const plaintext = 'not-encrypted';
    expect(decrypt(plaintext)).toBe(plaintext);
  });

  test('encrypt is idempotent', () => {
    const encrypted1 = encrypt('test123');
    const encrypted2 = encrypt(encrypted1);
    expect(encrypted1).toBe(encrypted2);
  });
});
```

---

## Contact

For issues discovered during testing:
- Check application logs first
- Review SECURITY_IMPROVEMENTS.md
- Verify ENCRYPTION_KEY is correct
- Ensure migration was run

**END OF TESTING GUIDE**
