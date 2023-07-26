use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Satisfaction {
    pub call_to_action_hash: ActionHash,
    pub need_index: u32,
    pub commitments_hashes: Vec<ActionHash>,
}
pub fn validate_create_satisfaction(
    _action: EntryCreationAction,
    satisfaction: Satisfaction,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record(satisfaction.call_to_action_hash.clone())?;
    let _call_to_action: crate::CallToAction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Dependant action must be accompanied by an entry"))
            ),
        )?;
    for action_hash in satisfaction.commitments_hashes.clone() {
        let record = must_get_valid_record(action_hash)?;
        let _commitment: crate::Commitment = record
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
pub fn validate_update_satisfaction(
    _action: Update,
    _satisfaction: Satisfaction,
    _original_action: EntryCreationAction,
    _original_satisfaction: Satisfaction,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_satisfaction(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_satisfaction: Satisfaction,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Satisfactions cannot be deleted")))
}
pub fn validate_create_link_call_to_action_to_satisfactions(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(base_address)
                    .map_err(|e| wasm_error!(WasmErrorInner::from(e)))?;    let record = must_get_valid_record(action_hash)?;
    let _call_to_action: crate::CallToAction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
        let action_hash = ActionHash::try_from(target_address)
                        .map_err(|e| wasm_error!(WasmErrorInner::from(e)))?;
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
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_call_to_action_to_satisfactions(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("CallToActionToSatisfactions links cannot be deleted"),
        ),
    )
}
pub fn validate_create_link_commitment_to_satisfactions(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::try_from(base_address)
        .map_err(|e| wasm_error!(WasmErrorInner::from(e)))?;
    let record = must_get_valid_record(action_hash)?;
    let _commitment: crate::Commitment = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    let action_hash = ActionHash::try_from(target_address)
        .map_err(|e| wasm_error!(WasmErrorInner::from(e)))?;
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
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_commitment_to_satisfactions(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("CommitmentToSatisfactions links cannot be deleted"),
        ),
    )
}
