use hdk::prelude::*;
use assemble_integrity::*;
#[hdk_extern]
pub fn create_collective_commitment(
    collective_commitment: CollectiveCommitment,
) -> ExternResult<Record> {
    let collective_commitment_hash = create_entry(
        &EntryTypes::CollectiveCommitment(collective_commitment.clone()),
    )?;
    create_link(
        collective_commitment.call_hash.clone(),
        collective_commitment_hash.clone(),
        LinkTypes::CallToCollectiveCommitments,
        (),
    )?;
    for base in collective_commitment.satisfactions_hashes.clone() {
        create_link(
            base,
            collective_commitment_hash.clone(),
            LinkTypes::SatisfactionToCollectiveCommitments,
            (),
        )?;
    }
    let record = get(collective_commitment_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created CollectiveCommitment"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_collective_commitment(
    collective_commitment_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    get(collective_commitment_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_collective_commitments_for_call(
    call_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(call_hash, LinkTypes::CallToCollectiveCommitments, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
#[hdk_extern]
pub fn get_collective_commitments_for_satisfaction(
    satisfaction_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(
        satisfaction_hash,
        LinkTypes::SatisfactionToCollectiveCommitments,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
