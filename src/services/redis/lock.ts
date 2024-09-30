import { client } from './client';
import { randomBytes } from 'crypto';

// withLock implementation
export const withLock = async (key: string, cb: (redisClient: Client, signal: any) => any) => { // see bids.ts file
	//Initialize a few variables to control retry behavior
	const retryDelayMs = 100;
	const timeoutMs = 2000;
	let retries = 20;

	// Generate a random value to store at the lock keyry behavior
	const token = randomBytes(6).toString('hex'); // 'aksfjklafjkl14lj'

	// Create the lock key 
	const lockKey = `lock:${key}`;

	// Set up a while loop to implement the retry behavior
	while (retries >= 0) {  //retry in case of crashing
		retries--;
		// Try to do a SET NX operation
		const acquired = await client.set(lockKey, token, {
			NX: true,
			PX: timeoutMs, // unset the value 2 seconds (2000 milliseconds), 
			// when process1 has a lock, it has 2 seconds to do work, after 2 seconds, value is deleted, then process2 can happen
		});
		if (!acquired) {
			//ELSE brief pause(retryDelayMs) and then retry
			await pause(retryDelayMs);
			continue;
		}
		// IF the set is successful, then run the callback
		try {
			const signal = { expired: false };
			setTimeout(() => {
				signal.expired = true;
			}, timeoutMs);


			const proxiedClient = buildClientProxy(timeoutMs);
			const result = await cb(proxiedClient,signal); // try to run the callback
			return result;
		} finally { 
				// Unset the locked set
				await client.unlock(lockKey, token); // delete the lock, unlock the key, see client.ts script
			}
		}
	};

	type Client = typeof client;
const buildClientProxy = (timeoutMs: number) => {
	const startTime = Date.now();

	const handler = {
		// any time someone uses a method on the redis client, we are going to see if the lock has expired
		// if it has expired, then we throw an error
		// if not expired, then allow a method to be called
		get(target: Client, prop: keyof Client) {
			if (Date.now() >= startTime + timeoutMs) {
				throw new Error('Lock has expired.');
			}
            // proxies
			const value = target[prop];
            return typeof value === 'function' ? value.bind(target) : value;

		}
	}
	return new Proxy(client, handler) as Client;
};

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};


/*
If some other process has acquired the lock, then need to address the issue.
Send a command from server to redis
Corner case:  Period of time for process1, lock, 
Delay happens = Takes time for delete command to be sent from server to redis
Key issue is the delay in the DEL command.
Lock expires (unsets)
Redis clear out current value of "Hi", no value
Issue: another process might come in, process2 SET NX, delete command comes in and deletes the value that process 2 sent to redis

Process3 tries to do a SET NX. 
Both Process2 and Process3 both think they have the lock on their keys.

How to make sure you do not unset someone elses token?
Use GET
Is response === original token?
If true, then run the delete (unlock)

Run
EVALSHA ID 1 lock:item:a1 'hi'

Lua Script:

Is the lock token here still what it was when we set it?
if GET(KEYS[1]) == ARGV[1] then 
	DEL(KEYS[1])
end

If process is still in control of the lock, then do:
if GET('lock:item:a1') == ARGV[1] then 
	DEL('lock:item:a1')
end

related files
src > services> redis > client.ts
src > services> queries > bids.ts

 */
