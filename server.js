import express from 'express';
import auth from './auth.js';
import fs from 'fs/promises';
import cookieParser from 'cookie-parser';
import multer from 'multer';

const app = express();
const port = 3000;
const data = await fs.readFile('./db.json', 'utf-8');
const db = JSON.parse(data);
const upload = multer({ storage: multer.memoryStorage() });
const reactionList = ["thumbsUp", "fire"];

app.use(express.static('./site/'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.post('/login', upload.none(), auth.login);

app.post('/logout', auth.logout);

app.get('/posts', auth.authenticateToken, (req, res) => {
    const user = db.users.find(user => user.id === req.user.id);
    const sendCopy = structuredClone(db);
    sendCopy.posts.forEach(post => {
        Object.values(post.reactions).forEach(reaction => {
            if (reaction.reactors.includes(user.username)){
                reaction.reactors.splice(reaction.reactors.indexOf(user.username), 1, "You");
            }
        });
    });
    res.send(sendCopy.posts);
});

app.post('/add-reaction', auth.authenticateToken, (req, res) => {
    const { reaction, postId } = req.body;
    if (!reactionList.includes(reaction)){
        return res.status(404).json({ "message": "reaction doesn't exist" });
    }
    const user = db.users.find(user => user.id === req.user.id);
    const post = db.posts.find(p => p.id === Number(postId));
    if (!post){
        return res.status(404).json({ "message": "That post id doesn't exist" });
    }
    if (post.reactions[reaction].reactors.includes(user.username)){
        return res.json({ "message": "You've already liked this post! I see you're trying to get around things." });
    }
    post.reactions[reaction].reactors.push(user.username);
    post.reactions[reaction].amount += 1;
    fs.writeFile('./db.json', JSON.stringify(db));
    return res.json({ "message": "Added reaction" });
});

app.post('/remove-reaction', auth.authenticateToken, (req, res) => {
    const { reaction, postId } = req.body;
    if (!reactionList.includes(reaction)) {
        return res.status(404).json({ "message": "reaction doesn't exist" });
    }
    const user = db.users.find(user => user.id === req.user.id);
    const post = db.posts.find(p => p.id === Number(postId));
    if (!post) {
        return res.status(404).json({ "message": "That post id doesn't exist" });
    }
    if (post.reactions[reaction].reactors.includes(user.username)) {
        post.reactions[reaction].reactors.splice(post.reactions[reaction].reactors.indexOf(user.username), 1);
        post.reactions[reaction].amount -= 1;
        fs.writeFile('./db.json', JSON.stringify(db));
        return res.json({ "message": "Removed reaction" });
    }
    return res.json({ "message": "You've already removed a like on this post! I see you're trying to get around things." });
});

app.post('/make-post', auth.authenticateToken, upload.none(), (req, res) => {
    const { task, info } = req.body;
    const user = db.users.find(user => user.id === req.user.id);
    db.posts.push({
        "id": db.posts.length + 1,
        "userimage": user.userimage,
        "task": task,
        "info": info,
        reactions: { "thumbsUp": { "amount": 0, "reactors": [] }, "fire": { "amount": 0, "reactors": [] } }
    });
    res.status(201).json({ "message": "Created post"});
    fs.writeFile('./db.json', JSON.stringify(db));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});