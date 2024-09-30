import type { CreateBidAttrs, Bid } from '$services/types';
import { bidHistoryKey, itemsKey, itemsByPriceKey } from '$services/keys';
import { client, withLock } from '$services/redis';
import { DateTime } from 'luxon';
import { getItem } from './items';

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};

//for callback
export const createBid = async (attrs: CreateBidAttrs) => { 
    // what you want to lock down is attrs.itemId
	return withLock(attrs.itemId, async (lockedClient: typeof client, signal: any) => { // signal as to whether lock has expired, of any type
		// 1) Fetching the item
		// 2) Doing validation
		// 3) Writing some data
		const item = await getItem(attrs.itemId);

		await pause(5000); // after 5 seconds lock will have expired, so another process may acquire the lock

		//Validation checks
		if (!item) {
			throw new Error('Item does not exist');
		}
		if (item.price >= attrs.amount) {
			throw new Error('Bid too low');
		}
		if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
			throw new Error('Item closed to bidding'); // when time window runs out
		}

		const serialized = serializedHistory(attrs.amount, attrs.createdAt.toMillis()); // date object converted to number
		
		// list in redis has bids over time, oldest bids on left hand side and newest on right hand side of list
		// use rPush command to add bid by key
		// update item hash and save it in Redis
		// issue a second command by setting up a pipeline
		// refactor
		

		if (signal.expired) {
			throw new Error('Lock expired, cant write any more data');
		}

		return Promise.all([
			lockedClient.rPush(bidHistoryKey(attrs.itemId), serialized),
			lockedClient.hSet(itemsKey(item.id), {
				bids: item.bids + 1,
				price: attrs.amount,
				highestBidUserId: attrs.userId
			}),
			lockedClient.zAdd(itemsByPriceKey(), {
				value: item.id,
				score: attrs.amount
			})
		]);
	});

	// 	return client.executeIsolated(async (isolatedClient) => {
	// 		await isolatedClient.watch(itemsKey(attrs.itemId)); 
	// 		// concurrency issue--how to handle
	// 		// watch statement watches for a particular key hash. Fail the update of a second transaction.
	// 		// Fail the next transaction if the item key changes
	// 		// second approach -- use a retry mehanism but you have to deal with stale data.
	// 		// problem 1 with retry -- does not scale well, slows the redis server
	// 		// problem 2 with retry -- too much load on redis server from additional request to get information, latest item details
	// 		// data fetching runs again and again

		
	// 	const item = await getItem(attrs.itemId);

	// 	//Validation checks
	// 	if (!item) {
	// 		throw new Error('Item does not exist');
	// 	}
	// 	if (item.price >= attrs.amount) {
	// 		throw new Error('Bid too low');
	// 	}
	// 	if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
	// 		throw new Error('Item closed to bidding'); // when time window runs out
	// 	}

	// 	const serialized = serializedHistory(attrs.amount, attrs.createdAt.toMillis()); // date object converted to number
		
	// 	// list in redis has bids over time, oldest bids on left hand side and newest on right hand side of list
	// 	// use rPush command to add bid by key
	// 	// update item hash and save it in Redis
	// 	// issue a second command by setting up a pipeline
	// 	// refactor
	// 	//return Promise.all([
	// 	return isolatedClient
	// 		.multi() // set up a transaction
	// 		.rPush(bidHistoryKey(attrs.itemId), serialized) 
	// 		.hSet(itemsKey(item.id), {
	// 			bids: item.bids + 1,
	// 			price: attrs.amount,
	// 			highestBidUserId: attrs.userId
	// 		})
	// 		.zAdd(itemsByPriceKey(), {
	// 			value: item.id,
	// 			score: attrs.amount
	// 		})
	// 		.exec(); //fail silently, gives back a value of null
	// });
};
	

// return an array of bid objects that look like [{ amount: 5, createdAt: DateTime }, {amount: 7, createdAt: DateTime } ]
// there may be a lot of bids for an item, you want to show only 10 recent bids
// offset and count are used for pagination
// offset = 0 means to start at the last bid, and count of 5 means take the last 5 bids
export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const startIndex = -1 * offset - count;
	const endIndex = -1 - offset;

	const range = await client.lRange( // see range calculation below
		bidHistoryKey(itemId),
		startIndex,
		endIndex
	)
	return range.map(bid => deserializedHistory(bid));
};

// create serialize function
// unix time in milliseconds
const serializedHistory = (amount: number, createdAt: number) => {  // bid amount and datetime stamp in unix time milliseconds
	return `${amount}:${createdAt}`; // template string with colon as a separator 
};
// deserialize function
const deserializedHistory = (stored: string) => {  // stored string value we get out of the list in redis
	// you get a string out of redis, need to separate by colon, and then parse out
	const [amount, createdAt] = stored.split(':'); // destructuring, 2 variable assignments, strings need to be converted to number

	return {
		amount: parseFloat(amount), // decimal number so use float
		createdAt: DateTime.fromMillis(parseInt(createdAt)) // string converts to integer and then becomes a datetime object	
	};
};

/*
LRANGE calculation - From the end of list
Offset = 2
Count = 3

How to calculate range from offset and count/*
ending: (-1 - offset)
start: (-1*offset - count)

Range -5 to -3



Concurrency system will implement a simplified version of the Redlock algorithm
On any serious project, use Redlock isntead of what we're building here

https://redis.io/docs/latest/develop/use/patterns/distributed-locks/

example node redlock
https://github.com/mike-marcacci/node-redlock
*/


