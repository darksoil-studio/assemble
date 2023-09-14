use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Commitment {
    pub call_to_action_hash: ActionHash,
    pub amount: u32,
    pub comment: Option<String>,
    pub need_index: u32,
}
pub fn validate_create_commitment(
    _action: EntryCreationAction,
    commitment: Commitment,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record(commitment.call_to_action_hash.clone())?;
    let _call_to_action: crate::CallToAction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Dependant action must be accompanied by an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_commitment(
    _action: Update,
    _commitment: Commitment,
    _original_action: EntryCreationAction,
    _original_commitment: Commitment,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Commitments cannot be updated",
    )))
}
pub fn validate_delete_commitment(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_commitment: Commitment,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Commitments cannot be deleted",
    )))
}
pub fn validate_create_link_call_to_action_to_commitments(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash =
        ActionHash::try_from(base_address).map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _call_to_action: crate::CallToAction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    let action_hash = ActionHash::try_from(target_address)
        .map_err(|err| wasm_error!(WasmErrorInner::from(err)))?;
    let record = must_get_valid_record(action_hash)?;
    let _commitment: crate::Commitment = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_call_to_action_to_commitments(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "CallToActionToCommitments links cannot be deleted",
    )))
}
