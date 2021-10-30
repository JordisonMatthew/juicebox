const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox-dev');

// returns the users table data without password
const getAllUsers = async () => {
    const {rows} = await client.query(`
    SELECT id, username, name, location, active
    FROM users;`);

    return rows;
}

// adds a new user to the users table and returns it
const createUser = async ({ 
    username, 
    password,
    name,
    location 
}) => {
    try {
        const { rows: [user] } = await client.query(`
            INSERT INTO users(username, password, name, location) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password, name, location]);

        return user;
    } catch (err) {
        throw err;    
    }
}

// updates a specified user's data in the users table and returns it
const updateUser = async (id, fields = {}) => {
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');

    if (setString.length === 0) {
        return;
    }

    try {
        const {rows: [user]} = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${id}
        RETURNING *;
        `, Object.values(fields));

        return user;
    } catch (err) {
        throw err;
    }
}

// adds a new post to the posts table and returns it
const createPost = async ({
    authorId,
    title,
    content,
    tags = []
}) => {
    try {
        const {rows: [post]} = await client.query(`
        INSERT INTO posts("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
        `, [authorId, title, content])

        const tagList = await createTags(tags);

        return await addTagsToPost(post.id, tagList);
    } catch(err) {
        throw err;
    }
}

// updates a post in the posts table and the tags related to it
const updatePost = async (postId, fields = {}) => {
    const {tags} = fields;
    delete fields.tags;

    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${ index + 1 }`
    ).join(', ');

    try {
        if (setString.length > 0) {
            const {rows: [post]} = await client.query(`
            UPDATE posts
            SET ${setString}
            WHERE id=${postId}
            RETURNING *;`, Object.values(fields));
        }

        if (tags === undefined) {
            return await getPostById(postId);
        }

        const tagList = await createTags(tags);
        const tagListIdString = tagList.map(tag => `${tag.id}`).join(', ');

        await client.query(`
        DELETE FROM post_tags
        WHERE "tagId"
        NOT IN (${ tagListIdString })
        AND "postId"=$1;`, [postId]);

        await addTagsToPost(postId, tagList);

        return await getPostById(postId);
    } catch(err) {
        throw err;
    }
}

// returns all the posts in the posts table
const getAllPosts = async () => {
    try {
        const {rows: postIds} = await client.query(`
        SELECT id
        FROM posts;`);

        const posts = await Promise.all(postIds.map(post => getPostById(post.id)));

        return posts;
    } catch(err) {
        throw err;
    }
}

// returns the posts data made by a user
const getPostsByUser = async (userId) => {
    try {
        const {rows: postIds} = await client.query(`
        SELECT id 
        FROM posts
        WHERE "authorId"=${userId};`);

        const posts = await Promise.all(postIds.map(post => getPostById(post.id)));

        return posts;
    } catch(err) {
        throw err;
    }
}

// returns a post specified by it's id
const getPostById = async (postId) => {
    try {
        const {rows: [post]} = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;`, [postId]);

        if (!post) {
            throw {
                name: "PostNotFoundError",
                message: "Could not find a post with that postId"
            }
        }
        const {rows: tags} = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;`, [postId]);

        const {rows: [author]} = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;`, [post.authorId]);

        // addings the tags and author onto our post object
        post.tags = tags;
        post.author = author;
        delete post.authorId;

        return post;
    } catch(err) {
        throw err;
    }
}

// returns the specified users data from the users table and all of the posts they have made
const getUserById = async (userId) => {
    try {
        const {rows: [user]} = await client.query(`
        SELECT * FROM users
        WHERE id=${userId};`);

        if (!user) {
            return null;
        }

        delete user.password;

        const userPosts = await getPostsByUser(userId);
        user.posts = userPosts;

        return user;
    } catch(err) {
        throw err;
    }
}

const getUserByUsername = async (username) => {
    try {
        const {rows: [user]} = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1;
        `, [username]);

        return user;
    } catch(error) {
        throw error;
    }
}

// adds tags data to the tags table
const createTags = async (tagList) => {
    if (tagList.length === 0) {
        return;
    }

    const insertValues = tagList.map(
        (_, index) => `$${index + 1}`).join('), (');
    
    const selectValues = tagList.map(
        (_, index) => `$${index + 1}`).join(', ');
    try {
        await client.query(`
        INSERT INTO tags(name)
        VALUES (${insertValues})
        ON CONFLICT (name) DO NOTHING;`, tagList)

        const {rows} = await client.query(`
        SELECT * FROM tags
        WHERE name IN (${selectValues});
        `, tagList);

        return rows;
    } catch(err) {
        throw err;
    }
}

// adds a post tag to the post_tags table
const createPostTag = async (postId, tagId) => {
    try {
        await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;`, [postId, tagId]);
    } catch(err) {
        throw err;
    }
}

// adds specified tags to a post
const addTagsToPost = async (postId, tagList) => {
    try {
        const createPostTagPromises = tagList.map(
            tag => createPostTag(postId, tag.id)
        )

        await Promise.all(createPostTagPromises);

        return await getPostById(postId);
    } catch(err) {
        throw err;
    }
}

// gets all the posts from the post table that have the specified "tagName"
const getPostsByTagName = async (tagName) => {
    try {
        const {rows: postIds} = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;`, [tagName]);

        return await Promise.all(postIds.map(post => getPostById(post.id)));
    } catch(err) {
        throw err;
    }
}

const getAllTags = async () => {
    try {
        const {rows} = await client.query(`
        SELECT *
        FROM tags;`)

        return rows;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    getUserById,
    getPostsByTagName,
    getAllTags,
    getUserByUsername,
    getPostById,
}