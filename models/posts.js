const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify');
const sharp = require('sharp');
const path = require('path');

const PostSchema = new Schema({
  title: String,
  image: String,
  thumbnail: String,
  compressed_thumbnail: String,
  alt: String,
  description: String,
  class: String,
  facts: String,
  slug: String
});

// Pre-save middleware to generate the slug based on the title
PostSchema.pre('save', async function (next) {
  this.slug = slugify(this.title, { lower: true });

  const thumbnailPath = path.join(__dirname, 'public', this.thumbnail);
  const compressedThumbnailPath = path.join(__dirname, 'public/images/illustrations/thumbnails', `${this.slug}.jpg`);

  try {
    // Compress and resize the thumbnail image
    await sharp(thumbnailPath)
      .resize({ width: 500 })
      .toFile(compressedThumbnailPath);

    // Update the post object with the compressed thumbnail path
    this.compressed_thumbnail = path.relative('public', compressedThumbnailPath);
    console.log(this.compressed_thumbnail);
    console.log(this.thumbnail);
  } catch (error) {
    console.error(error);
  }

  next();
});

module.exports = mongoose.model('Post', PostSchema);
