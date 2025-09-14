use candid::Principal;
use ic_cdk::management_canister::{VetKDCurve, VetKDDeriveKeyArgs, VetKDKeyId, VetKDPublicKeyArgs};
use ic_cdk::{query, update};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, Storable,
};
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

const DOMAIN_SEPARATOR: &str = "vetkeys-example";

// To store global state in a Rust canister, we use the `thread_local!` macro.
thread_local! {
    // The memory manager is used for simulating multiple memories. Given a `MemoryId` it can
    // return a memory that can be used by stable structures.
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    // We store the greeting in a `Cell` in stable memory such that it gets persisted over canister upgrades.
    static GREETING: RefCell<ic_stable_structures::Cell<String, Memory>> = RefCell::new(
        ic_stable_structures::Cell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))), "Hello, ".to_string()
        )
    );
}

// This update method stores the greeting prefix in stable memory.
#[update]
fn set_greeting(prefix: String) {
    GREETING.with_borrow_mut(|greeting| {
        greeting.set(prefix);
    });
}

// This query method returns the currently persisted greeting with the given name.
#[query]
fn greet(name: String) -> String {
    let greeting = GREETING.with_borrow(|greeting| greeting.get().clone());
    format!("{greeting}{name}!")
}

/// Derive encrypted vetKey for caller's principal.
#[update]
async fn vetkd_derive_ibe_key(transport_public_key: Vec<u8>) -> Vec<u8> {
    let caller = ic_cdk::api::msg_caller();
    debug_println_caller("get_my_encrypted_ibe_key");
    ic_cdk::println!("{:?}", caller.to_text());
    ic_cdk::println!("{:?}", caller.to_bytes());

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
async fn vetkd_public_key() -> Vec<u8> {
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

// Export the interface for the smart contract.
ic_cdk::export_candid!();
