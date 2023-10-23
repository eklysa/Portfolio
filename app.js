// get dotenv info
require('dotenv').config();

// variables
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
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

// allow put and delete routes
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// make sure public is assigned as style path
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// set up session and flash
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const sessionConfig = {
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

// routes
app.get('/', async(req, res, next) => {
    try {
        const posts = await Post.find({}).sort({_id: -1});
        res.render('home.ejs', {posts: posts, message: req.flash('success')});
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

app.get('/contact', (req, res) => {
    res.render('contact.ejs');
});

app.get('/admin', (req, res) => {
    if (req.isAuthenticated()) {
        // req.flash('success', 'you are logged in');
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
        const post = await Post.findOne({slug : req.params.slug});
        if(!post){
            return res.redirect('/admin/edit');
        };
        res.render('editpost', {Post:post});
    } catch {
        next(err);
    }
});
// edit put route
app.put('/admin/:slug', async(req, res, next) => {
    try {
        const {slug} = req.params;
        const updatedPost = await Post.findOneAndUpdate({slug}, {...req.body.post}, {new: true});
        req.flash('success', 'post updated');
        res.redirect('/admin/edit');
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
// new post route
app.post('/admin', async(req, res, next) => {
    if(req.isAuthenticated()){
        try{
            const post = new Post(req.body.post);
            console.log(post);
            await post.save();
            res.redirect('/gallery');
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
            const posts = await Post.find({})
            res.render('delete.ejs', {posts: posts})
        } else {
            req.flash('error', 'You must be logged in');
            res.redirect('/login');
        }
    } catch(err) {
        next(err);
    }
});
// delete post route

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

// app.get('/flash', function(req, res){
//     // Set a flash message by passing the key, followed by the value, to req.flash().
//     req.flash('info', 'Flash is back!')
//     res.redirect('/test');
//   });
   
//   app.get('/test', function(req, res){
//     // Get an array of flash messages by passing the key to req.flash()
//     res.render('test', { messages: req.flash('info') });
//   });


app.post('/', async(req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const message = req.body.message;
    console.log(message);
    try {
        // create email transporter
        const transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: {
                user: process.env.my_email,
                pass: process.env.my_password,
            },
        });
        // create the email
        const mailOptions = {
            from: email, // from sender
            to: process.env.my_email, // to me
            subject: 'Contact Form Submission from:'+ name,
            text: JSON.stringify(message), // give message
        };
        // send the email
        transporter.sendMail(mailOptions,  (error, info) => {
            if (error) { 
                console.error('Error sending email:', error);
                res.status(500).send('An error occurred while sending the email.');
            } else {
                console.log('Email sent:', info.response);
                res.send('Thank you for your message!'); // Respond to the client
            };
        });
    } catch(error) {
        console.log(error);
    };
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});