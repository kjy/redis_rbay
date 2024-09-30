import { client } from '$services/redis';
import { userLikesKey, itemsKey } from '$services/keys';
import { getItems } from './items';

//button stays green or not for like, even after refreshing
export const userLikesItem = async (itemId: string, userId: string) => {
    return client.sIsMember(userLikesKey(userId), itemId);
};

export const likedItems = async (userId: string) => {
    // Fetch all the item ID's from this user's liked set
    const ids = await client.sMembers(userLikesKey(userId));

    // Fetch all the item hashes with those ids and return as array
    return getItems(ids);

};

export const likeItem = async (itemId: string, userId: string) => {
    const inserted = await client.sAdd(userLikesKey(userId), itemId);
    // if 2 requests come in at the same time, you only want to add 1 like to the items's key-value hash
    if (inserted) {
        return client.hIncrBy(itemsKey(itemId), 'likes', 1);
    }   
};

export const unlikeItem = async (itemId: string, userId: string) => {
    const removed = await client.sRem(userLikesKey(userId), itemId);

    if (removed) {
        return client.hIncrBy(itemsKey(itemId), 'likes', -1);
    }
};

export const commonLikedItems = async (userOneId: string, userTwoId: string) => {
    const ids = await client.sInter([userLikesKey(userOneId), userLikesKey(userTwoId)]);

    return getItems(ids);
};
