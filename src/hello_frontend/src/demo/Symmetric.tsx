import { useRef, useState } from "react";
import { hello_backend } from "declarations/hello_backend";
import { Principal } from "@dfinity/principal";
import {
  TransportSecretKey,
  DerivedPublicKey,
  EncryptedVetKey,
  VetKey,
} from "@dfinity/vetkeys";
import { hexToUint8Array, uint8ArrayToHex } from "../utils";

function Symmetric() {
  const [vetkeyBytesHex, setVetkeyBytesHex] = useState('[...]');
  const [encryptedMessageBytesHex, setEncryptedMessageBytesHex] = useState('[...]');
  const [decryptedMessage, setDecryptedMessage] = useState('[...]');

  const messageToEncryptRef = useRef<HTMLInputElement | null>(null);
  const encryptionKeyRef = useRef<HTMLInputElement | null>(null);
  const messageToDecryptRef = useRef<HTMLInputElement | null>(null);
  const decryptionKeyRef = useRef<HTMLInputElement | null>(null);

  async function requestVetkey() {
    // TODO: enable login

    // principal
    const principal = Principal.fromText("2vxsx-fae");
    const inputBytes: Uint8Array = principal.toUint8Array();

    // transport key
    const transportSecretKey = TransportSecretKey.random();
    const tpk = transportSecretKey.publicKeyBytes();

    // get pub key
    const publicKeyBytes = await hello_backend.vetkd_public_key() as Uint8Array<ArrayBufferLike>;
    const derivedPublicKey = DerivedPublicKey.deserialize(publicKeyBytes);

    // get vetkey
    const encryptedVetKeyBytes = await hello_backend.vetkd_personal_vetkey(tpk) as Uint8Array<ArrayBufferLike>;
    const encryptedVetKey = EncryptedVetKey.deserialize(encryptedVetKeyBytes);

    // verify + decrypt vetkey
    const vetKey = encryptedVetKey.decryptAndVerify(transportSecretKey, derivedPublicKey, inputBytes);
    setVetkeyBytesHex(uint8ArrayToHex(vetKey.serialize()));
  }

  async function deriveKeyMaterial(keyByteHex: string) {
    const vetkeyBytes = hexToUint8Array(keyByteHex);
    const vetkey = VetKey.deserialize(vetkeyBytes);
    const derivedKeyMaterial = await vetkey.asDerivedKeyMaterial();
    console.log(await derivedKeyMaterial.deriveAesGcmCryptoKey("vetkeys-example-symmetric-AES"));
    return derivedKeyMaterial;
  }

  async function encrypt(message: string, keyBytesHex: string) {
    const derivedKeyMaterial = await deriveKeyMaterial(keyBytesHex);
    const encryptedMessageBytes = await derivedKeyMaterial.encryptMessage(message, "vetkeys-example-symmetric-AES");
    const encryptedMessageBytesHex = uint8ArrayToHex(encryptedMessageBytes);
    setEncryptedMessageBytesHex(encryptedMessageBytesHex);
  }
  
  async function decrypt(messageBytesHex: string, keyByteHex: string) {
    const derivedKeyMaterial = await deriveKeyMaterial(keyByteHex);
    const encryptedMessageBytes = hexToUint8Array(messageBytesHex);
    const decryptedMessageBytes = await derivedKeyMaterial.decryptMessage(encryptedMessageBytes, "vetkeys-example-symmetric-AES");
    setDecryptedMessage(new TextDecoder().decode(decryptedMessageBytes))
  }

  return (
    <main>
      <div>
        <h3>1. Vetkey</h3>
        <p>– Fetch personnal vetkey from the backend.</p>
        <button onClick={requestVetkey}>Request vetkey</button>
        <p>vetkey: <b>{vetkeyBytesHex}</b></p>
      </div>

      <div>
        <h3>2. Encryption</h3>
        <p>– Encrypt a message with a symmetric encryption key.</p>
        <label>Message to encrypt:</label><input type="text" placeholder="(plain text)" ref={messageToEncryptRef}/>
        <label>Encryption key:</label><input type="text" placeholder="(bytes to hex format)" ref={encryptionKeyRef}/>
        <button onClick={() => encrypt(messageToEncryptRef.current!.value, encryptionKeyRef.current!.value)}>Encrypt</button>
        <p>Encrypted message: <b>{encryptedMessageBytesHex}</b></p>
      </div>

      <div>
        <h3>3. Decryption</h3>
        <p>– Decrypt an encrypted message the same symmetric decryption key.</p>
        <label>Message to decrypt:</label><input type="text" placeholder="(bytes to hex format)" ref={messageToDecryptRef}/>
        <label>Decryption key:</label><input type="text" placeholder="(bytes to hex format)" ref={decryptionKeyRef}/>
        <button onClick={() => decrypt(messageToDecryptRef.current!.value, decryptionKeyRef.current!.value)}>Decrypt</button>
        <p>Decrypted message: <b>{decryptedMessage}</b></p>
      </div>
    </main>
  );
}

export default Symmetric;
