use assemble_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn create_commitment(commitment: Commitment) -> ExternResult<Record> {
    let commitment_hash = create_entry(&EntryTypes::Commitment(commitment.clone()))?;
    create_link(
        commitment.call_to_action_hash.clone(),
        commitment_hash.clone(),
        LinkTypes::CallToActionToCommitments,
        (),
    )?;

    let record = get(commitment_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Commitment"))
    ))?;
    Ok(record)
}

#[hdk_extern]
pub fn get_commitment(commitment_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(commitment_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_commitments_for_call_to_action(
    call_to_action_hash: ActionHash,
) -> ExternResult<Vec<Link>> {
    get_links(
GetLinksInputBuilder::try_new(        call_to_action_hash,
        LinkTypes::CallToActionToCommitments,)?.build()
    )
}
