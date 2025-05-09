// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Implementation of auction module.
module iota_names_auction::auction;

use iota::balance::{Self, Balance};
use iota::clock::Clock;
use iota::coin::{Self, Coin};
use iota::event;
use iota::iota::IOTA;
use iota::linked_table::{Self, LinkedTable};
use iota_names::core_config::CoreConfig;
use iota_names::domain::{Self, Domain};
use iota_names::iota_names::{Self, AdminCap, IotaNames};
use iota_names::iota_names_registration::IotaNamesRegistration;
use iota_names::pricing_config::PricingConfig;
use iota_names::registry::Registry;
use std::option::{none, some, is_some};
use std::string::String;

/// One year is the default duration for a domain.
const DEFAULT_DURATION: u8 = 1;
/// The auction bidding period is 1 hour.
const AUCTION_BIDDING_PERIOD_MS: u64 = 60 * 60 * 1000;
/// The auction quiet period is 10 minutes.
const AUCTION_MIN_QUIET_PERIOD_MS: u64 = 10 * 60 * 1000;
/// The overbid must be at least of 1 IOTA, which is 10^9 NANOs
const AUCTION_MIN_OVERBID_VALUE_IOTA: u64 = 1_000_000_000;
// === Abort codes ===

#[error]
const EInitialBidTooLow: vector<u8> = b"The initial bid is too low.";
#[error]
const EAuctionStarted: vector<u8> = b"Trying to start an action but it's already started.";
#[error]
const EAuctionNotStarted: vector<u8> = b"Placing a bid in a not started auction.";
#[error]
const EAuctionNotEnded: vector<u8> = b"The auction has not ended.";
#[error]
const EAuctionEnded: vector<u8> = b"The auction ended.";
#[error]
const ENotWinner: vector<u8> = b"Not winner of the auction.";
#[error]
const EBidTooLow: vector<u8> = b"The bid is too low, minimum overbid should be at least 1 IOTA.";
#[error]
const ENoProfits: vector<u8> = b"There are no profits to withdraw.";

/// Authorization witness to call protected functions of `iota_names`.
public struct AuctionAuth has drop {}

/// The AuctionHouse application.
public struct AuctionHouse has key, store {
    id: UID,
    balance: Balance<IOTA>,
    auctions: LinkedTable<Domain, Auction>,
}

/// The Auction application.
#[allow(lint(coin_field))]
public struct Auction has store {
    domain: Domain,
    start_timestamp_ms: u64,
    end_timestamp_ms: u64,
    winner: address,
    current_bid: Coin<IOTA>,
    nft: IotaNamesRegistration,
}

fun init(ctx: &mut TxContext) {
    iota::transfer::share_object(AuctionHouse {
        id: object::new(ctx),
        balance: balance::zero(),
        auctions: linked_table::new(ctx),
    });
}

/// Start an auction if it's not started yet; and make the first bid.
public fun start_auction_and_place_bid(
    self: &mut AuctionHouse,
    iota_names: &mut IotaNames,
    domain_name: String,
    bid: Coin<IOTA>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    iota_names.assert_is_authorized<AuctionAuth>();

    let domain = domain::new(domain_name);

    iota_names.get_config<CoreConfig>().assert_is_valid_for_sale(&domain);

    assert!(!self.auctions.contains(domain), EAuctionStarted);

    let min_price = iota_names
        .get_config<PricingConfig>()
        .calculate_base_price(domain.sld().length());
    assert!(bid.value() >= min_price, EInitialBidTooLow);

    let registry = iota_names::auth_registry_mut<AuctionAuth, Registry>(AuctionAuth {}, iota_names);
    let nft = registry.add_record(domain, DEFAULT_DURATION, clock, ctx);
    let starting_bid = bid.value();

    let auction = Auction {
        domain,
        start_timestamp_ms: clock.timestamp_ms(),
        end_timestamp_ms: clock.timestamp_ms() + AUCTION_BIDDING_PERIOD_MS,
        winner: ctx.sender(),
        current_bid: bid,
        nft,
    };

    event::emit(AuctionStartedEvent {
        domain,
        start_timestamp_ms: auction.start_timestamp_ms,
        end_timestamp_ms: auction.end_timestamp_ms,
        starting_bid,
        bidder: auction.winner,
    });

    self.auctions.push_front(domain, auction)
}

