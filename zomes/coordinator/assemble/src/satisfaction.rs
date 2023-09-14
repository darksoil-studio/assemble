use assemble_integrity::*;
use hdk::prelude::*;
#[hdk_extern]
pub fn create_satisfaction(satisfaction: Satisfaction) -> ExternResult<Record> {
    let satisfaction_hash = create_entry(&EntryTypes::Satisfaction(satisfaction.clone()))?;
    create_link(
        satisfaction.call_to_action_hash.clone(),
        satisfaction_hash.clone(),
        LinkTypes::CallToActionToSatisfactions,
        (),
    )?;
    for base in satisfaction.commitments_hashes.clone() {
        create_link(
            base,
            satisfaction_hash.clone(),
            LinkTypes::CommitmentToSatisfactions,
            (),
        )?;
    }
    let record = get(satisfaction_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from(
            "Could not find the newly created Satisfaction"
        ))
    ))?;
    Ok(record)
}
#[hdk_extern]
pub fn get_satisfaction(original_satisfaction_hash: ActionHash) -> ExternResult<Option<Record>> {
    get_latest_satisfaction(original_satisfaction_hash)
}
fn get_latest_satisfaction(satisfaction_hash: ActionHash) -> ExternResult<Option<Record>> {
    let details = get_details(satisfaction_hash, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Satisfaction not found".into())
    ))?;
    let record_details = match details {
        Details::Entry(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed details".into()
        ))),
        Details::Record(record_details) => Ok(record_details),
    }?;
    if record_details.deletes.len() > 0 {
        return Ok(None);
    }
    match record_details.updates.last() {
        Some(update) => get_latest_satisfaction(update.action_address().clone()),
        None => Ok(Some(record_details.record)),
    }
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateSatisfactionInput {
    pub previous_satisfaction_hash: ActionHash,
    pub updated_satisfaction: Satisfaction,
}
#[hdk_extern]
pub fn update_satisfaction(input: UpdateSatisfactionInput) -> ExternResult<Record> {
    let updated_satisfaction_hash = update_entry(
        input.previous_satisfaction_hash,
        &input.updated_satisfaction,
    )?;
    let record = get(updated_satisfaction_hash.clone(), GetOptions::default())?.ok_or(
        wasm_error!(WasmErrorInner::Guest(String::from(
            "Could not find the newly updated Satisfaction"
        ))),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_satisfactions_for_call_to_action(
    call_to_action_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(
        call_to_action_hash,
        LinkTypes::CallToActionToSatisfactions,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .filter_map(|link| link.target.into_any_dht_hash())
        .map(|target| GetInput::new(target, GetOptions::default()))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
#[hdk_extern]
pub fn get_satisfactions_for_commitment(commitment_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(commitment_hash, LinkTypes::CommitmentToSatisfactions, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .filter_map(|link| link.target.into_any_dht_hash())
        .map(|target| GetInput::new(target, GetOptions::default()))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
