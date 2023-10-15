// get dotenv info
require('dotenv').config();

// variables
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('express-flash');
const cookieParser = require('cookie-parser');
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
app.use(bodyParser.urlencoded({ extended: true }));

// use passport to manage site with admin interface
// use session to stay logged in as admin
app.use(cookieParser());
app.use(session({ secret: process.env.session_key, resave: false, saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// set up passport local strategy, with username and password
passport.use(new LocalStrategy(
    (username, password, done) => {
        if (username === process.env.username && password === process.env.password) {
            return done(null, user);
        } else {
            return done(null, false, {message: 'Incorrect username or password'});
        }
    }
));
// set up serialization and deserialization for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
// Replace this with your actual user retrieval logic
    if (id === 'your_user_id') {
        done(null, { id: 'your_user_id', username: 'your_username' });
    } else {
        done(null, false);
    }
});

// routes
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

app.get('/contact', (req, res) => {
    res.render('contact.ejs');
});

app.get('/admin', (req, res) => {
    req.flash('made it to admin page'); // Set the flash message
    const myflash = req.flash('made it to admin page'); // Retrieve the flash message
    console.log(myflash);
    res.render('admin', { message: myflash });
});

app.get('/login', (req, res) => {
    const myflash = req.flash('error')
    console.log( myflash);
    res.render('login', { message:  myflash});
    
  });

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/admin',  // Redirect to the admin page on successful login
    failureRedirect: '/login',     // Redirect back to the login page on failed login
    failureFlash: true             // Enable flash messages for error
  })
);

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