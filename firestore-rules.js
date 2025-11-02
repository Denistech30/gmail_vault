// Firestore Security Rules for Gmail Vault PWA
// Copy this to Firebase Console > Firestore Database > Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can only access their own accounts subcollection
      match /accounts/{accountId} {
        allow read, write, create, delete: if request.auth != null && request.auth.uid == userId;
      }
      
      // Users can only access their own settings subcollection  
      match /settings/{settingId} {
        allow read, write, create, delete: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
