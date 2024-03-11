const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    name: String,
    email: String,
    message: String
});

module.exports = mongoose.model("Message", messageSchema);