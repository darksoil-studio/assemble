#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

use assemble_integrity::*;

mod common;
use common::{create_assembly, sample_assembly_1, sample_assembly_2};

use common::{create_call_to_action, sample_call_to_action_1, sample_call_to_action_2};
use common::{create_satisfaction, sample_satisfaction_1, sample_satisfaction_2};

#[tokio::test(flavor = "multi_thread")]
async fn create_assembly_test() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../../workdir/assemble_test.dna");
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("assemble_test", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (_bobbo,)) = apps.into_tuples();

    let alice_zome = alice.zome("assemble");

    let sample = sample_assembly_1(&conductors[0], &alice_zome, None).await;

    // Alice creates a Assembly
    let record: Record = create_assembly(&conductors[0], &alice_zome, sample.clone()).await;
    let entry: Assembly = record.entry().to_app_option().unwrap().unwrap();
    assert!(entry.eq(&sample));
}

#[tokio::test(flavor = "multi_thread")]
async fn create_and_read_assembly() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../../workdir/assemble_test.dna");
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("assemble_test", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (bobbo,)) = apps.into_tuples();

    let alice_zome = alice.zome("assemble");
    let bob_zome = bobbo.zome("assemble");

    let sample = sample_assembly_1(&conductors[0], &alice_zome, None).await;

    // Alice creates a Assembly
    let record: Record = create_assembly(&conductors[0], &alice_zome, sample.clone()).await;

    consistency_10s([&alice, &bobbo]).await;

    let get_record: Option<Record> = conductors[1]
        .call(
            &bob_zome,
            "get_assembly",
            record.signed_action.action_address().clone(),
        )
        .await;

    assert_eq!(record, get_record.unwrap());
}
