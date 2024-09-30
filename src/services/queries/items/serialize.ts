import type { CreateItemAttrs } from '$services/types';

export const serialize = (attrs: CreateItemAttrs) => {
    return {
        // name: attrs.name,
        // imageUrl: attrs.imageUrl
        ...attrs, // takes properties of objects and carries it over
        createdAt: attrs.createdAt.toMillis(), // datetime object converted to milliseconds
        endingAt: attrs.endingAt.toMillis()

    };
};
