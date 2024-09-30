import {client } from '$services/redis';
//import { itemsKey, itemsByViewsKey, itemsViewsKey } from '$services/keys';

export const incrementView = async (itemId: string, userId: string) => {
    return client.incrementView(itemId, userId);
};

/*
// define a custom function to node Redis client
// run a custom Lua script that will be loaded into Redis for us

Scripting Design pattern
Identify all the keys and arguments you want to access
Assign the keys (KEYS) and arguments (ARGV) to well-labeled variables at the top of the script
Write your logic
Don't forget to return a value if you need to

// Keys I need to access
1. itemsViewsKey
2. itemsKey -> items#alskdjfkdlkafj
3. itemsByViewsKey

Arguments I need ot accept
1. itemId
2. userId

EVALSHA ID 3
*/

