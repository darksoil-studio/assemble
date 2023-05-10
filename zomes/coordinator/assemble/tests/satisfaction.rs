#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

use assemble_integrity::*;

use hc_zome_assemble_coordinator::satisfaction::UpdateSatisfactionInput;

mod common;
use common::{create_satisfaction, sample_satisfaction_1, sample_satisfaction_2};

use common::{create_call_to_action, sample_call_to_action_1, sample_call_to_action_2};
use common::{create_commitment, sample_commitment_1, sample_commitment_2};

#[tokio::test(flavor = "multi_thread")]
async fn create_satisfaction_test() {
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
    
    let sample = sample_satisfaction_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Satisfaction
    let record: Record = create_satisfaction(&conductors[0], &alice_zome, sample.clone()).await;
    let entry: Satisfaction = record.entry().to_app_option().unwrap().unwrap();
    assert!(entry.eq(&sample));
}


#[tokio::test(flavor = "multi_thread")]
async fn create_and_read_satisfaction() {
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
    
    let sample = sample_satisfaction_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Satisfaction
    let record: Record = create_satisfaction(&conductors[0], &alice_zome, sample.clone()).await;
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_satisfaction", record.signed_action.action_address().clone())
        .await;
        
    assert_eq!(record, get_record.unwrap());    
}

#[tokio::test(flavor = "multi_thread")]
async fn create_and_update_satisfaction() {
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
    
    let sample_1 = sample_satisfaction_1(&conductors[0], &alice_zome).await;
    
    // Alice creates a Satisfaction
    let record: Record = create_satisfaction(&conductors[0], &alice_zome, sample_1.clone()).await;
    let original_action_hash = record.signed_action.hashed.hash.clone();
        
    consistency_10s([&alice, &bobbo]).await;
    
    let sample_2 = sample_satisfaction_2(&conductors[0], &alice_zome).await;
    let input = UpdateSatisfactionInput {
      previous_satisfaction_hash: original_action_hash.clone(),
      updated_satisfaction: sample_2.clone(),
    };
    
    // Alice updates the Satisfaction
    let update_record: Record = conductors[0]
        .call(&alice_zome, "update_satisfaction", input)
        .await;
        
    let entry: Satisfaction = update_record.entry().to_app_option().unwrap().unwrap();
    assert_eq!(sample_2, entry);
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_satisfaction", original_action_hash.clone())
        .await;
  
    assert_eq!(update_record, get_record.unwrap());
    
    let input = UpdateSatisfactionInput {
      previous_satisfaction_hash: update_record.signed_action.hashed.hash.clone(),
      updated_satisfaction: sample_1.clone(),
    };
    
    // Alice updates the Satisfaction again
    let update_record: Record = conductors[0]
        .call(&alice_zome, "update_satisfaction", input)
        .await;
        
    let entry: Satisfaction = update_record.entry().to_app_option().unwrap().unwrap();
    assert_eq!(sample_1, entry);
    
    consistency_10s([&alice, &bobbo]).await;
    
    let get_record: Option<Record> = conductors[1]
        .call(&bob_zome, "get_satisfaction", original_action_hash.clone())
        .await;
  
    assert_eq!(update_record, get_record.unwrap());
}

