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
pub fn get_latest_satisfaction(satisfaction_hash: ActionHash) -> ExternResult<Record> {
    let details = get_details(satisfaction_hash, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Satisfaction not found".into())
    ))?;
    let record_details = match details {
        Details::Entry(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed details".into()
        ))),
        Details::Record(record_details) => Ok(record_details),
    }?;
    match record_details.updates.last() {
        Some(update) => get_latest_satisfaction(update.action_address().clone()),
        None => Ok(record_details.record),
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
pub fn delete_satisfaction(satisfaction_hash: ActionHash) -> ExternResult<()> {
    let satisfaction_record = get_latest_satisfaction(satisfaction_hash.clone())?;
    let satisfaction = Satisfaction::try_from(satisfaction_record.entry().as_option().ok_or(
        wasm_error!(WasmErrorInner::Guest("Could not find satisfaction".into())),
    )?)?;

    let links = get_links(
        GetLinksInputBuilder::try_new(
            satisfaction.call_to_action_hash,
            LinkTypes::CallToActionToSatisfactions,
        )?
        .build(),
    )?;

    for link in links {
        if let Some(target) = link.target.into_action_hash() {
            if target.eq(&satisfaction_hash) {
                delete_link(link.create_link_hash)?;
            }
        }
    }

    for commitment_hash in satisfaction.commitments_hashes {
        let links = get_links(
            GetLinksInputBuilder::try_new(commitment_hash, LinkTypes::CommitmentToSatisfactions)?
                .build(),
        )?;
        for link in links {
            if let Some(target) = link.target.into_action_hash() {
                if target.eq(&satisfaction_hash) {
                    delete_link(link.create_link_hash)?;
                }
            }
        }
    }

    // delete_entry(satisfaction_hash)?;

    Ok(())
}

#[hdk_extern]
pub fn get_satisfactions_for_call_to_action(
    call_to_action_hash: ActionHash,
) -> ExternResult<Vec<Link>> {
    get_links(
        GetLinksInputBuilder::try_new(call_to_action_hash, LinkTypes::CallToActionToSatisfactions)?
            .build(),
    )
}

#[hdk_extern]
pub fn get_satisfactions_for_commitment(commitment_hash: ActionHash) -> ExternResult<Vec<Link>> {
    get_links(
        GetLinksInputBuilder::try_new(commitment_hash, LinkTypes::CommitmentToSatisfactions)?
            .build(),
    )
}

#[hdk_extern]
pub fn get_satisfaction_deletes(
    satisfaction_hash: ActionHash,
) -> ExternResult<Vec<SignedActionHashed>> {
    let details = get_details(satisfaction_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("NOT_FOUND".into())))?;
    let record_details = match details {
        Details::Entry(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed details".into()
        ))),
        Details::Record(record_details) => Ok(record_details),
    }?;
    Ok(record_details.deletes)
}
