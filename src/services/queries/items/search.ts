import { client } from '$services/redis';
import { deserialize } from './deserialize';
import { itemsIndexKey } from '$services/keys';

export const searchItems = async (term: string, size: number = 5) => { // number of results we get back, first 5
    // fuzzy search, take string and do some pre-processing, wrap search terms, AND or OR operations

    // cleaned up search term, parsing operation
    const cleaned = term
    .replaceAll(/[^a-zA-Z0-9 ]/g, '') // find all characters that are not alphanumeric and remove them from the string
    .trim() // remove any extra spaces
    .split(' ') // split words on space
    .map((word) => word ? `%${word}%` : '') // removing empty spaces that weren't removed in  initial trim
    .join(' ');

    // search operation -- Look at cleaned and make sure it is valid
    if (cleaned === '') {
        return [];
    }
    // For search box, you put in a term
    // Look for the field with name cleaned and give 5x weight importance to this search term if found in item's name AND/OR description
    const query = `(@name:(${cleaned}) => { $weight: 5.0 })  | (@description:(${cleaned}))`;

    // Use the client to do an acutal search
    const results = await client.ft.search(
        itemsIndexKey(),
        query,  { // full text search
            LIMIT: {
                from: 0,
                size: size   
            }
        });
        console.log(results);


    // Deserialize and return the search results
    return results.documents.map(({id, value}) => deserialize(id, value as any))
};



/*
In terminal
Serialized item hash: Object: null prototype
{
  total: 3,
  documents: [
    { id: 'items#ac2546', value: [Object: null prototype] },
    { id: 'items#315e3c', value: [Object: null prototype] },
    { id: 'items#1608fc', value: [Object: null prototype] }
  ]
}
*/
