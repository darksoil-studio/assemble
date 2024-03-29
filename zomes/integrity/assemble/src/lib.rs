use hdi::prelude::*;
pub mod assembly;
pub use assembly::*;
pub mod satisfaction;
pub use satisfaction::*;
pub mod commitment;
pub use commitment::*;
pub mod call_to_action;
pub use call_to_action::*;
#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    CallToAction(CallToAction),
    Commitment(Commitment),
    Satisfaction(Satisfaction),
    Assembly(Assembly),
}
#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    CallToActionToCallToActions,
    CallToActionToCommitments,
    CallToActionToSatisfactions,
    CommitmentToSatisfactions,
    CallToActionToAssemblies,
    SatisfactionToAssemblies,
}
#[hdk_extern]
pub fn genesis_self_check(_data: GenesisSelfCheckData) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_agent_joining(
    _agent_pub_key: AgentPubKey,
    _membrane_proof: &Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => match store_entry {
            OpEntry::CreateEntry { app_entry, action } => match app_entry {
                EntryTypes::CallToAction(call_to_action) => validate_create_call_to_action(
                    EntryCreationAction::Create(action),
                    call_to_action,
                ),
                EntryTypes::Commitment(commitment) => {
                    validate_create_commitment(EntryCreationAction::Create(action), commitment)
                }
                EntryTypes::Satisfaction(satisfaction) => {
                    validate_create_satisfaction(EntryCreationAction::Create(action), satisfaction)
                }
                EntryTypes::Assembly(assembly) => {
                    validate_create_assembly(EntryCreationAction::Create(action), assembly)
                }
            },
            OpEntry::UpdateEntry {
                app_entry, action, ..
            } => match app_entry {
                EntryTypes::CallToAction(call_to_action) => validate_create_call_to_action(
                    EntryCreationAction::Update(action),
                    call_to_action,
                ),
                EntryTypes::Commitment(commitment) => {
                    validate_create_commitment(EntryCreationAction::Update(action), commitment)
                }
                EntryTypes::Satisfaction(satisfaction) => {
                    validate_create_satisfaction(EntryCreationAction::Update(action), satisfaction)
                }
                EntryTypes::Assembly(assembly) => {
                    validate_create_assembly(EntryCreationAction::Update(action), assembly)
                }
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterUpdate(update_entry) => match update_entry {
            OpUpdate::Entry {
                original_action,
                original_app_entry,
                app_entry,
                action,
            } => match (app_entry, original_app_entry) {
                (EntryTypes::Assembly(assembly), EntryTypes::Assembly(original_assembly)) => {
                    validate_update_assembly(action, assembly, original_action, original_assembly)
                }
                (
                    EntryTypes::Satisfaction(satisfaction),
                    EntryTypes::Satisfaction(original_satisfaction),
                ) => validate_update_satisfaction(
                    action,
                    satisfaction,
                    original_action,
                    original_satisfaction,
                ),
                (
                    EntryTypes::Commitment(commitment),
                    EntryTypes::Commitment(original_commitment),
                ) => validate_update_commitment(
                    action,
                    commitment,
                    original_action,
                    original_commitment,
                ),
                (
                    EntryTypes::CallToAction(call_to_action),
                    EntryTypes::CallToAction(original_call_to_action),
                ) => validate_update_call_to_action(
                    action,
                    call_to_action,
                    original_action,
                    original_call_to_action,
                ),
                _ => Ok(ValidateCallbackResult::Invalid(
                    "Original and updated entry types must be the same".to_string(),
                )),
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterDelete(delete_entry) => match delete_entry {
            OpDelete::Entry {
                original_action,
                original_app_entry,
                action,
            } => match original_app_entry {
                EntryTypes::CallToAction(call_to_action) => {
                    validate_delete_call_to_action(action, original_action, call_to_action)
                }
                EntryTypes::Commitment(commitment) => {
                    validate_delete_commitment(action, original_action, commitment)
                }
                EntryTypes::Satisfaction(satisfaction) => {
                    validate_delete_satisfaction(action, original_action, satisfaction)
                }
                EntryTypes::Assembly(assembly) => {
                    validate_delete_assembly(action, original_action, assembly)
                }
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag,
            action,
        } => match link_type {
            LinkTypes::CallToActionToCallToActions => {
                validate_create_link_call_to_action_to_call_to_actions(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::CallToActionToCommitments => {
                validate_create_link_call_to_action_to_commitments(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::CallToActionToSatisfactions => {
                validate_create_link_call_to_action_to_satisfactions(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::CommitmentToSatisfactions => {
                validate_create_link_commitment_to_satisfactions(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::CallToActionToAssemblies => {
                validate_create_link_call_to_action_to_assemblies(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::SatisfactionToAssemblies => validate_create_link_satisfaction_to_assemblies(
                action,
                base_address,
                target_address,
                tag,
            ),
        },
        FlatOp::RegisterDeleteLink {
            link_type,
            base_address,
            target_address,
            tag,
            original_action,
            action,
        } => match link_type {
            LinkTypes::CallToActionToCallToActions => {
                validate_delete_link_call_to_action_to_call_to_actions(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::CallToActionToCommitments => {
                validate_delete_link_call_to_action_to_commitments(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::CallToActionToSatisfactions => {
                validate_delete_link_call_to_action_to_satisfactions(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::CommitmentToSatisfactions => {
                validate_delete_link_commitment_to_satisfactions(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::CallToActionToAssemblies => {
                validate_delete_link_call_to_action_to_assemblies(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::SatisfactionToAssemblies => validate_delete_link_satisfaction_to_assemblies(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
        },
        FlatOp::StoreRecord(store_record) => match store_record {
            OpRecord::CreateEntry { app_entry, action } => match app_entry {
                EntryTypes::CallToAction(call_to_action) => validate_create_call_to_action(
                    EntryCreationAction::Create(action),
                    call_to_action,
                ),
                EntryTypes::Commitment(commitment) => {
                    validate_create_commitment(EntryCreationAction::Create(action), commitment)
                }
                EntryTypes::Satisfaction(satisfaction) => {
                    validate_create_satisfaction(EntryCreationAction::Create(action), satisfaction)
                }
                EntryTypes::Assembly(assembly) => {
                    validate_create_assembly(EntryCreationAction::Create(action), assembly)
                }
            },
            OpRecord::UpdateEntry {
                original_action_hash,
                app_entry,
                action,
                ..
            } => {
                let original_record = must_get_valid_record(original_action_hash)?;
                let original_action = original_record.action().clone();
                let original_action = match original_action {
                    Action::Create(create) => EntryCreationAction::Create(create),
                    Action::Update(update) => EntryCreationAction::Update(update),
                    _ => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "Original action for an update must be a Create or Update action"
                                .to_string(),
                        ));
                    }
                };
                match app_entry {
                    EntryTypes::CallToAction(call_to_action) => {
                        let result = validate_create_call_to_action(
                            EntryCreationAction::Update(action.clone()),
                            call_to_action.clone(),
                        )?;
                        if let ValidateCallbackResult::Valid = result {
                            let original_call_to_action: Option<CallToAction> = original_record
                                .entry()
                                .to_app_option()
                                .map_err(|e| wasm_error!(e))?;
                            let original_call_to_action = match original_call_to_action {
                                Some(call_to_action) => call_to_action,
                                None => {
                                    return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                }
                            };
                            validate_update_call_to_action(
                                action,
                                call_to_action,
                                original_action,
                                original_call_to_action,
                            )
                        } else {
                            Ok(result)
                        }
                    }
                    EntryTypes::Commitment(commitment) => {
                        let result = validate_create_commitment(
                            EntryCreationAction::Update(action.clone()),
                            commitment.clone(),
                        )?;
                        if let ValidateCallbackResult::Valid = result {
                            let original_commitment: Option<Commitment> = original_record
                                .entry()
                                .to_app_option()
                                .map_err(|e| wasm_error!(e))?;
                            let original_commitment = match original_commitment {
                                Some(commitment) => commitment,
                                None => {
                                    return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                }
                            };
                            validate_update_commitment(
                                action,
                                commitment,
                                original_action,
                                original_commitment,
                            )
                        } else {
                            Ok(result)
                        }
                    }
                    EntryTypes::Satisfaction(satisfaction) => {
                        let result = validate_create_satisfaction(
                            EntryCreationAction::Update(action.clone()),
                            satisfaction.clone(),
                        )?;
                        if let ValidateCallbackResult::Valid = result {
                            let original_satisfaction: Option<Satisfaction> = original_record
                                .entry()
                                .to_app_option()
                                .map_err(|e| wasm_error!(e))?;
                            let original_satisfaction = match original_satisfaction {
                                Some(satisfaction) => satisfaction,
                                None => {
                                    return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                }
                            };
                            validate_update_satisfaction(
                                action,
                                satisfaction,
                                original_action,
                                original_satisfaction,
                            )
                        } else {
                            Ok(result)
                        }
                    }
                    EntryTypes::Assembly(assembly) => {
                        let result = validate_create_assembly(
                            EntryCreationAction::Update(action.clone()),
                            assembly.clone(),
                        )?;
                        if let ValidateCallbackResult::Valid = result {
                            let original_assembly: Option<Assembly> = original_record
                                .entry()
                                .to_app_option()
                                .map_err(|e| wasm_error!(e))?;
                            let original_assembly = match original_assembly {
                                Some(assembly) => assembly,
                                None => {
                                    return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                }
                            };
                            validate_update_assembly(
                                action,
                                assembly,
                                original_action,
                                original_assembly,
                            )
                        } else {
                            Ok(result)
                        }
                    }
                }
            }
            OpRecord::DeleteEntry {
                original_action_hash,
                action,
                ..
            } => {
                let original_record = must_get_valid_record(original_action_hash)?;
                let original_action = original_record.action().clone();
                let original_action = match original_action {
                    Action::Create(create) => EntryCreationAction::Create(create),
                    Action::Update(update) => EntryCreationAction::Update(update),
                    _ => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "Original action for a delete must be a Create or Update action"
                                .to_string(),
                        ));
                    }
                };
                let app_entry_type = match original_action.entry_type() {
                    EntryType::App(app_entry_type) => app_entry_type,
                    _ => {
                        return Ok(ValidateCallbackResult::Valid);
                    }
                };
                let entry = match original_record.entry().as_option() {
                    Some(entry) => entry,
                    None => {
                        if original_action.entry_type().visibility().is_public() {
                            return Ok(
                                    ValidateCallbackResult::Invalid(
                                        "Original record for a delete of a public entry must contain an entry"
                                            .to_string(),
                                    ),
                                );
                        } else {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    }
                };
                let original_app_entry = match EntryTypes::deserialize_from_type(
                    app_entry_type.zome_index.clone(),
                    app_entry_type.entry_index.clone(),
                    &entry,
                )? {
                    Some(app_entry) => app_entry,
                    None => {
                        return Ok(ValidateCallbackResult::Valid);
                    }
                };
                match original_app_entry {
                    EntryTypes::CallToAction(original_call_to_action) => {
                        validate_delete_call_to_action(
                            action,
                            original_action,
                            original_call_to_action,
                        )
                    }
                    EntryTypes::Commitment(original_commitment) => {
                        validate_delete_commitment(action, original_action, original_commitment)
                    }
                    EntryTypes::Satisfaction(original_satisfaction) => {
                        validate_delete_satisfaction(action, original_action, original_satisfaction)
                    }
                    EntryTypes::Assembly(original_assembly) => {
                        validate_delete_assembly(action, original_action, original_assembly)
                    }
                }
            }
            OpRecord::CreateLink {
                base_address,
                target_address,
                tag,
                link_type,
                action,
            } => match link_type {
                LinkTypes::CallToActionToCallToActions => {
                    validate_create_link_call_to_action_to_call_to_actions(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::CallToActionToCommitments => {
                    validate_create_link_call_to_action_to_commitments(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::CallToActionToSatisfactions => {
                    validate_create_link_call_to_action_to_satisfactions(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::CommitmentToSatisfactions => {
                    validate_create_link_commitment_to_satisfactions(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::CallToActionToAssemblies => {
                    validate_create_link_call_to_action_to_assemblies(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::SatisfactionToAssemblies => {
                    validate_create_link_satisfaction_to_assemblies(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            },
            OpRecord::DeleteLink {
                original_action_hash,
                base_address,
                action,
            } => {
                let record = must_get_valid_record(original_action_hash)?;
                let create_link = match record.action() {
                    Action::CreateLink(create_link) => create_link.clone(),
                    _ => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "The action that a DeleteLink deletes must be a CreateLink".to_string(),
                        ));
                    }
                };
                let link_type = match LinkTypes::from_type(
                    create_link.zome_index.clone(),
                    create_link.link_type.clone(),
                )? {
                    Some(lt) => lt,
                    None => {
                        return Ok(ValidateCallbackResult::Valid);
                    }
                };
                match link_type {
                    LinkTypes::CallToActionToCallToActions => {
                        validate_delete_link_call_to_action_to_call_to_actions(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        )
                    }
                    LinkTypes::CallToActionToCommitments => {
                        validate_delete_link_call_to_action_to_commitments(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        )
                    }
                    LinkTypes::CallToActionToSatisfactions => {
                        validate_delete_link_call_to_action_to_satisfactions(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        )
                    }
                    LinkTypes::CommitmentToSatisfactions => {
                        validate_delete_link_commitment_to_satisfactions(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        )
                    }
                    LinkTypes::CallToActionToAssemblies => {
                        validate_delete_link_call_to_action_to_assemblies(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        )
                    }
                    LinkTypes::SatisfactionToAssemblies => {
                        validate_delete_link_satisfaction_to_assemblies(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        )
                    }
                }
            }
            OpRecord::CreatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::UpdatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::CreateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::CreateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::UpdateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::UpdateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::Dna { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::OpenChain { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::CloseChain { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::InitZomesComplete { .. } => Ok(ValidateCallbackResult::Valid),
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterAgentActivity(agent_activity) => match agent_activity {
            OpActivity::CreateAgent { agent, action } => {
                let previous_action = must_get_action(action.prev_action)?;
                match previous_action.action() {
                        Action::AgentValidationPkg(
                            AgentValidationPkg { membrane_proof, .. },
                        ) => validate_agent_joining(agent, membrane_proof),
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "The previous action for a `CreateAgent` action must be an `AgentValidationPkg`"
                                        .to_string(),
                                ),
                            )
                        }
                    }
            }
            _ => Ok(ValidateCallbackResult::Valid),
        },
    }
}
