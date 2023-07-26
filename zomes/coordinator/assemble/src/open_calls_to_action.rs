use assemble_integrity::*;
use hdk::prelude::*;
pub fn open_calls_to_action_path() -> Path {
    Path::from("open_calls_to_action")
}
#[hdk_extern]
pub fn get_open_calls_to_action(_: ()) -> ExternResult<Vec<ActionHash>> {
    let path = open_calls_to_action_path();
    let links = get_links(path.path_entry_hash()?, LinkTypes::OpenCallsToAction, None)?;
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();
    Ok(hashes)
}
#[hdk_extern]
pub fn close_call_to_action(call_to_action_hash: ActionHash) -> ExternResult<()> {
    let path = open_calls_to_action_path();
    let links = get_links(path.path_entry_hash()?, LinkTypes::OpenCallsToAction, None)?;
    for link in links {
        let action_hash = ActionHash::try_from(link.target.clone())
            .map_err(|e| wasm_error!(WasmErrorInner::from(e)))?;
        if action_hash.eq(&call_to_action_hash) {
            delete_link(link.create_link_hash)?;
        }
    }
    Ok(())
}
