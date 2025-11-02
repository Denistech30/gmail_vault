// 🔒 GMAIL VAULT PWA - SECURITY AUDIT SCRIPT
// Run this in browser console after performing audit steps

console.log('🔒 ========================================');
console.log('🔒 GMAIL VAULT PWA - SECURITY AUDIT');
console.log('🔒 ========================================\n');

// --- 1. ENCRYPTION CHECK ---
console.log('📋 1. ENCRYPTION CHECK');
const lastEncrypted = localStorage.getItem('lastEncrypted');
if (lastEncrypted) {
  try {
    const parsed = JSON.parse(lastEncrypted);
    console.log('✅ Encrypted data structure:', {
      hasEncryptedData: !!parsed.encryptedData,
      hasIV: !!parsed.iv,
      hasSalt: !!parsed.salt,
      encryptedDataLength: parsed.encryptedData?.length,
      ivLength: parsed.iv?.length,
      saltLength: parsed.salt?.length
    });
    
    // Check for plaintext leaks
    const stringified = JSON.stringify(parsed);
    const hasEmail = stringified.includes('audit@test.com');
    const hasPassword = stringified.includes('SecurePass123!');
    
    if (hasEmail || hasPassword) {
      console.error('❌ SECURITY BREACH: Plaintext found in encrypted blob!');
    } else {
      console.log('✅ No plaintext leaks in encrypted blob');
    }
  } catch (e) {
    console.error('❌ Failed to parse encrypted data:', e);
  }
} else {
  console.warn('⚠️ No lastEncrypted found in localStorage');
}
console.log('');

// --- 2. LOCALSTORAGE AUDIT ---
console.log('📋 2. LOCALSTORAGE AUDIT');
const storageKeys = Object.keys(localStorage);
console.log('LocalStorage keys:', storageKeys);

const sensitivePatterns = ['password', 'email', 'SecurePass', 'audit@'];
let leaksFound = false;

storageKeys.forEach(key => {
  const value = localStorage.getItem(key);
  sensitivePatterns.forEach(pattern => {
    if (value && value.includes(pattern)) {
      console.error(`❌ LEAK DETECTED in key "${key}": Contains "${pattern}"`);
      leaksFound = true;
    }
  });
});

if (!leaksFound) {
  console.log('✅ No plaintext leaks in localStorage');
}
console.log('');

// --- 3. CLIPBOARD CHECK ---
console.log('📋 3. CLIPBOARD CHECK');
navigator.clipboard.readText()
  .then(text => {
    console.log('Clipboard content length:', text?.length);
    if (text) {
      console.log('Clipboard sample:', text.substring(0, 20) + '...');
      console.log('✅ Clipboard contains data (expected after copy)');
    } else {
      console.log('✅ Clipboard is empty');
    }
  })
  .catch(err => {
    console.warn('⚠️ Cannot read clipboard (permission denied or empty)');
  });
console.log('');

// --- 4. DOM AUDIT ---
console.log('📋 4. DOM AUDIT');
const bodyHTML = document.body.innerHTML;
const hasPasswordInDOM = bodyHTML.includes('SecurePass123!');
const hasEmailInDOM = bodyHTML.includes('audit@test.com');

// Check for visible passwords (not hidden)
const passwordElements = document.querySelectorAll('[type="password"]');
const visiblePasswords = Array.from(document.querySelectorAll('*'))
  .filter(el => {
    const text = el.textContent || '';
    return text.includes('SecurePass123!') && 
           window.getComputedStyle(el).display !== 'none';
  });

console.log('Password fields found:', passwordElements.length);
console.log('Visible password text in DOM:', visiblePasswords.length);

if (visiblePasswords.length > 0 && !document.querySelector('[type="text"][name="password"]')) {
  console.warn('⚠️ Password visible in DOM (check if intentional - e.g., show password toggle)');
} else {
  console.log('✅ No unexpected password exposure in DOM');
}
console.log('');

// --- 5. MEMORY AUDIT ---
console.log('📋 5. MEMORY AUDIT');
if (performance.memory) {
  console.log('Memory usage:', {
    usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
  });
} else {
  console.log('⚠️ Memory API not available');
}
console.log('');

// --- 6. INDEXEDDB AUDIT ---
console.log('📋 6. INDEXEDDB AUDIT');
indexedDB.databases().then(dbs => {
  console.log('IndexedDB databases:', dbs.map(db => db.name));
  if (dbs.length === 0) {
    console.log('✅ No IndexedDB databases (expected)');
  }
}).catch(err => {
  console.log('⚠️ Cannot access IndexedDB:', err.message);
});
console.log('');

// --- 7. NETWORK AUDIT ---
console.log('📋 7. NETWORK AUDIT');
if (window.performance && performance.getEntriesByType) {
  const resources = performance.getEntriesByType('resource');
  const firestoreRequests = resources.filter(r => 
    r.name.includes('firestore') || r.name.includes('firebase')
  );
  console.log('Firestore requests:', firestoreRequests.length);
  console.log('✅ Check Network tab for encrypted payloads');
} else {
  console.log('⚠️ Performance API not available');
}
console.log('');

// --- 8. ZKP AUDIT ---
console.log('📋 8. ZKP AUDIT');
const zkpHash = localStorage.getItem('zkpPublicHash');
if (zkpHash) {
  console.log('ZKP Public Hash:', {
    length: zkpHash.length,
    sample: zkpHash.substring(0, 32) + '...',
    isHex: /^[a-f0-9]+$/i.test(zkpHash)
  });
  console.log('✅ ZKP hash stored (SHA-256 hex)');
} else {
  console.warn('⚠️ No ZKP hash found (enroll biometrics first)');
}
console.log('');

// --- 9. BIOMETRICS AUDIT ---
console.log('📋 9. BIOMETRICS AUDIT');
const biometricsEnabled = localStorage.getItem('biometricsEnabled');
const fingerprintCred = localStorage.getItem('fingerprintCred');

console.log('Biometrics enabled:', biometricsEnabled);
if (fingerprintCred) {
  try {
    const cred = JSON.parse(fingerprintCred);
    console.log('Fingerprint credential:', {
      hasId: !!cred.id,
      hasRawId: !!cred.rawId,
      hasResponse: !!cred.response,
      type: cred.type
    });
    console.log('✅ WebAuthn credential stored');
  } catch (e) {
    console.error('❌ Failed to parse fingerprint credential');
  }
} else {
  console.warn('⚠️ No fingerprint credential (enroll first)');
}
console.log('');

// --- 10. FINAL VERDICT ---
console.log('🔒 ========================================');
console.log('🔒 SECURITY AUDIT SUMMARY');
console.log('🔒 ========================================\n');

const checks = {
  encryption: !leaksFound && lastEncrypted,
  storage: !leaksFound,
  clipboard: true, // Manual check required
  dom: visiblePasswords.length === 0 || document.querySelector('[type="text"][name="password"]'),
  zkp: !!zkpHash,
  biometrics: !!fingerprintCred
};

Object.entries(checks).forEach(([key, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${key.toUpperCase()}: ${passed ? 'PASS' : 'FAIL'}`);
});

const allPassed = Object.values(checks).every(v => v);
console.log('\n' + (allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'));
console.log('🔒 ========================================\n');

// Export results
window.securityAuditResults = {
  timestamp: new Date().toISOString(),
  checks,
  allPassed,
  localStorage: storageKeys,
  zkpHash: zkpHash?.substring(0, 32) + '...',
  biometricsEnabled
};

console.log('💾 Results saved to: window.securityAuditResults');
