use assemble_integrity::*;
use hdk::prelude::*;
#[hdk_extern]
pub fn create_assembly(assembly: Assembly) -> ExternResult<Record> {
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
    let record = get(assembly_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Assembly"))
    ))?;
    Ok(record)
}
#[hdk_extern]
pub fn get_assembly(assembly_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(assembly_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_assemblies_for_call_to_action(
    call_to_action_hash: ActionHash,
) -> ExternResult<Vec<Link>> {
    get_links(
        call_to_action_hash,
        LinkTypes::CallToActionToAssemblies,
        None,
    )
}

#[hdk_extern]
pub fn get_assemblies_for_satisfaction(satisfaction_hash: ActionHash) -> ExternResult<Vec<Link>> {
    get_links(satisfaction_hash, LinkTypes::SatisfactionToAssemblies, None)
}
