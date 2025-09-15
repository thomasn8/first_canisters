# Vetkeys

## Examples

### Quick start
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

### Example 1: Encrypt/decrypt message with a personal symmetric key
Key file: [`src/hello_frontend/src/examples/Symmetric.tsx`](src/hello_frontend/src/examples/Symmetric.tsx)

URL: http://localhost:3000/symmetric

### Example 2: Asymetrically encrypt message for a recipient or Decrypt a message received
Key file: [`src/hello_frontend/src/examples/Ibe.tsx`](src/hello_frontend/src/examples/Ibe.tsx)

URL: http://localhost:3000/ibe

### Login
Key file: [`src/hello_frontend/src/IdentityProvider.tsx`](src/hello_frontend/src/IdentityProvider.tsx)

Note:  
Code inspired from: https://github.com/dfinity/examples/tree/master/rust/who_am_i  
Canister download from: https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_dev.wasm.gz (see [`dfx.json`](`dfx.json`))  

### Backend: Derive public key and personal vetkey
Key file: [`src/hello_backend/src/lib.rs`](src/hello_backend/src/lib.rs)

URL: http://127.0.0.1:4943/?canisterId=CANISTER_ID&id=uxrrr-q7777-77774-qaaaq-cai

### Resources
Rust vetkeys:  
https://internetcomputer.org/docs/building-apps/network-features/vetkeys/api

TS vetkeys:  
https://dfinity.github.io/vetkeys/index.html

Auth:  
https://github.com/dfinity/examples/tree/master/rust/who_am_i

## Usefull commands

```bash
dfx stop
```
```bash
dfx build
```
```bash
dfx identity list
```
```bash
npm start
```
```bash
npm run build
```
```bash
npm run generate
```
```bash
generate-did hello_backend
```