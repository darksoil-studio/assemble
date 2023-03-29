use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Promise {
    pub call_to_action_hash: ActionHash,
    pub description: String,
    pub need_index: u32,
}
pub fn validate_create_promise(
    _action: EntryCreationAction,
    promise: Promise,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record(promise.call_to_action_hash.clone())?;
    let _call_to_action: crate::CallToAction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Dependant action must be accompanied by an entry"))
            ),
        )?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_promise(
    _action: Update,
    _promise: Promise,
    _original_action: EntryCreationAction,
    _original_promise: Promise,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Promises cannot be updated")))
}
pub fn validate_delete_promise(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_promise: Promise,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("Promises cannot be deleted")))
}
pub fn validate_create_link_call_to_action_to_promises(
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
    let _promise: crate::Promise = record
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
pub fn validate_delete_link_call_to_action_to_promises(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("CallToActionToPromises links cannot be deleted"),
        ),
    )
}
