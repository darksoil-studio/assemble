use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct CollectiveCommitment {
    pub call_to_action_hash: ActionHash,
    pub satisfactions_hashes: Vec<ActionHash>,
}
pub fn validate_create_collective_commitment(
    _action: EntryCreationAction,
    collective_commitment: CollectiveCommitment,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record(
        collective_commitment.call_to_action_hash.clone(),
    )?;
    let _call_to_action: crate::CallToAction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Dependant action must be accompanied by an entry"))
            ),
        )?;
    for action_hash in collective_commitment.satisfactions_hashes.clone() {
        let record = must_get_valid_record(action_hash)?;
        let _satisfaction: crate::Satisfaction = record
            .entry()
            .to_app_option()
            .map_err(|e| wasm_error!(e))?
            .ok_or(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Dependant action must be accompanied by an entry"))
                ),
            )?;
    }
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_collective_commitment(
    _action: Update,
    _collective_commitment: CollectiveCommitment,
    _original_action: EntryCreationAction,
    _original_collective_commitment: CollectiveCommitment,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("Collective Commitments cannot be updated"),
        ),
    )
}
pub fn validate_delete_collective_commitment(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_collective_commitment: CollectiveCommitment,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("Collective Commitments cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_call_to_action_to_collective_commitments(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _call_to_action: crate::CallToAction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _collective_commitment: crate::CollectiveCommitment = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_call_to_action_to_collective_commitments(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("CallToActionToCollectiveCommitments links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_satisfaction_to_collective_commitments(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _satisfaction: crate::Satisfaction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _collective_commitment: crate::CollectiveCommitment = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_satisfaction_to_collective_commitments(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("SatisfactionToCollectiveCommitments links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_all_collective_commitments(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _collective_commitment: crate::CollectiveCommitment = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_all_collective_commitments(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("AllCollectiveCommitments links cannot be deleted"),
        ),
    )
}
