const express = require('express');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');

tagsRouter.use((req, res, next) => {
    console.log("A request is being made to /tags");
  
    next();
  });
  
  tagsRouter.get('/', async (req, res) => {
      const tags = await getAllTags();
  
      res.send({
          "tags": tags
      });
  });

  tagsRouter.get('/:tagName/posts', async (req, res, next) => {
      const { tagName } = req.params;

      try {
        const allPostsWithTagName = await getPostsByTagName(tagName);

        const posts = allPostsWithTagName.filter((post) => {
            if (req.user) {
                return (post.active && (post.author.id === req.user.id));
            } else {
                return post.active;
            }
        })
        res.send({ posts: posts });
      } catch ({ name, message }) {
          next({ name, message });
      }
  });

  module.exports = tagsRouter;