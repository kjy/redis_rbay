import { createClient, defineScript } from 'redis';
import { itemsKey, itemsByViewsKey, itemsViewsKey } from '$services/keys';
import { createIndexes } from './create-indexes';

const client = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT)
	},
	password: process.env.REDIS_PW,
	scripts: { // Lua script
		unlock: defineScript({
			NUMBER_OF_KEYS: 1,
			transformArguments(key: string, token: string) {
				return [key, token]
			},
			transformReply(reply: any) {
				return reply;
			},
			SCRIPT:`
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('DEL', KEYS[1])
				end
			`

		}),
		addOneAndStore: defineScript({
			NUMBER_OF_KEYS: 1,
			SCRIPT: `
			return redis.call('SET', KEYS[1], 1 + tonumber(ARGV[1]))
			`,
			transformArguments(key: string, value: number) {
				return [key, value.toString()]
				// ['books: count', '5']
				// EVALSHA <ID> 1 'books: count' '5'
			},
			transformReply(reply: any) {
				return reply;
			}
		}),
		incrementView: defineScript({
			NUMBER_OF_KEYS: 3,
			SCRIPT: `
				local itemsViewsKey = KEYS[1]
				local itemsKey = KEYS[2]
				local itemsByViewsKey = KEYS[3]
				local itemId = ARGV[1]
				local userId = ARGV[2]

				local inserted = redis.call('PFADD', itemsViewsKey, userId)

				if inserted == 1 then
					redis.call('HINCRBY', itemsKey, 'views', 1)
					redis.call('ZINCRBY', itemsByViewsKey, 1, itemId)
				end
			`,
			transformArguments(itemId: string, userId: string) {
				return [
					itemsViewsKey(itemId), // generates a string -> items: views#asfd
					itemsKey(itemId), // generates a string -> items#asdf 
					itemsByViewsKey(), // generates a string  -> items: views
					itemId, // -> asdf
					userId // -> u123
				];
				// EVALSHA ID 3 items: views#asdf items#asdf items: views asdf u123
			},
			transformReply(){}
		})
	}
});
//client object has a method
// client.on('connect', async () => {
// 	await client.addOneAndStore('books: count', 10);
// 	const result = await client.get('books: count');
// 	console.log(result); // 11
// });

client.on('error', (err) => console.error(err));
client.connect();

client.on('connect', async () => {
	try {
		await createIndexes();
	} catch (err) {
		console.error(err);
	}	
});

export { client };
