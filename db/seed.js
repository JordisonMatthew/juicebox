const { 
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost,
    getAllPosts,
    getUserById,
    getPostsByTagName,
    getAllTags
    
} = require('./index');


// Removes the all the tables from the sql database
const dropTables = async () => {
    try {
        console.log("Starting to drop tables...");

        await client.query(`
        DROP TABLE IF EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS users;
        `)

        console.log("finished dropping tables!");
    } catch (err) {
        console.error("Error dropping tables!");
        throw err;
    }
}

// creates all the tables in the sql database
const createTables = async () => {
    try {
        console.log('Starting to build tables...');

        await client.query(`
        CREATE TABLE users(
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            active BOOLEAN DEFAULT true
        );
        `);

        await client.query(`
        CREATE TABLE posts(
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );`);

        await client.query(`
        CREATE TABLE tags(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );`);

        await client.query(`
        CREATE TABLE post_tags(
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE ("postId", "tagId")
        );`);

        console.log('Finished building tables!');
    } catch (err) {
        console.error('Error building tables!');
        throw err;
    }
}

// creates the initial users in the sql database
const createInitialUsers = async () => {
    try {
        console.log('Starting to create users...');

        await createUser({
            username: 'albert', password: 'bertie99', name: 'Albert',
            location: 'Alberta, Canada'});
        await createUser({
            username: 'sandra', password: '2sandy4me', name: 'Sandra',
            location: 'Sandy Shores, Conneticut'});
        await createUser({
            username: 'glamgal', password: 'soglam', name: 'Robert',
            location: 'New York City'});

        console.log('Finished creating users!');
    } catch (err) {
        console.error('Error creating users!');
        throw err;
    }
}

// creates the initial posts posted by the users in the sql database
const createInitialPosts = async () => {
    try {
        const [albert, sandra, glamgal] = await getAllUsers();

        console.log('Creating initial Posts...')
        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post. I hope I love writing blogs as much as I love reading them.",
            tags: ["#happy", "#youcandoanything"]
        });

        await createPost({
            authorId: sandra.id,
            title: "How does this work?",
            content: "Seriously, does this even do anything?",
            tags: ["#happy", "#worst-day-ever"]
        });
      
        await createPost({
            authorId: glamgal.id,
            title: "Living the Glam Life",
            content: "Do you even? I swear that half of you are posing.",
            tags: ["#happy", "#youcandoanything", "#canmandoeverything"]
        });

        console.log('Finished creating initial Posts!');
    } catch (err) {
        console.log('Failed in creating intitial Posts!');
        throw err;
    }
}

// deletes all tables in the database and then rebuilds them and repopulates them with data
const rebuildDB = async () => {
    try {
        client.connect();

        await dropTables(); // deleting old tables if they exist
        await createTables(); // creating all the intended tables in the database
        await createInitialUsers(); // creating users for the user table
        await createInitialPosts(); // creating posts for the user table with tags
    } catch (err) {
        console.log('error on rebuildDB')
        throw err;
    }
}

// Tests the CRUD functions and displays the output
const testDB = async () => {
    try {
        console.log('Starting to test database...');

        const users = await getAllUsers(); // gets all the users table's data
        //console.log('getAllUsers:', users); // displays the users data

        //console.log('Calling updateUser on users[0]');
        // updates a user with the updateUser function
        const updateUserResult = await updateUser(users[0].id, {
            name: "Newname Sogood",
            location: "Lesterville, KY"
        });
        //console.log('updateUser Result:', updateUserResult); // log result of updateUser function

        //console.log('Calling getAllPosts');
        const posts = await getAllPosts(); // gets all the posts table's data
        //console.log("Result:", posts); // logs all the posts

        console.log('Calling updatePost on posts[0]');
        // updates specified post using the updatePost function
        const updatePostResult = await updatePost(posts[0].id, {
            title: "New Title",
            content: "Updated Content"
        });
        console.log('Result', updatePostResult); // logs the updated post

        //console.log("Calling getUserById with 2");
        const albert = await getUserById(2); // gets the users specific data
        //console.log("Result: ", albert); // logs albert users data

        //console.log('Calling updatePost on post[1], only updating the tags');
        // updates the tags of a specified post
        const updatePostTagsResult = await updatePost(posts[1].id, {
            tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });
        //console.log('Result:', updatePostTagsResult); // logs the results of updatePost

        //console.log('Calling getPostsByTagName with #happy');
        const postsWithHappy = await getPostsByTagName("#happy"); // gets all the posts with a specific tag name
        //.log("Result:", postsWithHappy); // logs the posts with a tag of "#happy"

        console.log('Finished database tests!');
    } catch(err) {
        console.error('Error testing database!');
        throw err;
    } 
}

// Runs all the seed functions
rebuildDB().then(testDB).catch(console.error).finally(() => {
    client.end()
});