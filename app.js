// get dotenv info
// require('dotenv').config();
if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
// variables
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const MongoDBStore = require("connect-mongo")(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Post = require('./models/posts');
const Message = require('./models/messages');
const multer = require('multer');
const {storage} = require('./cloudinary');
const upload = multer({ storage })
const ExpressError = require('./utils/ExpressError');

// get the database
const DB_URL = process.env.DBURL || 'mongodb://localhost:27017/heraldingbirds1';
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

// allow put and delete routes
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// make sure public is assigned as style path
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// set up session and flash
const secret = process.env.SessionSECRET || 'thisshouldbeabettersecret!';
const store = new MongoDBStore({
    url: DB_URL,
    secret: secret,
    touchAfter: 24 * 3600
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());

// set up passport
app.use(passport.initialize());
app.use(passport.session());

// set up passport local strategy, with username and password
passport.use(new LocalStrategy(
    (username, password, done) => {
        const envUsername = process.env.USER;
        const envPassword = process.env.PASSWORD;
        if (username === envUsername && password === envPassword) {
            return done(null, { id: 'your_user_id', username: envUsername });
        } else {
            return done(null, false, { message: 'Incorrect username or password' });
        }
    }
));

  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done) => {
    if (id === 'your_user_id') {
      done(null, { id: 'your_user_id', username: process.env.USERNAME });
    } else {
      done(null, false);
    }
  });

//   ROUTES
//   -----------------------------------------------------------------------------------------
// gallery
app.get('/', async(req, res, next) => {
    try {
        const posts = await Post.find({}).sort({_id: -1});
        const fineart = await Post.find({class: 'fine art'});
        const posterart = await Post.find({class: 'poster art'});
        res.render('index.ejs', {posts: posts, fineart:fineart, posterart: posterart});
    } catch(err) {
        next(err);
    };
});
// contact
app.get('/contact', (req, res) => {
    res.render('contact.ejs', {messages: req.flash('success')});
});
// admin
app.get('/admin', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('admin.ejs', {messages: req.flash('success')});
    } else {
        req.flash('error', 'You must be logged in');
        res.redirect('/login');
    }
});
// edit page
app.get('/admin/edit', async(req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            const posts = await Post.find({}).sort({_id: -1})
            res.render('edit.ejs', {posts: posts , messages: req.flash('success')})
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        }
    } catch(err) {
        next(err);
    }
});
// edit 1 post
app.get('/admin/:slug/edit', async(req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            const post = await Post.findOne({slug : req.params.slug});
            if(!post){
                return res.redirect('/admin/edit');
            };
            res.render('editpost', {Post:post});
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        } 
    } catch {
        next(err);
    }
});
// edit put route
app.put('/admin/:slug', upload.single('file'), async(req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            const {slug} = req.params;
            const updatedPost = await Post.findOneAndUpdate({slug}, {...req.body.post}, {new: true});
            updatedPost.image = {url: req.file.url, filename: req.file.filename};
            await updatedPost.save(); 
            req.flash('success', 'post updated');
            res.redirect('/admin/edit');
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        }   
    } catch(err) {
        next(err)
    }
});
// new page
app.get('/admin/new', (req, res) => {
    try {
        if(req.isAuthenticated()) {
            res.render('new', {messages: req.flash('error')});
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        }
    } catch(err) {
        next(err)
    }
});
app.post('/admin', upload.single('file'), async(req, res, next) => {
    if(req.isAuthenticated()){
        try{
            const post = new Post(req.body.post);
            post.image = {url: req.file.path, filename: req.file.filename};
            await post.save();
            req.flash('success', 'Successfully added a new image!')
            res.redirect('/')
        } catch(err){
            next(err)
        }
    } else {
        req.flash('error', 'You must be logged in');
        res.redirect('/login')
    }
});

// delete page
app.get('/admin/delete', async(req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            const posts = await Post.find({}).sort({_id: -1})
            res.render('delete.ejs', {posts: posts, messages: req.flash('error')});
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        }
    } catch(err) {
        next(err);
    }
});
// delete one page
app.get('/admin/:slug/delete', async(req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            const post = await Post.findOne({slug : req.params.slug});
            if(!post){
                return res.redirect('/admin/delete');
            };
            res.render('deletepost', {Post:post});
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        }  
    } catch(err) {
        next(err);
    }
});
// delete post route
app.delete('/admin/:slug', async(req, res, next) => {
    try {
        if(req.isAuthenticated()) {
            const post = await Post.deleteOne({slug: req.params.slug});
            if (post.deletedCount === 1) {
                console.log("Successfully deleted one document.");
                req.flash('success', 'deleted one post');
                res.redirect('/admin/delete');
              } else {
                console.log("No documents matched the query. Deleted 0 documents.");
                req.flash('error', 'no document deleted');
                res.redirect(`admin/${post.slug}/delete`);
              }
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        }
    } catch(err) {
        next(err);
    }
});

app.get('/login', (req, res) => {
    const failureFlashMessage = req.flash('error');
    res.render('login', {messages: failureFlashMessage});
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',   // Redirect back to the login page on failed login
    failureFlash: true           // Enable flash messages for error  
  }), (req, res) => {
    req.flash('success', 'you are logged in');
    res.redirect('/admin');
    
  });

app.post("/", async(req, res, next) => {
    const newMessage = new Message(req.body.message);
    await newMessage.save();
    req.flash('success', 'Thank you for your message!');
    res.redirect('/contact');
});

app.get("/admin/messages", async(req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            const Messages = await Message.find({});
            res.render('messageboard.ejs', {Messages:Messages});
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        }
    } catch (err) {
        next(err);
    };
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404));
});


  // Error handling middleware
  app.use((err, req, res, next) => {
    // Set a default error status code
    const statusCode = err.statusCode || 500;
    
    // Render an error page or JSON response
    res.status(statusCode).render('error.ejs', { error: err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})
