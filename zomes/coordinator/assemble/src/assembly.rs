use assemble_integrity::*;
use hdk::prelude::*;
use crate::open_calls_to_action::close_call_to_action;
#[hdk_extern]
pub fn create_assembly(assembly: Assembly) -> ExternResult<Record> {
    close_call_to_action(assembly.call_to_action_hash.clone())?;
    let assembly_hash = create_entry(&EntryTypes::Assembly(assembly.clone()))?;
    create_link(
        assembly.call_to_action_hash.clone(),
        assembly_hash.clone(),
        LinkTypes::CallToActionToAssemblies,
        (),
    )?;
    for base in assembly.satisfactions_hashes.clone() {
        create_link(
            base,
            assembly_hash.clone(),
            LinkTypes::SatisfactionToAssemblies,
            (),
        )?;
    }
    let record = get(assembly_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Assembly"))
            ),
        )?;
    let path = Path::from("all_assemblies");
    create_link(
        path.path_entry_hash()?,
        assembly_hash.clone(),
        LinkTypes::AllAssemblies,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_assembly(assembly_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(assembly_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_assemblies_for_call_to_action(
    call_to_action_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(
        call_to_action_hash,
        LinkTypes::CallToActionToAssemblies,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
#[hdk_extern]
pub fn get_assemblies_for_satisfaction(
    satisfaction_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(satisfaction_hash, LinkTypes::SatisfactionToAssemblies, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
