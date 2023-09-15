// variables
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const Post = require('./models/posts');

// get the database
const DB_URL = 'mongodb://localhost:27017/heraldingbirds1';
console.log(DB_URL);
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.set('strictQuery', false);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// get the app running
const app = express();

// get ejs working
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// make sure public is assigned as style path
app.use(express.static('public'));

app.get('/', async(req, res, next) => {
    try {
        const posts = await Post.find({}).sort({_id: -1});
        res.render('home.ejs', {posts: posts});
    } catch (err) {
        next(err);
    };
});

app.get('/gallery', async(req, res, next) => {
    try {
        const posts = await Post.find({}).sort({_id: -1});
        const fineart = await Post.find({class: 'fine art'});
        const posterart = await Post.find({class: 'poster art'});
        res.render('index.ejs', {posts: posts, fineart:fineart, posterart: posterart});
    } catch(err) {
        next(err);
    };
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});