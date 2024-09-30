import type { Item } from '$services/types';
import { DateTime } from 'luxon';
import { itemsByPrice } from './by-price';

//item is data pulled out of redis
export const deserialize = (id: string, item: { [key: string]: string }): Item => {
    return {
        id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        highestBidUserId: item.highestBidUserId,
        ownerId: item.ownerId,
        createdAt:DateTime.fromMillis(parseInt(item.createdAt)),
        endingAt: DateTime.fromMillis(parseInt(item.endingAt)),
        views: parseInt(item.views),
        likes: parseInt(item.likes),
        bids: parseInt(item.bids),
        price: parseFloat(item.price)
    };
};







/*
types.ts file

export interface Item {
	id: string;
	name: string;
	ownerId: string;
	imageUrl: string;
	description: string;
	createdAt: DateTime;
	endingAt: DateTime;
	views: number;
	likes: number;
	price: number;
	bids: number;
	highestBidUserId: string;
}
    */


