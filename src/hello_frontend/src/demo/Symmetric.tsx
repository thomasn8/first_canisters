import { useRef, useState } from "react";
import { hello_backend } from "declarations/hello_backend";
import { Principal } from "@dfinity/principal";
import {
  TransportSecretKey,
  DerivedPublicKey,
  EncryptedVetKey,
  VetKey,
  IbeCiphertext,
  IbeIdentity,
  IbeSeed,
} from "@dfinity/vetkeys";
import { hexToUint8Array, uint8ArrayToHex } from "../utils";

function Symmetric() {
  const [vetkeyBytesHex, setVetkeyBytesHex] = useState('[...]');
  const [encryptedMessage, setEncryptedMessage] = useState('[...]');
  const [decryptedMessage, setDecryptedMessage] = useState('[...]');

  const messageToEncrypt = useRef<HTMLInputElement | null>(null);
  const encryptionKey = useRef<HTMLInputElement | null>(null);
  const messageToDecrypt = useRef<HTMLInputElement | null>(null);
  const decryptionKey = useRef<HTMLInputElement | null>(null);

  async function requestVetkey(event: React.FormEvent) {
    event.preventDefault();

    // principal
    const principal = Principal.fromText("2vxsx-fae");
    const inputBytes: Uint8Array = principal.toUint8Array();

    // transport key
    const transportSecretKey = TransportSecretKey.random();
    const tpk = transportSecretKey.publicKeyBytes();

    // get pub key
    const publicKeyBytes = await hello_backend.vetkd_public_key() as Uint8Array<ArrayBufferLike>;
    const publicKey = DerivedPublicKey.deserialize(publicKeyBytes);

    // get vetkey
    const encryptedVetKeyBytes = await hello_backend.vetkd_derive_ibe_key(tpk) as Uint8Array<ArrayBufferLike>;
    const encryptedVetKey = EncryptedVetKey.deserialize(encryptedVetKeyBytes);

    // verify + decrypt vetkey
    const vetKey = encryptedVetKey.decryptAndVerify(transportSecretKey, publicKey, inputBytes);
    setVetkeyBytesHex(uint8ArrayToHex(vetKey.serialize()));
  }

  async function deriveKeyMaterial(key: string) {
    const vetkeyBytes = hexToUint8Array(key);
    const vetkey = VetKey.deserialize(vetkeyBytes);
    const keyMaterial = await vetkey.asDerivedKeyMaterial();
    console.log(await keyMaterial.deriveAesGcmCryptoKey("vetkeys-example-symmetric-AES"));
    return keyMaterial;
  }

  async function encryptSym() {
    const keyMaterial = await deriveKeyMaterial(encryptionKey.current?.value!);
    const encryptedMessageBytes = await keyMaterial.encryptMessage(messageToEncrypt.current!.value, "vetkeys-example-symmetric-AES");
    const encryptedMessageBytesHex = uint8ArrayToHex(encryptedMessageBytes);
    setEncryptedMessage(encryptedMessageBytesHex);
  }
  
  async function decryptSym() {
    const keyMaterial = await deriveKeyMaterial(decryptionKey.current?.value!);
    const encryptedMessageBytes = hexToUint8Array(messageToDecrypt.current!.value);
    const decryptedMessage = await keyMaterial.decryptMessage(encryptedMessageBytes, "vetkeys-example-symmetric-AES");
    setDecryptedMessage(new TextDecoder().decode(decryptedMessage))
  }

  return (
    <main>
      <div className='symmetric-encryption'>
        <div>
          <h3>1. Vetkey</h3>
          <p>– Fetch a personnal vetkey from the backend, derived using the principal of the caller.</p>
          <button id="request-sym-key" onClick={requestVetkey}>Request vetkey</button>
          <p id="sym-key">vetkey: <b>{vetkeyBytesHex}</b></p>
        </div>

        <div>
          <h3>2. Encryption</h3>
          <p>– Encrypt a message with an encryption key.</p>
          <label>Message to encrypt:</label><input id="message-to-encrypt" type="text" placeholder="(text)" ref={messageToEncrypt}/>
          <label>Encryption key:</label><input id="encrypt-sym-key" type="text" placeholder="(bytes to hex format)" ref={encryptionKey}/>
          <button id="encrypt-sym" onClick={encryptSym}>Encrypt</button>
          <p id="encrypted-message">Encrypted message: <b>{encryptedMessage}</b></p>
        </div>

        <div>
          <h3>3. Decryption</h3>
          <p>– Decrypt an encrypted message with a decryption key.</p>
          <label>Message to decrypt:</label><input id="message-to-decrypt" type="text" placeholder="(bytes to hex format)" ref={messageToDecrypt}/>
          <label>Decryption key:</label><input id="decrypt-sym-key" type="text" placeholder="(bytes to hex format)" ref={decryptionKey}/>
          <button id="decrypt-sym" onClick={decryptSym}>Decrypt</button>
          <p id="encrypted-message">Decrypted message: <b>{decryptedMessage}</b></p>
        </div>
      </div>
    </main>
  );
}

export default Symmetric;
