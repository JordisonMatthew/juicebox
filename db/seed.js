const { 
    client,
    getAllUsers,
    createUser
} = require('./index');


const dropTables = async () => {
    try {
        console.log("Starting to drop tables...");
        await client.query(`
        DROP TABLE IF EXISTS users;
        `)

        console.log("finished dropping tables!");
    } catch (err) {
        console.error("Error dropping tables!");
        throw err;
    }
}

const createTables = async () => {
    try {
        console.log('Starting to build tables...');

        await client.query(`
        CREATE TABLE USERS(
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL
        );
        `);

        console.log('Finished building tables!');
    } catch (err) {
        console.error('Error building tables!');
        throw err;
    }
}

const createInitialUsers = async () => {
    try {
        console.log('Starting to create users...');

        const albert = await createUser({username: 'albert', password: 'bertie99'});
        const sandra = await createUser({username: 'sandra', password: '2sandy4me'});
        const glamgal = await createUser({username: 'glamgal', password: 'soglam'});

        console.log(albert);

        console.log('Finished creating users!');
    } catch (err) {
        console.error('Error creating users!');
        throw err;
    }
}
const rebuildDB = async () => {
    try {
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
    } catch (err) {
        throw err;
    }
}
const testDB = async () => {
    try {
        console.log('Starting to test database...');

        const users = await getAllUsers();
        console.log('getAllUsers:', users);

        console.log('Finished database tests!');
    } catch(err) {
        console.error('Error testing database!');
        throw err;
    } 
}

rebuildDB().then(testDB).catch(console.error).finally(() => {
    client.end()
});