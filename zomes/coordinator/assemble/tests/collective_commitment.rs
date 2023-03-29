#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

use assemble_integrity::*;


mod common;
use common::{create_collective_commitment, sample_collective_commitment_1, sample_collective_commitment_2};

use common::{create_call, sample_call_1, sample_call_2};
use common::{create_satisfaction, sample_satisfaction_1, sample_satisfaction_2};

#[tokio::test(flavor = "multi_thread")]
async fn create_collective_commitment_test() {
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
    
    let sample = sample_collective_commitment_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a CollectiveCommitment
    let record: Record = create_collective_commitment(&conductors[0], &alice_zome, sample.clone()).await;
    let entry: CollectiveCommitment = record.entry().to_app_option().unwrap().unwrap();
    assert!(entry.eq(&sample));
}


#[tokio::test(flavor = "multi_thread")]
async fn create_and_read_collective_commitment() {
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
    
    let sample = sample_collective_commitment_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a CollectiveCommitment
    let record: Record = create_collective_commitment(&conductors[0], &alice_zome, sample.clone()).await;
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_collective_commitment", record.signed_action.action_address().clone())
        .await;
        
    assert_eq!(record, get_record.unwrap());    
}