/// #### Notice
/// Bidders use this function to place a new bid.
///
/// Panics
/// Panics if `domain` is invalid
/// or there isn't an auction for `domain`
/// or `bid` is too low,
public fun place_bid(
    self: &mut AuctionHouse,
    domain_name: String,
    bid: Coin<IOTA>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let domain = domain::new(domain_name);
    let bidder = ctx.sender();

    assert!(self.auctions.contains(domain), EAuctionNotStarted);

    let Auction {
        domain,
        start_timestamp_ms,
        mut end_timestamp_ms,
        winner,
        current_bid,
        nft,
    } = self.auctions.remove(domain);

    // Ensure that the auction is not over
    assert!(clock.timestamp_ms() <= end_timestamp_ms, EAuctionEnded);

    // get the current highest bid and ensure that the new bid is greater than
    // the current winning bid
    let current_winning_bid = current_bid.value();
    let bid_amount = bid.value();
    assert!(bid_amount >= current_winning_bid + AUCTION_MIN_OVERBID_VALUE_IOTA, EBidTooLow);

    // Return the previous winner their bid
    iota::transfer::public_transfer(current_bid, winner);

    event::emit(BidEvent {
        domain,
        bid: bid_amount,
        bidder,
    });

    // If there is less than `AUCTION_MIN_QUIET_PERIOD_MS` time left on the
    // auction
    // then extend the auction so that there is `AUCTION_MIN_QUIET_PERIOD_MS`
    // left.
    // Auctions can't be finished until there is at least
    // `AUCTION_MIN_QUIET_PERIOD_MS`
    // time where there are no bids.
    if (end_timestamp_ms - clock.timestamp_ms() < AUCTION_MIN_QUIET_PERIOD_MS) {
        let new_end_timestamp_ms = clock.timestamp_ms() + AUCTION_MIN_QUIET_PERIOD_MS;

        // Only extend the auction if the new auction end time is before
        // the NFT's expiration timestamp
        if (new_end_timestamp_ms < nft.expiration_timestamp_ms()) {
            end_timestamp_ms = new_end_timestamp_ms;

            event::emit(AuctionExtendedEvent {
                domain,
                end_timestamp_ms: end_timestamp_ms,
            });
        }
    };

    let auction = Auction {
        domain,
        start_timestamp_ms,
        end_timestamp_ms,
        winner: tx_context::sender(ctx),
        current_bid: bid,
        nft,
    };

    self.auctions.push_front(domain, auction);
}

/// #### Notice
/// Auction winner can come and claim the NFT
///
/// Panics
/// sender is not the winner
public fun claim(
    self: &mut AuctionHouse,
    domain_name: String,
    clock: &Clock,
    ctx: &mut TxContext,
): IotaNamesRegistration {
    let domain = domain::new(domain_name);

    let Auction {
        domain: _,
        start_timestamp_ms,
        end_timestamp_ms,
        winner,
        current_bid,
        nft,
    } = self.auctions.remove(domain);

    // Ensure that the auction is over
    assert!(clock.timestamp_ms() > end_timestamp_ms, EAuctionNotEnded);

    // Ensure the sender is the winner
    assert!(ctx.sender() == winner, ENotWinner);

    event::emit(AuctionFinalizedEvent {
        domain,
        start_timestamp_ms,
        end_timestamp_ms,
        winning_bid: coin::value(&current_bid),
        winner,
    });

    // Extract the NFT and their bid, returning the NFT to the user
    // and add the bid amount to the AuctionHouse
    self.balance.join(current_bid.into_balance());
    nft
}

// === Public Functions ===

/// #### Notice
/// Get metadata of an auction
///
/// #### Params
/// The domain name being auctioned.
///
/// #### Return
/// (`start_timestamp_ms`, `end_timestamp_ms`, `winner`, `highest_amount`)
public fun get_auction_metadata(
    self: &AuctionHouse,
    domain_name: String,
): (Option<u64>, Option<u64>, Option<address>, Option<u64>) {
    let domain = domain::new(domain_name);

    if (self.auctions.contains(domain)) {
        let auction = &self.auctions[domain];
        let highest_amount = auction.current_bid.value();
        return (
            some(auction.start_timestamp_ms),
            some(auction.end_timestamp_ms),
            some(auction.winner),
            some(highest_amount),
        )
    };
    (none(), none(), none(), none())
}

