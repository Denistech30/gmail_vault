// Simple hash circuit for credential verification
// Compatible with Circom 0.5.x

template CredentialHash() {
    signal input credential[256];  // Input credential as byte array (padded to 256)
    signal output hash;            // Output hash

    signal intermediate[256];
    
    // Simple polynomial hash: hash = sum(credential[i] * (i+1))
    intermediate[0] <== credential[0];
    for (var i = 1; i < 256; i++) {
        intermediate[i] <== intermediate[i-1] + credential[i] * (i + 1);
    }
    
    hash <== intermediate[255];
}

component main = CredentialHash();
