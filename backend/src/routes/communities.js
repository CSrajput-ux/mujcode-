import { sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';

export function registerCommunityRoutes(router) {
  router.post('/api/communities', (req, res, ctx) => {
    const db = ctx.getDb();
    const community = {
      _id: nextId('comm'),
      name: req.body.name || 'New Community',
      description: req.body.description || '',
      createdAt: new Date().toISOString()
    };
    db.communities.unshift(community);
    ctx.saveDb(db);
    return sendJson(res, 201, community);
  });

  router.get('/api/communities', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().communities);
  });

  router.post('/api/communities/:communityId/posts', (req, res, ctx) => {
    const db = ctx.getDb();
    const post = {
      _id: nextId('post'),
      communityId: req.params.communityId,
      title: req.body.title || 'New Post',
      body: req.body.body || req.body.content || '',
      createdAt: new Date().toISOString()
    };
    db.communityPosts.unshift(post);
    ctx.saveDb(db);
    return sendJson(res, 201, post);
  });

  router.get('/api/communities/:communityId/posts', (req, res, ctx) => {
    const posts = ctx.getDb().communityPosts.filter(post => post.communityId === req.params.communityId);
    return sendJson(res, 200, posts);
  });
}
