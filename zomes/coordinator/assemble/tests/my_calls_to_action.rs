#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

mod common;
use common::{create_call_to_action, sample_call_to_action_1};

#[tokio::test(flavor = "multi_thread")]
async fn create_a_call_to_action_and_get_my_calls_to_action() {
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

    let sample = sample_call_to_action_1(&conductors[0], &alice_zome).await;

    // Alice creates a CallToAction
    let record: Record = create_call_to_action(&conductors[0], &alice_zome, sample.clone()).await;

    consistency_10s([&alice, &bobbo]).await;

    let get_records: Vec<ActionHash> = conductors[0]
        .call(&alice_zome, "get_my_calls_to_action", ())
        .await;

    assert_eq!(get_records.len(), 1);
    assert_eq!(get_records[0], record);

    let get_records: Vec<ActionHash> = conductors[1]
        .call(&bob_zome, "get_my_calls_to_action", ())
        .await;

    assert_eq!(get_records.len(), 0);
}
