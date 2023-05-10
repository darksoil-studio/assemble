use hdk::prelude::*;
use holochain::sweettest::*;

use assemble_integrity::*;

pub async fn sample_call_to_action_1(conductor: &SweetConductor, zome: &SweetZome) -> CallToAction {
    CallToAction {
        parent_call_to_action_hash: None,
        title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
        custom_content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
        needs: vec![Need {
            min_necessary: 4,
            max_possible: Some(4),
            description: "Lorem ipsum 1".to_string(),
        }],
    }
}

pub async fn sample_call_to_action_2(conductor: &SweetConductor, zome: &SweetZome) -> CallToAction {
    CallToAction {
        parent_call_to_action_hash: None,
        title: "Lorem ipsum 2".to_string(),
        custom_content: "Lorem ipsum 2".to_string(),
        needs: vec![Need {
            min_necessary: 4,
            max_possible: None,
            description: "Lorem ipsum 2".to_string(),
        }],
    }
}

pub async fn create_call_to_action(
    conductor: &SweetConductor,
    zome: &SweetZome,
    call_to_action: CallToAction,
) -> Record {
    let record: Record = conductor
        .call(zome, "create_call_to_action", call_to_action)
        .await;
    record
}

pub async fn sample_commitment_1(conductor: &SweetConductor, zome: &SweetZome) -> Commitment {
    Commitment {
        call_to_action_hash: create_call_to_action(
            conductor,
            zome,
            sample_call_to_action_1(conductor, zome).await,
        )
        .await
        .signed_action
        .hashed
        .hash,
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
        need_index: 10,
    }
}

pub async fn sample_commitment_2(conductor: &SweetConductor, zome: &SweetZome) -> Commitment {
    Commitment {
        call_to_action_hash: create_call_to_action(
            conductor,
            zome,
            sample_call_to_action_2(conductor, zome).await,
        )
        .await
        .signed_action
        .hashed
        .hash,
        description: "Lorem ipsum 2".to_string(),
        need_index: 3,
    }
}

pub async fn create_commitment(
    conductor: &SweetConductor,
    zome: &SweetZome,
    commitment: Commitment,
) -> Record {
    let record: Record = conductor.call(zome, "create_commitment", commitment).await;
    record
}

pub async fn sample_satisfaction_1(conductor: &SweetConductor, zome: &SweetZome) -> Satisfaction {
    Satisfaction {
        call_to_action_hash: create_call_to_action(
            conductor,
            zome,
            sample_call_to_action_1(conductor, zome).await,
        )
        .await
        .signed_action
        .hashed
        .hash,
        need_index: 10,
        commitments_hashes: vec![
            create_commitment(conductor, zome, sample_commitment_1(conductor, zome).await)
                .await
                .signed_action
                .hashed
                .hash,
        ],
    }
}

pub async fn sample_satisfaction_2(conductor: &SweetConductor, zome: &SweetZome) -> Satisfaction {
    Satisfaction {
        call_to_action_hash: create_call_to_action(
            conductor,
            zome,
            sample_call_to_action_2(conductor, zome).await,
        )
        .await
        .signed_action
        .hashed
        .hash,
        need_index: 3,
        commitments_hashes: vec![
            create_commitment(conductor, zome, sample_commitment_2(conductor, zome).await)
                .await
                .signed_action
                .hashed
                .hash,
        ],
    }
}

pub async fn create_satisfaction(
    conductor: &SweetConductor,
    zome: &SweetZome,
    satisfaction: Satisfaction,
) -> Record {
    let record: Record = conductor
        .call(zome, "create_satisfaction", satisfaction)
        .await;
    record
}

pub async fn sample_assembly_1(
    conductor: &SweetConductor,
    zome: &SweetZome,
) -> Assembly {
    Assembly {
        call_to_action_hash: create_call_to_action(
            conductor,
            zome,
            sample_call_to_action_1(conductor, zome).await,
        )
        .await
        .signed_action
        .hashed
        .hash,
        satisfactions_hashes: vec![
            create_satisfaction(
                conductor,
                zome,
                sample_satisfaction_1(conductor, zome).await,
            )
            .await
            .signed_action
            .hashed
            .hash,
        ],
    }
}

pub async fn sample_assembly_2(
    conductor: &SweetConductor,
    zome: &SweetZome,
) -> Assembly {
    Assembly {
        call_to_action_hash: create_call_to_action(
            conductor,
            zome,
            sample_call_to_action_2(conductor, zome).await,
        )
        .await
        .signed_action
        .hashed
        .hash,
        satisfactions_hashes: vec![
            create_satisfaction(
                conductor,
                zome,
                sample_satisfaction_2(conductor, zome).await,
            )
            .await
            .signed_action
            .hashed
            .hash,
        ],
    }
}

pub async fn create_assembly(
    conductor: &SweetConductor,
    zome: &SweetZome,
    assembly: Assembly,
) -> Record {
    let record: Record = conductor
        .call(zome, "create_assembly", assembly)
        .await;
    record
}
