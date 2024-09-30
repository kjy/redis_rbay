import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils'; // create a unique id
import { client } from '$services/redis';
import { usersKey, usernamesUniqueKey, usernamesKey } from '$services/keys';

// get username to get back a user
export const getUserByUsername = async (username: string) => {
    // use the username argument to look up the persons User id with the usernames sorted set
    const decimalId = await client.zScore(usernamesKey(), username);

    // make sure we actually got an ID from the lookup
    if (!decimalId) {
        throw new Error('User does not exist');
    }
    // take the id and vonert it back to hex (base 16)
    const id = decimalId.toString(16);

    // use the id to look up the user's hash
    const user = await client.hGetAll(usersKey(id));

    // deseralize and return the hash
    return deserialize(id, user);
};

export const getUserById = async (id: string) => {

    const user = await client.hGetAll(usersKey(id)); // object user has a hash of key/value in redis

    return deserialize(id, user);
};

// when people sign up
export const createUser = async (attrs: CreateUserAttrs) => {  // CreateUserAttrs has user name and password
    const id = genId(); // gives a string like 1k2j4l1k 

    // See if the username is already in the set of usernames
    const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username);
    // If so, throw an error
    if (exists) {
        throw new Error('Username is taken');
    }
    // Otherwise, continue
    await client.hSet(usersKey(id), serialize(attrs));
    await client.sAdd(usernamesUniqueKey(), attrs.username);
    //  // Node redis library will have a userkeyid that has a username/password stored in redis, saves as a string
    //     // this is like serialization
    //     username: attrs.username,
    //     password: attrs.password

    await client.zAdd(usernamesKey(), {
        value: attrs.username,
        score: parseInt(id, 16)    // represents a number in hexadecimal base 16 need to convert to base 10 value later
    });
    return id;
};

const serialize = (user: CreateUserAttrs) => {
    return {
        username: user.username,
        password: user.password
    }
}

const deserialize = (id: string, user: { [key: string]: string }) => {
    return {
        //id: id, key and value are the same
        id,
        username: user.username,
        password: user.password
    }
}


