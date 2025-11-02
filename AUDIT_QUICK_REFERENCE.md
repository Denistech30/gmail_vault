# 🔒 SECURITY AUDIT - QUICK REFERENCE

## 🎯 **ONE-COMMAND AUDIT**

### **Run in Browser Console:**
```javascript
// Copy and paste SECURITY_AUDIT_SCRIPT.js contents
// OR use this quick check:

(async () => {
  console.log('🔒 QUICK SECURITY CHECK\n');
  
  // 1. Encryption
  const enc = localStorage.getItem('lastEncrypted');
  const hasEnc = enc && !enc.includes('audit@test') && !enc.includes('SecurePass');
  console.log(hasEnc ? '✅' : '❌', 'Encryption:', hasEnc ? 'SECURE' : 'LEAK DETECTED');
  
  // 2. Storage
  const keys = Object.keys(localStorage);
  const hasLeaks = keys.some(k => {
    const v = localStorage.getItem(k);
    return v && (v.includes('SecurePass') || v.includes('audit@test'));
  });
  console.log(!hasLeaks ? '✅' : '❌', 'Storage:', !hasLeaks ? 'SECURE' : 'LEAK DETECTED');
  
  // 3. ZKP
  const zkp = localStorage.getItem('zkpPublicHash');
  console.log(zkp ? '✅' : '⚠️', 'ZKP:', zkp ? 'CONFIGURED' : 'NOT ENROLLED');
  
  // 4. Clipboard
  try {
    const clip = await navigator.clipboard.readText();
    console.log('✅ Clipboard:', clip ? 'HAS DATA' : 'EMPTY');
  } catch {
    console.log('⚠️ Clipboard: CANNOT READ');
  }
  
  console.log('\n' + (hasEnc && !hasLeaks ? '✅ QUICK CHECK PASSED' : '❌ ISSUES FOUND'));
})();
```

---

## 📋 **MANUAL CHECKS**

### **1. Add Account Test**
```
1. Go to /add
2. Email: audit@test.com
3. Password: SecurePass123!
4. Save
5. Check console for encryption log
```

### **2. Firestore Check**
```
1. Firebase Console
2. Firestore → users/{uid}/accounts
3. Verify: encryptedData field exists
4. Verify: NO plaintext visible
```

### **3. Dashboard Check**
```
1. Go to /
2. Find audit account
3. Click eye icon → Shows password
4. Click copy → Paste works
5. Check console for clipboard log
```

### **4. Recovery Check**
```
1. Go to /settings → Enroll
2. Go to /recovery → Scan
3. Verify: Accounts load
4. Check console for ZKP log
```

---

## ✅ **PASS CRITERIA**

| Check | Expected | Status |
|-------|----------|--------|
| Encryption | Arrays of numbers | [ ] |
| Firestore | No plaintext | [ ] |
| Dashboard | Decrypts correctly | [ ] |
| Clipboard | Plaintext on copy | [ ] |
| Recovery | Full restore | [ ] |
| ZKP | Hash matches | [ ] |
| Storage | No leaks | [ ] |

---

## 🚨 **FAILURE INDICATORS**

### **❌ CRITICAL:**
- Plaintext password in localStorage
- Plaintext password in Firestore
- Encrypted data shown to user
- ZKP verification always passes

### **⚠️ WARNING:**
- Password visible in DOM source
- Large memory usage (>200MB)
- Slow decryption (>2s)

---

## 🔧 **QUICK FIXES**

### **If Encryption Fails:**
```javascript
// Check encryptData function
// Verify: Uses crypto.subtle
// Verify: Returns { encryptedData, iv, salt }
```

### **If Decryption Fails:**
```javascript
// Check decryptData function
// Verify: No fallback key
// Verify: Uses correct userPassword
```

### **If Copy Shows Encrypted:**
```javascript
// Check handleCopy function
// Verify: Copies account.password (not account.encryptedData)
// Verify: Data is decrypted before display
```

---

## 📊 **EXPECTED CONSOLE OUTPUT**

### **On Add Account:**
```
🔒 SECURITY AUDIT - ENCRYPTION CHECK:
Original data length: 85
Encrypted blob: { encryptedDataLength: 144, ... }
✅ Plaintext NOT in encrypted blob: true
```

### **On Dashboard Load:**
```
✅ Decrypted account: {
  email: "audit@test.com",
  passwordLength: 15
}
```

### **On Copy:**
```
🔒 CLIPBOARD AUDIT: {
  field: "password-abc123",
  textLength: 15,
  isPlaintext: true
}
```

### **On Recovery:**
```
🔒 ZKP AUDIT: {
  hashesMatch: true,
  ...
}
🔓 Recovery - Decrypted account: {
  email: "audit@test.com",
  passwordLength: 15
}
```

---

## 🎯 **5-MINUTE AUDIT**

1. **Add test account** (1 min)
2. **Check console logs** (1 min)
3. **Verify Firestore** (1 min)
4. **Test copy/paste** (1 min)
5. **Run audit script** (1 min)

**Total: 5 minutes** ⏱️

---

## ✅ **FINAL CHECKLIST**

```
[ ] Test account added
[ ] Console shows encryption log
[ ] Firestore has encrypted data
[ ] Dashboard shows plaintext
[ ] Copy/paste works
[ ] Recovery works
[ ] Audit script passes
[ ] No errors in console
```

**If all checked → AUDIT PASSED** ✅

---

## 📞 **QUICK HELP**

### **Blank page?**
- Check console for errors
- Verify dev server running
- Clear cache and reload

### **Copy shows encrypted?**
- Check decryptData import
- Verify no dynamic import
- Check handleCopy function

### **Recovery fails?**
- Enroll biometrics first
- Check ZKP hash exists
- Verify fingerprint matches

---

**Run the audit and check off each item!** 🔒
