use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct CallToAction {
    pub parent_call_to_action_hash: Option<ActionHash>,
    pub custom_content: SerializedBytes,
    pub expiration_time: Option<Timestamp>,
    pub needs: Vec<Need>,
}
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Need {
    pub min_necessary: u32,
    pub max_possible: Option<u32>,
    pub description: String,
}
pub fn validate_create_call_to_action(
    _action: EntryCreationAction,
    call_to_action: CallToAction,
) -> ExternResult<ValidateCallbackResult> {
    if let Some(action_hash) = call_to_action.parent_call_to_action_hash.clone() {
        let record = must_get_valid_record(action_hash)?;
        let _call_to_action: crate::CallToAction = record
            .entry()
            .to_app_option()
            .map_err(|e| wasm_error!(e))?
            .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                "Dependant action must be accompanied by an entry"
            ))))?;
    }
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_call_to_action(
    _action: Update,
    _call_to_action: CallToAction,
    _original_action: EntryCreationAction,
    _original_call_to_action: CallToAction,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_call_to_action(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_call_to_action: CallToAction,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_call_to_action_to_call_to_actions(
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
    let _call_to_action: crate::CallToAction = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_call_to_action_to_call_to_actions(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "CallToActionToCallToActions links cannot be deleted",
    )))
}
