//! # StreamRouterContract: Cross-Contract Composable Streaming Router
//!
//! Provides multi-stream atomic batch dispatch, automated split-routing, and
//! cross-contract composability for `StellarStreamContract`.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token::Client as TokenClient, Address, Env,
    String, Symbol, Vec,
};

// ---------------------------------------------------------------------------
// Cross-Contract Types
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct BatchStreamParam {
    pub recipient: Address,
    pub token: Address,
    pub total_amount: i128,
    pub duration_seconds: u64,
    pub cliff_seconds: u64,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SplitAllocation {
    pub destination: Address,
    /// Basis points out of 10,000 (e.g., 8000 = 80%, 2000 = 20%)
    pub basis_points: u32,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RouterStats {
    pub total_batches_routed: u64,
    pub total_streams_routed: u64,
    pub total_volume_routed: i128,
}

#[contracttype]
pub enum RouterDataKey {
    Admin,
    DefaultStreamContract,
    Stats,
}

// ---------------------------------------------------------------------------
// Cross-Contract Client Interface for StellarStreamContract
// ---------------------------------------------------------------------------

mod stream_interface {
    use soroban_sdk::{contractclient, Address, Env, Map, String, Vec};

    #[contractclient(name = "StreamEscrowClient")]
    pub trait StreamEscrowInterface {
        fn create_stream(
            env: Env,
            sender: Address,
            recipient: Address,
            token: Address,
            total_amount: i128,
            start_time: u64,
            end_time: u64,
            min_claim_interval_seconds: u64,
            metadata: Option<Map<String, String>>,
        ) -> u64;

        fn claim(env: Env, stream_id: u64, recipient: Address) -> i128;
    }
}

use stream_interface::StreamEscrowClient;

// ---------------------------------------------------------------------------
// StreamRouter Contract Implementation
// ---------------------------------------------------------------------------

#[contract]
pub struct StreamRouterContract;

#[contractimpl]
impl StreamRouterContract {
    /// Initialize the router with an admin and default stream escrow contract address.
    pub fn initialize(env: Env, admin: Address, default_stream_contract: Address) {
        if env.storage().instance().has(&RouterDataKey::Admin) {
            panic!("router already initialized");
        }
        admin.require_auth();

        env.storage().instance().set(&RouterDataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&RouterDataKey::DefaultStreamContract, &default_stream_contract);

        let initial_stats = RouterStats {
            total_batches_routed: 0,
            total_streams_routed: 0,
            total_volume_routed: 0,
        };
        env.storage()
            .instance()
            .set(&RouterDataKey::Stats, &initial_stats);
    }

    /// Atomically creates multiple streams via cross-contract calls to StellarStreamContract.
    pub fn batch_create_streams(
        env: Env,
        sender: Address,
        stream_contract: Address,
        streams: Vec<BatchStreamParam>,
    ) -> Vec<u64> {
        sender.require_auth();

        let count = streams.len();
        if count == 0 {
            panic!("empty stream batch");
        }

        let escrow_client = StreamEscrowClient::new(&env, &stream_contract);
        let now = env.ledger().timestamp();
        let mut created_ids: Vec<u64> = Vec::new(&env);
        let mut batch_volume: i128 = 0;

        for i in 0..count {
            let item = streams.get(i).unwrap();
            if item.total_amount <= 0 {
                panic!("stream amount must be positive");
            }
            if item.duration_seconds == 0 {
                panic!("stream duration must be positive");
            }

            let end_time = now.saturating_add(item.duration_seconds);

            // Execute cross-contract invocation to StellarStreamContract
            let stream_id = escrow_client.create_stream(
                &sender,
                &item.recipient,
                &item.token,
                &item.total_amount,
                &now,
                &end_time,
                &0, // min_claim_interval_seconds
                &None,
            );

            created_ids.push_back(stream_id);
            batch_volume = batch_volume.saturating_add(item.total_amount);
        }

        // Update aggregate router accounting
        let mut stats: RouterStats = env
            .storage()
            .instance()
            .get(&RouterDataKey::Stats)
            .unwrap_or(RouterStats {
                total_batches_routed: 0,
                total_streams_routed: 0,
                total_volume_routed: 0,
            });

        stats.total_batches_routed = stats.total_batches_routed.saturating_add(1);
        stats.total_streams_routed = stats.total_streams_routed.saturating_add(count as u64);
        stats.total_volume_routed = stats.total_volume_routed.saturating_add(batch_volume);

        env.storage().instance().set(&RouterDataKey::Stats, &stats);

        // Emit Soroban event for indexer cursor synchronization
        env.events().publish(
            (symbol_short!("BatchDone"), sender),
            (count as u64, batch_volume),
        );

        created_ids
    }

    /// Claims an active stream and executes programmatic split routing to destinations.
    pub fn split_claim(
        env: Env,
        stream_contract: Address,
        stream_id: u64,
        recipient: Address,
        token: Address,
        allocations: Vec<SplitAllocation>,
    ) -> i128 {
        recipient.require_auth();

        let alloc_len = allocations.len();
        if alloc_len == 0 {
            panic!("empty split allocations");
        }

        // Validate that total basis points sum to exactly 10,000 (100%)
        let mut total_bps: u32 = 0;
        for i in 0..alloc_len {
            let alloc = allocations.get(i).unwrap();
            total_bps = total_bps.checked_add(alloc.basis_points).expect("bps overflow");
        }
        if total_bps != 10_000 {
            panic!("allocations must sum to 10,000 bps");
        }

        // Execute cross-contract claim against stream escrow
        let escrow_client = StreamEscrowClient::new(&env, &stream_contract);
        let claimed_amount = escrow_client.claim(&stream_id, &env.current_contract_address());

        if claimed_amount <= 0 {
            return 0;
        }

        let token_client = TokenClient::new(&env, &token);
        let this_contract = env.current_contract_address();

        let mut distributed_total: i128 = 0;
        for i in 0..alloc_len {
            let alloc = allocations.get(i).unwrap();
            // In the final allocation, assign all remaining tokens to avoid truncation dust
            let share = if i == alloc_len - 1 {
                claimed_amount.saturating_sub(distributed_total)
            } else {
                (claimed_amount * (alloc.basis_points as i128)) / 10_000
            };

            if share > 0 {
                token_client.transfer(&this_contract, &alloc.destination, &share);
                distributed_total = distributed_total.saturating_add(share);
            }
        }

        env.events().publish(
            (symbol_short!("SplitDone"), recipient),
            (stream_id, claimed_amount),
        );

        claimed_amount
    }

    /// Query global statistics of the StreamRouter
    pub fn get_stats(env: Env) -> RouterStats {
        env.storage()
            .instance()
            .get(&RouterDataKey::Stats)
            .unwrap_or(RouterStats {
                total_batches_routed: 0,
                total_streams_routed: 0,
                total_volume_routed: 0,
            })
    }
}
