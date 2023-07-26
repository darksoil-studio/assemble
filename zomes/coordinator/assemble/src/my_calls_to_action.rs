use assemble_integrity::*;
use hdk::prelude::*;

// My calls to action: Calls to action that either you have created, or have contributed to

#[hdk_extern]
pub fn get_my_calls_to_action(_: ()) -> ExternResult<Vec<ActionHash>> {
    let agent_info = agent_info()?;

    let links = get_links(
        agent_info.agent_latest_pubkey,
        LinkTypes::MyCallsToAction,
        None,
    )?;
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();
    Ok(hashes)
}

pub fn add_to_my_calls_to_action(call_to_action_hash: ActionHash) -> ExternResult<()> {
    let agent_info = agent_info()?;
    let my_pub_key = agent_info.agent_latest_pubkey;

    let links = get_links(my_pub_key.clone(), LinkTypes::MyCallsToAction, None)?;
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();
    if let None = hashes.into_iter().find(|h| h.eq(&call_to_action_hash)) {
        create_link(
            my_pub_key,
            call_to_action_hash,
            LinkTypes::MyCallsToAction,
            (),
        )?;
    }

    Ok(())
}

#[hdk_extern]
pub fn clear_calls_to_action(calls_to_action_hashes: Vec<ActionHash>) -> ExternResult<()> {
    let agent_info = agent_info()?;
    let my_pub_key = agent_info.agent_latest_pubkey;

    let links = get_links(my_pub_key, LinkTypes::MyCallsToAction, None)?;

    for link in links {
        let action_hash = ActionHash::try_from(link.target.clone())
            .map_err(|e| wasm_error!(WasmErrorInner::from(e)))?;
        if let Some(_) = calls_to_action_hashes
            .iter()
            .find(|hash| action_hash.eq(hash))
        {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}