/// Collect the bid amount into the auction house balance without moving the NFT out of the auction.
public fun collect_winning_auction_fund(
    self: &mut AuctionHouse,
    domain_name: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let domain = domain::new(domain_name);
    let auction = &mut self.auctions[domain];
    // Ensure that the auction is over
    assert!(clock.timestamp_ms() > auction.end_timestamp_ms, EAuctionNotEnded);

    let amount = auction.current_bid.value();
    self.balance.join(auction.current_bid.split(amount, ctx).into_balance());
}

// === Admin Functions ===

public fun admin_withdraw_funds(
    _: &AdminCap,
    self: &mut AuctionHouse,
    ctx: &mut TxContext,
): Coin<IOTA> {
    let amount = self.balance.value();
    assert!(amount > 0, ENoProfits);
    coin::take(&mut self.balance, amount, ctx)
}

/// Admin functionality used to finalize a single auction.
///
/// This will:
/// - claim the winning bid and place in the `AuctionHouse` balance
/// - transfer the `IotaNamesRegistration` to the winner
///
/// Once all of the above has been done the auction is destroyed,
/// freeing on-chain storage.
public fun admin_finalize_auction(
    admin: &AdminCap,
    self: &mut AuctionHouse,
    domain: String,
    clock: &Clock,
) {
    let domain = domain::new(domain);
    admin_finalize_auction_internal(admin, self, domain, clock);
}

fun admin_finalize_auction_internal(
    _: &AdminCap,
    self: &mut AuctionHouse,
    domain: Domain,
    clock: &Clock,
) {
    let Auction {
        domain: _,
        start_timestamp_ms,
        end_timestamp_ms,
        winner,
        current_bid,
        nft,
    } = self.auctions.remove(domain);

    // Ensure that the auction is over
    assert!(clock.timestamp_ms() > end_timestamp_ms, EAuctionNotEnded);

    event::emit(AuctionFinalizedEvent {
        domain,
        start_timestamp_ms,
        end_timestamp_ms,
        winning_bid: coin::value(&current_bid),
        winner,
    });

    self.balance.join(current_bid.into_balance());
    transfer::public_transfer(nft, winner);
}

/// Admin functionality used to finalize an arbitrary number of auctions.
///
/// An `operation_limit` limit must be provided which controls how many
/// individual operations to perform. This allows the admin to be able to
/// make forward progress in finalizing auctions even in the presence of
/// thousands of auctions/bids.
public fun admin_try_finalize_auctions(
    admin: &AdminCap,
    self: &mut AuctionHouse,
    mut operation_limit: u64,
    clock: &Clock,
) {
    let mut next_domain = *self.auctions.back();

    while (is_some(&next_domain)) {
        if (operation_limit == 0) {
            return
        };
        operation_limit = operation_limit - 1;

        let domain = option::extract(&mut next_domain);
        next_domain = *self.auctions.prev(domain);

        let auction = &self.auctions[domain];

        // If the auction has ended, then try to finalize it
        if (clock.timestamp_ms() > auction.end_timestamp_ms) {
            admin_finalize_auction_internal(
                admin,
                self,
                domain,
                clock,
            );
        };
    };
}

// === Events ===

public struct AuctionStartedEvent has copy, drop {
    domain: Domain,
    start_timestamp_ms: u64,
    end_timestamp_ms: u64,
    starting_bid: u64,
    bidder: address,
}

public struct AuctionFinalizedEvent has copy, drop {
    domain: Domain,
    start_timestamp_ms: u64,
    end_timestamp_ms: u64,
    winning_bid: u64,
    winner: address,
}

public struct BidEvent has copy, drop {
    domain: Domain,
    bid: u64,
    bidder: address,
}

public struct AuctionExtendedEvent has copy, drop {
    domain: Domain,
    end_timestamp_ms: u64,
}

// === Testing ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx)
}

#[test_only]
public fun total_balance(self: &AuctionHouse): u64 {
    self.balance.value()
}
