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
import { hex_decode, hex_encode } from "../utils/byte_hex_conversions";

function Ibe() {
    const [publicKeyBytesHex, setPublicKeyBytesHex] = useState('[...]');
    const [encryptedMessageBytesHex, setEncryptedMessageBytesHex] = useState('[...]');
    const [vetkeyBytesHex, setVetkeyBytesHex] = useState('[...]');
    const [decryptedMessage, setDecryptedMessage] = useState('[...]');
    
    const messageToEncryptRef = useRef<HTMLInputElement | null>(null);
    const recipientRef = useRef<HTMLInputElement | null>(null);
    const pubKeyBytesHexRef = useRef<HTMLInputElement | null>(null);
    const messageToDecryptBytesHexRef = useRef<HTMLInputElement | null>(null);
    const vetKeyBytesHexRef = useRef<HTMLInputElement | null>(null);
  
    async function requestPubKey() {
        // TODO: enable login
        
        const pubKeyBytes = await hello_backend.vetkd_public_key() as Uint8Array<ArrayBufferLike>;
        setPublicKeyBytesHex(hex_encode(pubKeyBytes));
    }
    
    async function encrypt(message: string, recipient: string, keyBytesHex: string) {
        const principal = Principal.fromText(recipient);
        const derivedPublicKey = DerivedPublicKey.deserialize(hex_decode(keyBytesHex));
        const ciphertext = IbeCiphertext.encrypt(
            derivedPublicKey,
            IbeIdentity.fromPrincipal(principal as any),
            new TextEncoder().encode(message),
            IbeSeed.random(),
        );
        setEncryptedMessageBytesHex(hex_encode(ciphertext.serialize()));
    }

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
        setVetkeyBytesHex(hex_encode(vetKey.serialize()));
    }

    async function decrypt(messageBytesHex: string, keyBytesHex: string) {
        const encryptedMessageBytes = hex_decode(messageBytesHex);
        const ibeCiphertext = IbeCiphertext.deserialize(encryptedMessageBytes);
        const vetKey = VetKey.deserialize(hex_decode(keyBytesHex));
        const decryptedMessageBytes = ibeCiphertext.decrypt(vetKey);
        setDecryptedMessage(new TextDecoder().decode(decryptedMessageBytes));
    }

    return (
        <main>
            <div>Identity: 2vxsx-fae</div>

            <div>
                <h3>1.1 Pubkey</h3>
                <p>– Fetch the canister public key from the backend.</p>
                <button onClick={requestPubKey}>Request pubkey</button>
                <p>Pubkey: <b>{publicKeyBytesHex}</b></p>
            </div>

            <div>
            <h3>2.1 Encryption</h3>
                <p>– Encrypt a message for a recipient with canister public key.</p>
                <label>Message to encrypt:</label><input type="text" placeholder="(plain text)" ref={messageToEncryptRef}/>
                <label>Recipient's principal:</label><input type="text" placeholder="(plain text)" ref={recipientRef}/>
                <label>Public key:</label><input type="text" placeholder="(bytes to hex format)" ref={pubKeyBytesHexRef}/>
                <button onClick={() => encrypt(messageToEncryptRef.current!.value, recipientRef.current!.value, pubKeyBytesHexRef.current!.value)}>Encrypt</button>
                <p>Encrypted message: <b>{encryptedMessageBytesHex}</b></p>
            </div>

            <br/><div>--------------------------------------------------------------------------------------------------------------------------------------------</div><br/>
            
            <div>
                <h3>2.1 Vetkey</h3>
                <p>– Fetch personal vetkey from the backend.</p>
                <button onClick={requestVetkey}>Request vetkey</button>
                <p>vetkey: <b>{vetkeyBytesHex}</b></p>
            </div>

            <div>
                <h3>2.2 Decryption</h3>
                <p>– Decrypt an encrypted message with personal  vetkey.</p>
                <label>Message to decrypt:</label><input type="text" placeholder="(bytes to hex format)" ref={messageToDecryptBytesHexRef}/>
                <label>Vetkey:</label><input type="text" placeholder="(bytes to hex format)" ref={vetKeyBytesHexRef}/>
                <button onClick={() => decrypt(messageToDecryptBytesHexRef.current!.value, vetKeyBytesHexRef.current!.value)}>Decrypt</button>
                <p>Decrypted message: <b>{decryptedMessage}</b></p>
            </div>
        </main>
    );
}

export default Ibe;
