use candid::Principal;
use serde::{Deserialize, Serialize};
use std::fmt;

// TODO: export types
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Nft {
    pub id: String,
    pub owner: Principal,
    pub authorized_principals: Vec<Principal>,
    pub encrypted_content: Option<String>,
}

impl Nft {
    pub fn get_nft<'a>(nft_collection: &'a [Nft], id: &str) -> Option<&'a Nft> {
        nft_collection.iter().find(|n| n.id == id)
    }

    pub fn get_nft_mut<'a>(nft_collection: &'a mut [Nft], id: &str) -> Option<&'a mut Nft> {
        nft_collection.iter_mut().find(|n| n.id == id)
    }
}

impl fmt::Display for Nft {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{{ \"id\": \"{}\", \"owner\": \"{}\", \"authorized_principals\": {:?}, \"encrypted_content\": \"{}\" }}",
            self.id,
            self.owner.to_text(),
            self.authorized_principals
                .iter()
                .map(|p| p.to_text())
                .collect::<Vec<String>>(),
            self.encrypted_content.as_deref().unwrap_or("")
        )
    }
}
