use candid::Principal;
use ic_cdk::management_canister::{VetKDCurve, VetKDDeriveKeyArgs, VetKDKeyId, VetKDPublicKeyArgs};
use ic_cdk::{query, update};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;

mod nft;
use crate::nft::Nft;

// The state of the canister.
#[derive(Serialize, Deserialize, Clone)]
struct State {
    // Data that lives on the heap.
    // This is an example for data that would need to be serialized/deserialized on every upgrade for it to be persisted
    nft_collection: Vec<Nft>,
}

impl State {
    fn new() -> Self {
        let item1 = Nft {
            id: "abc".to_string(),
            owner: ic_cdk::api::canister_self(),
            authorized_principals: vec![],
            encrypted_content: None,
        };

        Self {
            nft_collection: vec![item1],
        }
    }
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::new());
}

const DOMAIN_SEPARATOR: &str = "vetkeys-example";

#[update]
async fn own_nft_by_id(nft_id: String) -> String {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        match Nft::get_nft_mut(&mut state.nft_collection, &nft_id) {
            Some(nft) => {
                nft.owner = ic_cdk::api::msg_caller();
                nft.to_string()
            }
            None => format!("Error: no NFT with id {}", nft_id),
        }
    })
}

#[update]
async fn vetkd_personal_vetkey(transport_public_key: Vec<u8>) -> Vec<u8> {
    debug_println_caller("vetkd_personal_vetkey");

    let caller = ic_cdk::api::msg_caller();
    let request = VetKDDeriveKeyArgs {
        input: caller.as_ref().to_vec(),
        context: DOMAIN_SEPARATOR.as_bytes().to_vec(),
        transport_public_key,
        key_id: bls12_381_g2_test_key(),
    };

    let reply = ic_cdk::management_canister::vetkd_derive_key(&request)
        .await
        .expect("failed to derive key");
    reply.encrypted_key
}

#[update]
async fn vetkd_nft_vetkey(nft_id: &str, transport_public_key: Vec<u8>) -> Vec<u8> {
    debug_println_caller("vetkd_nft_vetkey");
    if let Err(err) = ensure_caller_is_nft_owner(nft_id) {
        panic!("Fatal error: {err}");
    }

    let request = VetKDDeriveKeyArgs {
        input: nft_id.bytes().collect(),
        context: DOMAIN_SEPARATOR.as_bytes().to_vec(),
        transport_public_key,
        key_id: bls12_381_g2_test_key(),
    };

    let reply = ic_cdk::management_canister::vetkd_derive_key(&request)
        .await
        .expect("failed to derive key");
    reply.encrypted_key
}

#[update]
async fn vetkd_public_key() -> Vec<u8> {
    debug_println_caller("vetkd_public_key");

    let request = VetKDPublicKeyArgs {
        canister_id: None,
        context: DOMAIN_SEPARATOR.as_bytes().to_vec(),
        key_id: bls12_381_g2_test_key(),
    };

    let reply = ic_cdk::management_canister::vetkd_public_key(&request)
        .await
        .expect("failed to derive key");
    reply.public_key
}

#[update]
async fn update_nft(
    nft_id: &str,
    nft_content_encrypted_bytes_hex: &str,
    authorized_principals: Vec<&str>,
) -> String {
    debug_println_caller("update_nft");
    if let Err(err) = ensure_caller_is_nft_owner(nft_id) {
        return err;
    }

    let authorized_principals: Vec<Principal> = if !authorized_principals.is_empty() {
        match authorized_principals
            .into_iter()
            .map(string_into_principal)
            .collect()
        {
            Ok(v) => v,
            Err(err) => return format!("Error: {}", err),
        }
    } else {
        vec![]
    };

    STATE.with(|s| {
        let mut state = s.borrow_mut();
        match Nft::get_nft_mut(&mut state.nft_collection, nft_id) {
            Some(nft) => {
                nft.encrypted_content = Some(nft_content_encrypted_bytes_hex.to_string());
                nft.authorized_principals = authorized_principals;
                nft.to_string()
            }
            None => format!("Error: no NFT with id {}", nft_id),
        }
    })
}

#[query]
fn get_nft(nft_id: &str) -> String {
    debug_println_caller("get_nft");

    if let Err(err) = ensure_caller_is_nft_owner(nft_id) {
        return err;
    }

    STATE.with(|s| {
        let state = s.borrow();
        match Nft::get_nft(&state.nft_collection, nft_id) {
            Some(nft) => nft.to_string(),
            None => format!("Error: no NFT with id {}", nft_id),
        }
    })
}

fn bls12_381_g2_test_key() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381_G2,
        name: "test_key_1".to_string(),
    }
}

fn debug_println_caller(method_name: &str) {
    ic_cdk::println!(
        "{}: caller: {} (isAnonymous: {})",
        method_name,
        ic_cdk::api::msg_caller().to_text(),
        ic_cdk::api::msg_caller() == Principal::anonymous()
    );
}

fn ensure_caller_is_nft_owner(nft_id: &str) -> Result<(), String> {
    let caller = ic_cdk::api::msg_caller().to_text();

    STATE.with(|s| {
        let state = s.borrow();
        match Nft::get_nft(&state.nft_collection, nft_id) {
            Some(nft) => {
                if nft.owner.to_text() != caller {
                    return Err("Error: unauthorized".to_string());
                }
                Ok(())
            }
            None => Err(format!("Error: no NFT with id {}", nft_id)),
        }
    })
}

fn string_into_principal(s: &str) -> Result<Principal, String> {
    Principal::from_text(s).map_err(|e| format!("invalid principal '{}': {e}", s))
}

ic_cdk::export_candid!();
