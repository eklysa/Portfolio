// variables
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const ejsMate = require('ejs-mate');

// get the app running
const app = express();

// get ejs working
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});