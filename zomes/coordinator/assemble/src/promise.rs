use hdk::prelude::*;
use assemble_integrity::*;
#[hdk_extern]
pub fn create_promise(promise: Promise) -> ExternResult<Record> {
    let promise_hash = create_entry(&EntryTypes::Promise(promise.clone()))?;
    create_link(
        promise.call_hash.clone(),
        promise_hash.clone(),
        LinkTypes::CallToPromises,
        (),
    )?;
    let record = get(promise_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Promise"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_promise(promise_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(promise_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_promises_for_call(call_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(call_hash, LinkTypes::CallToPromises, None)?;
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
