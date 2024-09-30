
export const pageCacheKey = (id: string) => `pagecache#${id}`;

// create function user  id in redis,  // example users#kj525e is the key that will give you back the hash (key, value)
export const usersKey = (userId: string) => `users#${userId}`; 

export const sessionsKey = (sessionId: string) => `sessions#${sessionId}`;

export const usernamesUniqueKey = () => 'usernames:unique';

export const userLikesKey = (userId: string) => `users: likes#${userId}`;

export const usernamesKey = () => 'usernames';

// Items
export const itemsKey = (itemId: string) => `items#${itemId}`;
export const itemsByViewsKey = () => 'items:views'; // sorted set
export const itemsByEndingAtKey = () => 'items: endingAt';
export const itemsViewsKey = (itemId: string) => `items:views#${itemId}`;
export const bidHistoryKey = (itemId: string) => `history#${itemId}`;  // Every item has its own list of bids
export const itemsByPriceKey = () => 'items:price';
export const itemsIndexKey = () => 'idx:items';


