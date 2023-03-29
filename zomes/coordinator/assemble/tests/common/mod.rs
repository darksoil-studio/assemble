use hdk::prelude::*;
use holochain::sweettest::*;

use assemble_integrity::*;



pub async fn sample_call_to_action_1(conductor: &SweetConductor, zome: &SweetZome) -> CallToAction {
    CallToAction {
          parent_call_to_action_hash: None,
	  title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  custom_content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  needs: vec!["Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string()],
    }
}

pub async fn sample_call_to_action_2(conductor: &SweetConductor, zome: &SweetZome) -> CallToAction {
    CallToAction {
          parent_call_to_action_hash: None,
	  title: "Lorem ipsum 2".to_string(),
	  custom_content: "Lorem ipsum 2".to_string(),
	  needs: vec!["Lorem ipsum 2".to_string()],
    }
}

pub async fn create_call_to_action(conductor: &SweetConductor, zome: &SweetZome, call_to_action: CallToAction) -> Record {
    let record: Record = conductor
        .call(zome, "create_call_to_action", call_to_action)
        .await;
    record
}



pub async fn sample_promise_1(conductor: &SweetConductor, zome: &SweetZome) -> Promise {
    Promise {
          call_to_action_hash: create_call_to_action(conductor, zome, sample_call_to_action_1(conductor, zome).await).await.signed_action.hashed.hash,
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  need_index: 10,
    }
}

pub async fn sample_promise_2(conductor: &SweetConductor, zome: &SweetZome) -> Promise {
    Promise {
          call_to_action_hash: create_call_to_action(conductor, zome, sample_call_to_action_2(conductor, zome).await).await.signed_action.hashed.hash,
	  description: "Lorem ipsum 2".to_string(),
	  need_index: 3,
    }
}

pub async fn create_promise(conductor: &SweetConductor, zome: &SweetZome, promise: Promise) -> Record {
    let record: Record = conductor
        .call(zome, "create_promise", promise)
        .await;
    record
}



pub async fn sample_satisfaction_1(conductor: &SweetConductor, zome: &SweetZome) -> Satisfaction {
    Satisfaction {
          call_to_action_hash: create_call_to_action(conductor, zome, sample_call_to_action_1(conductor, zome).await).await.signed_action.hashed.hash,
	  need_index: 10,
          promises_hashes: vec![create_promise(conductor, zome, sample_promise_1(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn sample_satisfaction_2(conductor: &SweetConductor, zome: &SweetZome) -> Satisfaction {
    Satisfaction {
          call_to_action_hash: create_call_to_action(conductor, zome, sample_call_to_action_2(conductor, zome).await).await.signed_action.hashed.hash,
	  need_index: 3,
          promises_hashes: vec![create_promise(conductor, zome, sample_promise_2(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn create_satisfaction(conductor: &SweetConductor, zome: &SweetZome, satisfaction: Satisfaction) -> Record {
    let record: Record = conductor
        .call(zome, "create_satisfaction", satisfaction)
        .await;
    record
}



pub async fn sample_collective_commitment_1(conductor: &SweetConductor, zome: &SweetZome) -> CollectiveCommitment {
    CollectiveCommitment {
          call_to_action_hash: create_call_to_action(conductor, zome, sample_call_to_action_1(conductor, zome).await).await.signed_action.hashed.hash,
          satisfactions_hashes: vec![create_satisfaction(conductor, zome, sample_satisfaction_1(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn sample_collective_commitment_2(conductor: &SweetConductor, zome: &SweetZome) -> CollectiveCommitment {
    CollectiveCommitment {
          call_to_action_hash: create_call_to_action(conductor, zome, sample_call_to_action_2(conductor, zome).await).await.signed_action.hashed.hash,
          satisfactions_hashes: vec![create_satisfaction(conductor, zome, sample_satisfaction_2(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn create_collective_commitment(conductor: &SweetConductor, zome: &SweetZome, collective_commitment: CollectiveCommitment) -> Record {
    let record: Record = conductor
        .call(zome, "create_collective_commitment", collective_commitment)
        .await;
    record
}

