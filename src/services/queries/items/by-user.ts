import { client } from '$services/redis';
import { itemsIndexKey } from '$services/keys';
import { deserialize } from './deserialize';
import { killDaemon } from 'pm2';

interface QueryOpts {
	page: number;
	perPage: number;
	sortBy: string;
	direction: string;
}
// dashboard page for "Your Items"
export const itemsByUser = async (userId: string, opts: QueryOpts) => {

	// query we will search with
	const query = `@ownerId:{${userId}}`;

	const sortCriteria = opts.sortBy && opts.direction && {
		// if given a sort field, then assign to sort critiera
		BY: opts.sortBy, DIRECTION: opts.direction
	};

	// search
	// sort
	// pagination

	const { total, documents }  = await client.ft.search(
		itemsIndexKey(),
		query,
		{
			ON: 'HASH',
			SORTBY: sortCriteria,
			LIMIT: {
				from: opts.page * opts.perPage,
				size: opts.perPage
			}
		} as any);

		console.log(total, documents);
	

	return  {
		totalPages: Math.ceil(total / opts.perPage),
		items: documents.map(({ id, value }) => { // id is the key at which the item is stored
			return deserialize(id.replace('items#', ''),
		value as any);
		})

	};
};
