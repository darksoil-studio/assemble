use hdk::prelude::*;
use holochain::sweettest::*;

use assemble_integrity::*;



pub async fn sample_call_1(conductor: &SweetConductor, zome: &SweetZome) -> Call {
    Call {
          parent_call_hash: None,
	  title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  custom_content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  needs: vec!["Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string()],
    }
}

pub async fn sample_call_2(conductor: &SweetConductor, zome: &SweetZome) -> Call {
    Call {
          parent_call_hash: None,
	  title: "Lorem ipsum 2".to_string(),
	  custom_content: "Lorem ipsum 2".to_string(),
	  needs: vec!["Lorem ipsum 2".to_string()],
    }
}

pub async fn create_call(conductor: &SweetConductor, zome: &SweetZome, call: Call) -> Record {
    let record: Record = conductor
        .call(zome, "create_call", call)
        .await;
    record
}



pub async fn sample_promise_1(conductor: &SweetConductor, zome: &SweetZome) -> Promise {
    Promise {
          call_hash: create_call(conductor, zome, sample_call_1(conductor, zome).await).await.signed_action.hashed.hash,
	  need_index: 10,
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
    }
}

pub async fn sample_promise_2(conductor: &SweetConductor, zome: &SweetZome) -> Promise {
    Promise {
          call_hash: create_call(conductor, zome, sample_call_2(conductor, zome).await).await.signed_action.hashed.hash,
	  need_index: 3,
	  description: "Lorem ipsum 2".to_string(),
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
          call_hash: create_call(conductor, zome, sample_call_1(conductor, zome).await).await.signed_action.hashed.hash,
	  need_index: 10,
          promises_hashes: vec![create_promise(conductor, zome, sample_promise_1(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn sample_satisfaction_2(conductor: &SweetConductor, zome: &SweetZome) -> Satisfaction {
    Satisfaction {
          call_hash: create_call(conductor, zome, sample_call_2(conductor, zome).await).await.signed_action.hashed.hash,
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
          call_hash: create_call(conductor, zome, sample_call_1(conductor, zome).await).await.signed_action.hashed.hash,
          satisfactions_hashes: vec![create_satisfaction(conductor, zome, sample_satisfaction_1(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn sample_collective_commitment_2(conductor: &SweetConductor, zome: &SweetZome) -> CollectiveCommitment {
    CollectiveCommitment {
          call_hash: create_call(conductor, zome, sample_call_2(conductor, zome).await).await.signed_action.hashed.hash,
          satisfactions_hashes: vec![create_satisfaction(conductor, zome, sample_satisfaction_2(conductor, zome).await).await.signed_action.hashed.hash],
    }
}

pub async fn create_collective_commitment(conductor: &SweetConductor, zome: &SweetZome, collective_commitment: CollectiveCommitment) -> Record {
    let record: Record = conductor
        .call(zome, "create_collective_commitment", collective_commitment)
        .await;
    record
}

