# Vetkeys Demo

## Quick start

First deploy locally and then follow the URLs below, based on which example you want to try.

```bash
dfx start --background --clean
dfx deploy
npm start
```

You can process with 2 browsers opened side-by-side, logged-in with different identites to test encryption/decryption in different directions.

Open the console to have additional informations (errors are not rendered in the html yet).

### Home: Router for examples
URL: http://localhost:3000/

## Examples

### Example 1: Encrypt/decrypt message with a personal symmetric key
Key file: [`src/hello_frontend/src/examples/Symmetric.tsx`](src/hello_frontend/src/examples/Symmetric.tsx)

URL: http://localhost:3000/symmetric

TODO: add screen

### Example 2: Asymetrically encrypt message for a recipient or Decrypt a message received
Key file: [`src/hello_frontend/src/examples/Ibe.tsx`](src/hello_frontend/src/examples/Ibe.tsx)

URL: http://localhost:3000/ibe

TODO: add screen

This example could be used to manage encrypted NFT content, for which decryption would only be possible for an IBE principal (possibly the owner of the nft).  
This ensures a stricter access controll but the drawback is that the NFT content can be decrypted by a single principal and we need to re-encrypt the content when the owner changes.

### Example 3: Encrypt the content of the NFT to allow access to specific principals
Key file: [`src/hello_frontend/src/examples/Nft.tsx`](src/hello_frontend/src/examples/Nft.tsx)

URL: http://localhost:3000/nft

TODO: add screen

In this case, NFT content encryption is managed using the NFT id. Therefore, we can manually handle its access controll in the backend canister logic to give permission to a set of principals.  
It gives more flexibility and no need to re-encrypt the NFT content when the owner changes (only update the data structure that handles the permission).

## Backend
Key file: [`src/hello_backend/src/lib.rs`](src/hello_backend/src/lib.rs)

URL: http://127.0.0.1:4943/?canisterId=CANISTER_ID&id=uxrrr-q7777-77774-qaaaq-cai

Roles:
- Own a NFT (raw encoded)
- Derive public key and personal vetkey
- Manage a mock NFT collection with id/owner/authorized_principal/encrypted_content
- Allow post/get of the NFT encrypted content, if caller has permission
- Derive vetkey to decrypt the NFT content, if caller has permission

## Login
Key file: [`src/hello_frontend/src/IdentityProvider.tsx`](src/hello_frontend/src/IdentityProvider.tsx)

Code inspired from: https://github.com/dfinity/examples/tree/master/rust/who_am_i  
Canister download from: https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_dev.wasm.gz (see [`dfx.json`](`dfx.json`))  

## Resources
Rust vetkeys:  
https://internetcomputer.org/docs/building-apps/network-features/vetkeys/api

TS vetkeys:  
https://dfinity.github.io/vetkeys/index.html

Auth:  
https://github.com/dfinity/examples/tree/master/rust/who_am_i
