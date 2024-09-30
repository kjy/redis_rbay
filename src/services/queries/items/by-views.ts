import { client } from '$services/redis';
import { itemsKey, itemsByViewsKey } from '$services/keys';
import { deserialize } from './deserialize';

export const itemsByViews = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
    let results: any = await client.sort(
        itemsByViewsKey(),
        {
          GET: [
              '#',
              `${itemsKey('*')}->name`,
              `${itemsKey('*')}->views`,
              `${itemsKey('*')}->endingAt`,
              `${itemsKey('*')}->imageUrl`,
              `${itemsKey('*')}->price`,
          ],
          BY: 'nosort',
          DIRECTION: order,
          LIMIT: {
            offset,
            count
          }
        });
        //console.log(results); // gives an array of strings
        const items = [];
        while (results.length) {
          const [id, name, views, endingAt, imageUrl, price, ...rest] = results
          const item = deserialize(id, { name, views, endingAt, imageUrl, price });
          items.push(item);
          results = rest;
        }
        return items;
};


/*
sort command in action
6:28:57 PM [vite] page reload src/services/queries/items/by-ending-time.ts
[
  '038162', 'sofa',   '1',      '1adfc2',
  'bed',    '1',      '5c5e9c', 'Table',
  '1',      '7b88a9', 'couch',  '1',
  '7f9e23', 'Chair',  '1',      'be2220',
  'Couch',  '1',      'c34cc7', 'Chair',
  '1',      'd43559', 'desk',   '1',
  'd985c4', 'table',  '1',      '1bb37e',
  'Chair',  '2',      'b7b8fd', 'Chair',
  '6'
]
[
  '038162', 'sofa',   '1',      '1adfc2',
  'bed',    '1',      '5c5e9c', 'Table',
  '1',      '7b88a9', 'couch',  '1',
  '7f9e23', 'Chair',  '1',      'be2220',
  'Couch',  '1',      'c34cc7', 'Chair',
  '1',      'd43559', 'desk',   '1',
  'd985c4', 'table',  '1',      '1bb37e',
  'Chair',  '2',      'b7b8fd', 'Chair',
  '6'
]
*/