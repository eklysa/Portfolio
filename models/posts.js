const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify');
const path = require('path');

const PostSchema = new Schema({
  title: String,
  image: String,
  alt: String,
  class: String,
  slug: String,
  file: String
});

// Pre-save middleware to generate the slug based on the title
PostSchema.pre('save', async function (next) {
  console.log(this.title);
  this.slug = slugify(this.title, { lower: true });
  console.log(this.slug);
  next();
});

module.exports = mongoose.model('Post', PostSchema);
