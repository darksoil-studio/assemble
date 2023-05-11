use assemble_integrity::*;
use hdk::prelude::*;

use crate::my_calls_to_action::add_to_my_calls_to_action;

#[hdk_extern]
pub fn create_commitment(commitment: Commitment) -> ExternResult<Record> {
    let commitment_hash = create_entry(&EntryTypes::Commitment(commitment.clone()))?;
    create_link(
        commitment.call_to_action_hash.clone(),
        commitment_hash.clone(),
        LinkTypes::CallToActionToCommitments,
        (),
    )?;

    add_to_my_calls_to_action(commitment.call_to_action_hash.clone())?;

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
) -> ExternResult<Vec<Record>> {
    let links = get_links(
        call_to_action_hash,
        LinkTypes::CallToActionToCommitments,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(ActionHash::from(link.target).into(), GetOptions::default()))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
