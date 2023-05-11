use assemble_integrity::*;
use hdk::prelude::*;

use crate::my_calls_to_action::add_to_my_calls_to_action;

#[hdk_extern]
pub fn create_call_to_action(call_to_action: CallToAction) -> ExternResult<Record> {
    let call_to_action_hash = create_entry(&EntryTypes::CallToAction(call_to_action.clone()))?;
    if let Some(base) = call_to_action.parent_call_to_action_hash.clone() {
        create_link(
            base,
            call_to_action_hash.clone(),
            LinkTypes::CallToActionToCallToActions,
            (),
        )?;
    }
    let record = get(call_to_action_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from(
            "Could not find the newly created CallToAction"
        ))
    ))?;

    let path = Path::from("open_calls_to_action");
    create_link(
        path.path_entry_hash()?,
        call_to_action_hash.clone(),
        LinkTypes::OpenCallsToAction,
        (),
    )?;

    add_to_my_calls_to_action(call_to_action_hash.clone())?;

    Ok(record)
}
#[hdk_extern]
pub fn get_call_to_action(
    original_call_to_action_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    get_latest_call_to_action(original_call_to_action_hash)
}
fn get_latest_call_to_action(call_to_action_hash: ActionHash) -> ExternResult<Option<Record>> {
    let details = get_details(call_to_action_hash, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("CallToAction not found".into())
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
        Some(update) => get_latest_call_to_action(update.action_address().clone()),
        None => Ok(Some(record_details.record)),
    }
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateCallToActionInput {
    pub previous_call_to_action_hash: ActionHash,
    pub updated_call_to_action: CallToAction,
}
#[hdk_extern]
pub fn update_call_to_action(input: UpdateCallToActionInput) -> ExternResult<Record> {
    let updated_call_to_action_hash = update_entry(
        input.previous_call_to_action_hash,
        &input.updated_call_to_action,
    )?;
    let record = get(updated_call_to_action_hash.clone(), GetOptions::default())?.ok_or(
        wasm_error!(WasmErrorInner::Guest(String::from(
            "Could not find the newly updated CallToAction"
        ))),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_call_to_action(original_call_to_action_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_call_to_action_hash)
}
#[hdk_extern]
pub fn get_call_to_actions_for_call_to_action(
    call_to_action_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(
        call_to_action_hash,
        LinkTypes::CallToActionToCallToActions,
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
