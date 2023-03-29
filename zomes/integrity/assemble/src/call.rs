use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Call {
    pub parent_call_hash: Option<ActionHash>,
    pub title: String,
    pub custom_content: String,
    pub needs: Vec<String>,
}
pub fn validate_create_call(
    _action: EntryCreationAction,
    call: Call,
) -> ExternResult<ValidateCallbackResult> {
    if let Some(action_hash) = call.parent_call_hash.clone() {
        let record = must_get_valid_record(action_hash)?;
        let _call: crate::Call = record
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
pub fn validate_update_call(
    _action: Update,
    _call: Call,
    _original_action: EntryCreationAction,
    _original_call: Call,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_call(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_call: Call,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_call_to_calls(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _call: crate::Call = record
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
    let _call: crate::Call = record
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
pub fn validate_delete_link_call_to_calls(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("CallToCalls links cannot be deleted"),
        ),
    )
}
