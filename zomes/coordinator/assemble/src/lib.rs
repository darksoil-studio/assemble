pub mod assembly;
pub mod call_to_action;
pub mod commitment;
pub mod satisfaction;
use assemble_integrity::*;
use call_to_action::get_call_to_action;
use commitment::{get_commitment, get_commitments_for_call_to_action};
use hdk::prelude::*;
use satisfaction::{get_satisfaction, get_satisfactions_for_call_to_action};
#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Signal {
    LinkCreated {
        action: SignedActionHashed,
        link_type: LinkTypes,
    },
    LinkDeleted {
        action: SignedActionHashed,
        link_type: LinkTypes,
    },
    EntryCreated {
        action: SignedActionHashed,
        app_entry: EntryTypes,
    },
    EntryUpdated {
        action: SignedActionHashed,
        app_entry: EntryTypes,
        original_app_entry: EntryTypes,
    },
    EntryDeleted {
        action: SignedActionHashed,
        original_app_entry: EntryTypes,
    },
}
#[hdk_extern(infallible)]
pub fn post_commit(committed_actions: Vec<SignedActionHashed>) {
    for action in committed_actions {
        if let Err(err) = signal_action(action) {
            error!("Error signaling new action: {:?}", err);
        }
    }
}

fn check_if_need_is_satisfied(action_hash: ActionHash, commitment: Commitment) -> ExternResult<()> {
    let call_to_action_record =
        get_call_to_action(commitment.call_to_action_hash.clone())?.ok_or(wasm_error!(
            WasmErrorInner::Guest("Could not find call to action for this commitment".into())
        ))?;
    let call_to_action = CallToAction::try_from(call_to_action_record.entry().as_option().ok_or(
        wasm_error!(WasmErrorInner::Guest(
            "CallToAction record has no entry".into()
        )),
    )?)?;

    if call_to_action.needs[commitment.need_index as usize].requires_admin_approval {
        return Ok(());
    }

    let satisfaction_hashes =
        get_satisfactions_for_call_to_action(commitment.call_to_action_hash.clone())?;
    let need_is_already_satisfied = satisfaction_hashes
        .clone()
        .into_iter()
        .map(|hash| get_satisfaction(hash))
        .collect::<ExternResult<Vec<Option<Record>>>>()?
        .into_iter()
        .filter_map(|o| o)
        .map(|record| Satisfaction::try_from(record))
        .collect::<ExternResult<Vec<Satisfaction>>>()?
        .into_iter()
        .find(|s| s.need_index == commitment.need_index);

    if need_is_already_satisfied.is_some() {
        return Ok(());
    }

    let commitments_hashes = get_commitments_for_call_to_action(commitment.call_to_action_hash)?;
    let mut set: HashSet<ActionHash> = HashSet::from_iter(commitments_hashes);
    set.insert(action_hash);

    let commitments_hashes: Vec<ActionHash> = set.into_iter().collect();
    let amount_contributed = commitments_hashes
        .clone()
        .into_iter()
        .map(|hash| get_commitment(hash))
        .collect::<ExternResult<Vec<Option<Record>>>>()?
        .into_iter()
        .filter_map(|c| c)
        .map(|record| Commitment::try_from(record))
        .collect::<ExternResult<Vec<Commitment>>>()?
        .into_iter()
        .filter(|c| c.need_index == commitment.need_index)
        .fold(0, |acc, next| acc + next.amount);

    let min_necessary = call_to_action.needs[commitment.need_index as usize].min_necessary;

    if min_necessary > 0 && amount_contributed >= min_necessary {
        let my_pub_key = agent_info()?.agent_latest_pubkey;
        let result = call_remote(
            my_pub_key,
            zome_info()?.name,
            FunctionName::from("create_satisfaction"),
            None,
            Satisfaction {
                call_to_action_hash: call_to_action_record.signed_action.hashed.hash.clone(),
                need_index: commitment.need_index,
                commitments_hashes,
            },
        )?;
        match result {
            ZomeCallResponse::Ok(_) => Ok(()),
            _ => Err(wasm_error!(WasmErrorInner::Guest(format!(
                "Error creating the satisfaction {:?}",
                result
            )))),
        }?;
    }

    Ok(())
}

