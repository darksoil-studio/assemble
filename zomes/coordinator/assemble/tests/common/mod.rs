use hdk::prelude::*;
use holochain::sweettest::*;

use assemble_integrity::*;

pub async fn sample_call_to_action_1(conductor: &SweetConductor, zome: &SweetZome) -> CallToAction {
    CallToAction {
        admins: vec![],
        parent_call_to_action_hash: None,
        expiration_time: None,
        needs: vec![Need {
            requires_admin_approval: false,
            min_necessary: 4,
            max_possible: Some(4),
            description: "Lorem ipsum 1".to_string(),
        }],
    }
}

pub async fn sample_call_to_action_2(conductor: &SweetConductor, zome: &SweetZome) -> CallToAction {
    CallToAction {
        admins: vec![],
        parent_call_to_action_hash: None,
        expiration_time: None,
        needs: vec![Need {
            requires_admin_approval: false,
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

pub async fn sample_commitment_1(
    conductor: &SweetConductor,
    zome: &SweetZome,
    call_to_action_hash: Option<ActionHash>,
) -> Commitment {
    let call_to_action_hash = match call_to_action_hash {
        Some(h) => h,
        None => {
            create_call_to_action(
                conductor,
                zome,
                sample_call_to_action_1(conductor, zome).await,
            )
            .await
            .signed_action
            .hashed
            .hash
        }
    };
    Commitment {
        call_to_action_hash: call_to_action_hash.clone(),
        amount: 4,
        comment: Some("Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string()),
        need_index: 0,
    }
}

pub async fn sample_commitment_2(
    conductor: &SweetConductor,
    zome: &SweetZome,
    call_to_action_hash: Option<ActionHash>,
) -> Commitment {
    let call_to_action_hash = match call_to_action_hash {
        Some(h) => h,
        None => {
            create_call_to_action(
                conductor,
                zome,
                sample_call_to_action_2(conductor, zome).await,
            )
            .await
            .signed_action
            .hashed
            .hash
        }
    };
    Commitment {
        call_to_action_hash: call_to_action_hash.clone(),
        amount: 1,
        comment: Some("Lorem ipsum 2".to_string()),
        need_index: 0,
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

pub async fn sample_satisfaction_1(
    conductor: &SweetConductor,
    zome: &SweetZome,
    call_to_action_hash: Option<ActionHash>,
) -> Satisfaction {
    let call_to_action_hash = match call_to_action_hash {
        Some(h) => h,
        None => {
            create_call_to_action(
                conductor,
                zome,
                sample_call_to_action_1(conductor, zome).await,
            )
            .await
            .signed_action
            .hashed
            .hash
        }
    };
    Satisfaction {
        call_to_action_hash: call_to_action_hash.clone(),
        need_index: 0,
        commitments_hashes: vec![
            create_commitment(
                conductor,
                zome,
                sample_commitment_1(conductor, zome, Some(call_to_action_hash)).await,
            )
            .await
            .signed_action
            .hashed
            .hash,
        ],
    }
}

pub async fn sample_satisfaction_2(
    conductor: &SweetConductor,
    zome: &SweetZome,
    call_to_action_hash: Option<ActionHash>,
) -> Satisfaction {
    let call_to_action_hash = match call_to_action_hash {
        Some(h) => h,
        None => {
            create_call_to_action(
                conductor,
                zome,
                sample_call_to_action_2(conductor, zome).await,
            )
            .await
            .signed_action
            .hashed
            .hash
        }
    };
    Satisfaction {
        call_to_action_hash: call_to_action_hash.clone(),
        need_index: 0,
        commitments_hashes: vec![
            create_commitment(
                conductor,
                zome,
                sample_commitment_2(conductor, zome, Some(call_to_action_hash)).await,
            )
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
    call_to_action_hash: Option<ActionHash>,
) -> Assembly {
    let call_to_action_hash = match call_to_action_hash {
        Some(h) => h,
        None => {
            create_call_to_action(
                conductor,
                zome,
                sample_call_to_action_1(conductor, zome).await,
            )
            .await
            .signed_action
            .hashed
            .hash
        }
    };
    Assembly {
        call_to_action_hash: call_to_action_hash.clone(),
        satisfactions_hashes: vec![
            create_satisfaction(
                conductor,
                zome,
                sample_satisfaction_1(conductor, zome, Some(call_to_action_hash)).await,
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
    call_to_action_hash: Option<ActionHash>,
) -> Assembly {
    let call_to_action_hash = match call_to_action_hash {
        Some(h) => h,
        None => {
            create_call_to_action(
                conductor,
                zome,
                sample_call_to_action_2(conductor, zome).await,
            )
            .await
            .signed_action
            .hashed
            .hash
        }
    };
    Assembly {
        call_to_action_hash: call_to_action_hash.clone(),
        satisfactions_hashes: vec![
            create_satisfaction(
                conductor,
                zome,
                sample_satisfaction_2(conductor, zome, Some(call_to_action_hash)).await,
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
    let record: Record = conductor.call(zome, "create_assembly", assembly).await;
    record
}
