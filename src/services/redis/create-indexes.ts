import { SchemaFieldTypes } from 'redis';
import { client } from './client';
import { itemsIndexKey, itemsKey } from '$services/keys';

export const createIndexes = async () => { 
    const indexes = await client.ft._list(); // will give us back an array of strings
    
    const exists = indexes.find(index => index === itemsIndexKey());

    if (exists) {
        return;
    }
    // create client index with node redis
    // 3 arguments: where to store this index--give key, object describing the fields we want to index and types, options for structure type like a hash
     
    return client.ft.create(
        itemsIndexKey(),
        {
            name: {
                type: SchemaFieldTypes.TEXT,
                sortable: true
            },
            description: {
                type: SchemaFieldTypes.TEXT,
                sortable: false
                },
                ownerId:{
                    type: SchemaFieldTypes.TAG,
                    sortable: false
                },
                endingAt: {
                    type: SchemaFieldTypes.NUMERIC,
                    sortable: true
                },
                bids: {
                    type: SchemaFieldTypes.NUMERIC,
                    sortable: true
                },
                views: {
                    type: SchemaFieldTypes.NUMERIC,
                    sortable: true
                },
                price: {
                    type: SchemaFieldTypes.NUMERIC,
                    sortable: true
                },
                likes: {
                    type: SchemaFieldTypes.NUMERIC,
                    sortable: true
                }
        } as any,
        {
            ON: 'HASH',
            PREFIX: itemsKey('') // helps us to not make typos, 'items#'
        }
    );
};



/*

[
  {
    id: 'items#7261ff',
    value: [Object: null prototype] {
      name: 'Sofa',
      description: 'This is a fantastic sofa that you would be quite happy with!',
      createdAt: '1727655298858',
      endingAt: '1727741698859',
      imageUrl: 'https://realrealreal-redis.s3.amazonaws.com/93.jpg',
      ownerId: 'fccb22',
      highestBidUserId: '',
      price: '0',
      views: '1',
      likes: '0',
      bids: '0',
      status: ''
    }
  },
  {
    id: 'items#f427d3',
    value: [Object: null prototype] {
      name: 'new chair',
      description: 'This is a fantastic chair that you would be quite happy with!',
      createdAt: '1727655020302',
      endingAt: '1727741420303',
      imageUrl: 'https://realrealreal-redis.s3.amazonaws.com/71.jpg',
      ownerId: 'fccb22',
      highestBidUserId: '',
      price: '0',
      views: '1',
      likes: '1',
      bids: '0',
      status: ''
    }
  }
]
  */