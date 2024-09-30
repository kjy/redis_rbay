import 'dotenv/config';
import { client } from '../src/services/redis';
import { isConstructorDeclaration } from 'typescript';

const run = async () => { 
    await client.hSet('car1', {
        color: 'red',
        year: 1950
        // engine: { cylinders: 8 },
        // owner: null || '',
        // service: undefined || ''
    }); 
    await client.hSet('car2', {
        color: 'green',
        year: 1955
        // engine: { cylinders: 8 },
        // owner: null || '',
        // service: undefined || ''
    }); 
    await client.hSet('car3', {
        color: 'blue',
        year: 1960
        // engine: { cylinders: 8 },
        // owner: null || '',
        // service: undefined || ''
    });  
    // Batching commands together
    // Queued up commands for HGETALL
    const commands = [1,2,3].map((id) => {
        return client.hGetAll('car' + id);
    });
    
    // // Node Redis takes the object and turns it into a plain hgetall command that redis can understand
    // const car = await client.hGetAll('car');

    // if (Object.keys(car).length === 0) {
    //     console.log('Car not found, respond with 404');
    //     return;
    // }
    // console.log(car);

    const results = await Promise.all(commands);
    console.log(results);
};
run();


/*
Hash set is created
[Object: null prototype] {
  color: 'red',
  year: '1950',
  engine: '[object Object]',
  owner: '',
  service: ''
}
*/

/*
PIPELINING
Batching commands together
Queued up commands for HGETALL
Then send all commands in 1 connection
Example:

(base) karenjyang@Karens-MBP ~ % cd desktop
(base) karenjyang@Karens-MBP desktop % cd rbay
(base) karenjyang@Karens-MBP rbay % npm run sandbox

> rbay@0.0.1 sandbox
> ts-node-dev -T ./sandbox/index.ts

[INFO] 14:54:01 ts-node-dev ver. 1.1.8 (using ts-node ver. 9.1.1, typescript ver. 4.5.5)
[
  [Object: null prototype] { color: 'red', year: '1950' },
  [Object: null prototype] { color: 'green', year: '1955' },
  [Object: null prototype] { color: 'blue', year: '1960' }
]


*/