fn check_if_call_to_action_is_fulfilled(
    action_hash: ActionHash,
    satisfaction: Satisfaction,
) -> ExternResult<()> {
    let call_to_action_record = get_call_to_action(satisfaction.call_to_action_hash.clone())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "Could not find call to action for this satisfaction".into()
        )))?;
    let call_to_action = CallToAction::try_from(call_to_action_record.entry().as_option().ok_or(
        wasm_error!(WasmErrorInner::Guest(
            "CallToAction record has no entry".into()
        )),
    )?)?;

    let satisfactions_hashes =
        get_satisfactions_for_call_to_action(satisfaction.call_to_action_hash)?;

    let mut set: HashSet<ActionHash> = HashSet::from_iter(satisfactions_hashes);
    set.insert(action_hash);
    let satisfactions_hashes: Vec<ActionHash> = set.into_iter().collect();

    let satisfactions = satisfactions_hashes
        .clone()
        .into_iter()
        .map(|hash| get_satisfaction(hash))
        .collect::<ExternResult<Vec<Option<Record>>>>()?
        .into_iter()
        .filter_map(|c| c)
        .map(|record| Satisfaction::try_from(record))
        .collect::<ExternResult<Vec<Satisfaction>>>()?;

    let are_all_needs_satisfied = (0..call_to_action.needs.len())
        .into_iter()
        .all(|need_index| {
            call_to_action.needs[need_index].min_necessary == 0
                || satisfactions
                    .iter()
                    .find(|s| s.need_index == need_index as u32)
                    .is_some()
        });

    if are_all_needs_satisfied {
        let my_pub_key = agent_info()?.agent_latest_pubkey;
        let result = call_remote(
            my_pub_key,
            zome_info()?.name,
            FunctionName::from("create_assembly"),
            None,
            Assembly {
                call_to_action_hash: call_to_action_record.signed_action.hashed.hash.clone(),
                satisfactions_hashes,
            },
        )?;
        match result {
            ZomeCallResponse::Ok(_) => Ok(()),
            _ => Err(wasm_error!(WasmErrorInner::Guest(format!(
                "Error creating the assembly {:?}",
                result
            )))),
        }?;
    }

    Ok(())
}

fn signal_action(action: SignedActionHashed) -> ExternResult<()> {
    match action.hashed.content.clone() {
        Action::CreateLink(create_link) => {
            if let Ok(Some(link_type)) =
                LinkTypes::from_type(create_link.zome_index, create_link.link_type)
            {
                emit_signal(Signal::LinkCreated { action, link_type })?;
            }
            Ok(())
        }
        Action::DeleteLink(delete_link) => {
            let record = get(delete_link.link_add_address.clone(), GetOptions::default())?.ok_or(
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to fetch CreateLink action".to_string()
                )),
            )?;
            match record.action() {
                Action::CreateLink(create_link) => {
                    if let Ok(Some(link_type)) =
                        LinkTypes::from_type(create_link.zome_index, create_link.link_type)
                    {
                        emit_signal(Signal::LinkDeleted { action, link_type })?;
                    }
                    Ok(())
                }
                _ => {
                    return Err(wasm_error!(WasmErrorInner::Guest(
                        "Create Link should exist".to_string()
                    )));
                }
            }
        }
        Action::Create(_create) => {
            if let Ok(Some(app_entry)) = get_entry_for_action(&action.hashed.hash) {
                match app_entry.clone() {
                    EntryTypes::Commitment(commitment) => {
                        if let Err(err) =
                            check_if_need_is_satisfied(action.hashed.hash.clone(), commitment)
                        {
                            error!("Error trying to satisfy a need {:?}", err);
                        }
                    }
                    EntryTypes::Satisfaction(satisfaction) => {
                        if let Err(err) = check_if_call_to_action_is_fulfilled(
                            action.hashed.hash.clone(),
                            satisfaction,
                        ) {
                            error!(
                                "Error trying to create an assembly from a call to action {:?}",
                                err
                            );
                        }
                    }
                    _ => {}
                }

                emit_signal(Signal::EntryCreated { action, app_entry })?;
            }
            Ok(())
        }
        Action::Update(update) => {
            if let Ok(Some(app_entry)) = get_entry_for_action(&action.hashed.hash) {
                if let Ok(Some(original_app_entry)) =
                    get_entry_for_action(&update.original_action_address)
                {
                    emit_signal(Signal::EntryUpdated {
                        action,
                        app_entry,
                        original_app_entry,
                    })?;
                }
            }
            Ok(())
        }
        Action::Delete(delete) => {
            if let Ok(Some(original_app_entry)) = get_entry_for_action(&delete.deletes_address) {
                emit_signal(Signal::EntryDeleted {
                    action,
                    original_app_entry,
                })?;
            }
            Ok(())
        }
        _ => Ok(()),
    }
}
fn get_entry_for_action(action_hash: &ActionHash) -> ExternResult<Option<EntryTypes>> {
    let record = match get_details(action_hash.clone(), GetOptions::default())? {
        Some(Details::Record(record_details)) => record_details.record,
        _ => {
            return Ok(None);
        }
    };
    let entry = match record.entry().as_option() {
        Some(entry) => entry,
        None => {
            return Ok(None);
        }
    };
    let (zome_index, entry_index) = match record.action().entry_type() {
        Some(EntryType::App(AppEntryDef {
            zome_index,
            entry_index,
            ..
        })) => (zome_index, entry_index),
        _ => {
            return Ok(None);
        }
    };
    Ok(EntryTypes::deserialize_from_type(
        zome_index.clone(),
        entry_index.clone(),
        entry,
    )?)
}
