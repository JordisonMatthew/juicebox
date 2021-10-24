const { 
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost,
    getAllPosts,
    getUserById,
    createTags,
    addTagsToPost,
    getPostsByTagName
    
} = require('./index');


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

// const createInitialTags = async () => {
//     try {
//         console.log("Creating tags...");

//         const [happy, sad, inspo, catman] = await createTags([
//             '#happy',
//             '#worst-day-ever',
//             '#youcandoanything',
//             '#catmandoeverything'
//         ]);

//         const [postOne, postTwo, postThree] = await getAllPosts();

//         await addTagsToPost(postOne.id, [happy, inspo]);
//         await addTagsToPost(postTwo.id, [sad, inspo]);
//         await addTagsToPost(postThree.id, [happy, catman, inspo]);

//         console.log('Finished creating tags!');
//     } catch (err) {
//         console.log('Error creating tags!');
//         throw err;
//     }
// }

const rebuildDB = async () => {
    try {
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
        await createInitialPosts();
    } catch (err) {
        console.log('error on rebuildDB')
        throw err;
    }
}
const testDB = async () => {
    try {
        console.log('Starting to test database...');

        const users = await getAllUsers();
        console.log('getAllUsers:', users);

        console.log('Calling updateUser on users[0]');
        const updateUserResult = await updateUser(users[0].id, {
            name: "Newname Sogood",
            location: "Lesterville, KY"
        });
        console.log('updateUser Result:', updateUserResult);

        console.log('Calling getAllPosts');
        const posts = await getAllPosts();
        console.log("Result:", posts);

        console.log('Calling updatePost on posts[0]');
        const updatePostResult = await updatePost(posts[0].id, {
            title: "New Title",
            content: "Updated Content"
        });
        console.log('Result', updatePostResult);

        console.log("Calling getUserById with 2");
        const albert = await getUserById(2);
        console.log("Result: ", albert)

        console.log('Calling updatePost on post[1], only updating the tags');
        const updatePostTagsResult = await updatePost(posts[1].id, {
            tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });
        console.log('Result:', updatePostTagsResult);

        console.log('Calling getPostsByTagName with #happy');
        const postsWithHappy = await getPostsByTagName("#happy");
        console.log("Result:", postsWithHappy);

        console.log('Finished database tests!');
    } catch(err) {
        console.error('Error testing database!');
        throw err;
    } 
}

rebuildDB().then(testDB).catch(console.error).finally(() => {
    client.end()
});