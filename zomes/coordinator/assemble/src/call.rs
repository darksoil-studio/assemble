use hdk::prelude::*;
use assemble_integrity::*;
#[hdk_extern]
pub fn create_call(call: Call) -> ExternResult<Record> {
    let call_hash = create_entry(&EntryTypes::Call(call.clone()))?;
    if let Some(base) = call.parent_call_hash.clone() {
        create_link(base, call_hash.clone(), LinkTypes::CallToCalls, ())?;
    }
    let record = get(call_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Call"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_call(original_call_hash: ActionHash) -> ExternResult<Option<Record>> {
    get_latest_call(original_call_hash)
}
fn get_latest_call(call_hash: ActionHash) -> ExternResult<Option<Record>> {
    let details = get_details(call_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Call not found".into())))?;
    let record_details = match details {
        Details::Entry(_) => {
            Err(wasm_error!(WasmErrorInner::Guest("Malformed details".into())))
        }
        Details::Record(record_details) => Ok(record_details),
    }?;
    if record_details.deletes.len() > 0 {
        return Ok(None);
    }
    match record_details.updates.last() {
        Some(update) => get_latest_call(update.action_address().clone()),
        None => Ok(Some(record_details.record)),
    }
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateCallInput {
    pub previous_call_hash: ActionHash,
    pub updated_call: Call,
}
#[hdk_extern]
pub fn update_call(input: UpdateCallInput) -> ExternResult<Record> {
    let updated_call_hash = update_entry(input.previous_call_hash, &input.updated_call)?;
    let record = get(updated_call_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Call"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_call(original_call_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_call_hash)
}
#[hdk_extern]
pub fn get_calls_for_call(call_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(call_hash, LinkTypes::CallToCalls, None)?;
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
