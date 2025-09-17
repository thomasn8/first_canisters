import { useRef, useState } from "react";
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
import { useIdentity } from "../IdentityProvider";
import { LoginLogout } from "../components/LoginLogout";

interface Nft {
    id: string,
    owner: string,
    authorized_principals: string,
    encrypted_content: string,
}

function Nft() {
    const { state } = useIdentity();

    const [nft, setNft] = useState<string | Nft>('[...]');
    const [publicKeyBytesHex, setPublicKeyBytesHex] = useState('[...]');
    const [encryptedContentBytesHex, setEncryptedContentBytesHex] = useState('[...]');
    const [postResponse, setPostResponse] = useState('[...]');
    const [vetkeyBytesHex, setVetkeyBytesHex] = useState('[...]');
    const [decryptedMessage, setDecryptedMessage] = useState('[...]');
    
    function resetAll() {
        setPublicKeyBytesHex("[...]");
        setEncryptedContentBytesHex("[...]");
        setPostResponse("[...]");
        setVetkeyBytesHex("[...]");
        setDecryptedMessage("[...]");
    }

    const contentToEncryptRef = useRef<HTMLTextAreaElement | null>(null);
    const authorizedPrincipalsRef = useRef<HTMLTextAreaElement | null>(null);
    const pubKeyBytesHexRef = useRef<HTMLInputElement | null>(null);
    const encryptedContentBytesHexRef = useRef<HTMLInputElement | null>(null);
    const messageToDecryptBytesHexRef = useRef<HTMLInputElement | null>(null);
    const vetKeyBytesHexRef = useRef<HTMLInputElement | null>(null);
    const nftIdToDecryptRef = useRef<HTMLInputElement | null>(null);
  
    async function ownNft(nftId: string) {
        if (!state.isAuthenticated) {
            setNft("Error: Login first");
            throw Error("Must be logged-in to own a NFT");
        }
        const response = await state.actor.own_nft_by_id(nftId);
        let nft = JSON.parse(response) as Nft;
        setNft(nft);
    }

    async function requestPubKey() {
        const pubKeyBytes = await state.actor.vetkd_public_key() as Uint8Array<ArrayBufferLike>;
        setPublicKeyBytesHex(hex_encode(pubKeyBytes));
    }
    
    async function encrypt(message: string, nftId: string, keyBytesHex: string) {
        const derivedPublicKey = DerivedPublicKey.deserialize(hex_decode(keyBytesHex));
        const ciphertext = IbeCiphertext.encrypt(
            derivedPublicKey,
            IbeIdentity.fromString(nftId),
            new TextEncoder().encode(message),
            IbeSeed.random(),
        );
        setEncryptedContentBytesHex(hex_encode(ciphertext.serialize()));
    }

    async function postNftContent(nftId: string, encryptedContentBytesHex: string, authorizedPrincipalsString: string) {
        let authorizedPrincipals: string[] = Array.from(new Set(authorizedPrincipalsString.split("\n").map((principal) => 
            principal.replaceAll(",", "").replaceAll(";", "")))).filter(principal => principal !== "");
        const response = await state.actor.update_nft(nftId, encryptedContentBytesHex, authorizedPrincipals);
        console.log(authorizedPrincipals);
        setPostResponse(response);
    }

    async function requestVetkey(nftId: string) {
        // transport key
        const transportSecretKey = TransportSecretKey.random();
        const tpk = transportSecretKey.publicKeyBytes();

        // get pub key
        const publicKeyBytes = await state.actor.vetkd_public_key() as Uint8Array<ArrayBufferLike>;
        const derivedPublicKey = DerivedPublicKey.deserialize(publicKeyBytes);

        // get NFT specific vetkey
        const encryptedVetKeyBytes = await state.actor.vetkd_nft_vetkey("abc", tpk) as Uint8Array<ArrayBufferLike>;
        const encryptedVetKey = EncryptedVetKey.deserialize(encryptedVetKeyBytes);

        // verify + decrypt vetkey
        const vetKey = encryptedVetKey.decryptAndVerify(transportSecretKey, derivedPublicKey, new TextEncoder().encode(nftId));
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
            <LoginLogout resetAll={resetAll}/>

            <h1>Encrypt the content of the NFT to allow access to specific identifiers</h1>

            <div className="cols">

                <div className="col-50">
                    <h2>Client 1</h2>

                    <div>
                        <h3>1.1 NFT</h3>
                        <p>– Own a NFT.</p>
                        <button onClick={() => ownNft("abc")}>Give me a NFT</button><p>Nft: <b>{JSON.stringify(nft)}</b></p>
                    </div>

                    <div>
                        <h3>1.2 Pubkey</h3>
                        <p>– Fetch the canister public key from the backend.</p>
                        <button onClick={requestPubKey}>Request pubkey</button>
                        <p>Pubkey: <b>{publicKeyBytesHex}</b></p>
                    </div>

                    <div>
                        <h3>1.3 Encryption</h3>
                        <p>– Encrypt your NFT content with canister public key and IBE (based on NFT id).</p>
                        <label>NFT content to encrypt:</label><textarea placeholder="(plain text)" ref={contentToEncryptRef}/>
                        <label>Public key:</label><input type="text" placeholder="(bytes to hex format)" ref={pubKeyBytesHexRef}/>
                        <button onClick={() => encrypt(contentToEncryptRef.current!.value, (nft as Nft).id, pubKeyBytesHexRef.current!.value)}>Encrypt</button>
                        <p>Encrypted content: <b>{encryptedContentBytesHex}</b></p>
                    </div>

                    <div>
                        <h3>1.4 Give access and save onchain</h3>
                        <p>– Post your NFT with encrypted content and set decryption access to a list of principals.</p>
                        <label>NFT content encrypted:</label><input type="text" placeholder="(bytes to hex format)" ref={encryptedContentBytesHexRef}/>
                        <label>Principals to give content access:</label><textarea style={{width: "400px"}} placeholder="(plain text, separate principals with newlines)" ref={authorizedPrincipalsRef}/>
                        <button onClick={() => postNftContent((nft as Nft).id, encryptedContentBytesHexRef.current!.value, authorizedPrincipalsRef.current!.value)}>Post</button>
                        <p>Response: <b>{postResponse}</b></p>
                    </div>
                </div>

                <div className="client-2 col-50">
                    <h2>Client 2</h2>

                    <div>
                        <h3>2.1 Vetkey</h3>
                        <p>– Fetch vetkey for a specific NFT from the backend.</p>
                        <label>NFT ID:</label><input type="text" placeholder="(plain text)" ref={nftIdToDecryptRef}/>
                        <button onClick={() => requestVetkey(nftIdToDecryptRef.current!.value)}>Request vetkey</button>
                        <p>vetkey: <b>{vetkeyBytesHex}</b></p>
                    </div>

                    <div>
                        <h3>2.2 Decryption</h3>
                        <p>– Decrypt an encrypted message (IBE ciphertext) with the corresponding personal vetkey.</p>
                        <label>Message to decrypt:</label><input type="text" placeholder="(bytes to hex format)" ref={messageToDecryptBytesHexRef}/>
                        <label>vetkey:</label><input type="text" placeholder="(bytes to hex format)" ref={vetKeyBytesHexRef}/>
                        <button onClick={() => decrypt(messageToDecryptBytesHexRef.current!.value, vetKeyBytesHexRef.current!.value)}>Decrypt</button>
                        <p>Decrypted message: <b>{decryptedMessage}</b></p>
                    </div>
                </div>
            
            </div>
        </main>
    );
}

export default Nft;
