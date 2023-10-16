use assemble_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn get_all_assemblies(_: ()) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_assemblies");
    let links = get_links(path.path_entry_hash()?, LinkTypes::AllAssemblies, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .filter_map(|link| link.target.into_any_dht_hash())
        .map(|target| GetInput::new(target, GetOptions::default()))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    Ok(records)
}
