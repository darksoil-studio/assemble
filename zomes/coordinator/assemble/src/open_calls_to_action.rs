use assemble_integrity::*;
use hdk::prelude::*;
fn open_calls_to_action_path() -> Path {
    Path::from("open_calls_to_action")
}
#[hdk_extern]
pub fn get_open_calls_to_action(_: ()) -> ExternResult<Vec<Record>> {
    let path = open_calls_to_action_path();
    let links = get_links(path.path_entry_hash()?, LinkTypes::OpenCallsToAction, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    Ok(records)
}
#[hdk_extern]
pub fn close_call_to_action(call_to_action_hash: ActionHash) -> ExternResult<()> {
    let path = open_calls_to_action_path();
    let links = get_links(path.path_entry_hash()?, LinkTypes::OpenCallsToAction, None)?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&call_to_action_hash) {
            delete_link(link.create_link_hash)?;
        }
    }
    Ok(())
}
