// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const slugify = require('slugify');
// const sharp = require('sharp');
// const path = require('path');

// const PostSchema = new Schema({
//   title: String,
//   image: String,
//   thumbnail: String,
//   // compressed_thumbnail: String,
//   alt: String,
//   class: String,
//   slug: String
// });

// // Pre-save middleware to generate the slug based on the title
// PostSchema.pre('save', async function (next) {
//   this.slug = slugify(this.title, { lower: true });

//   // const thumbnailPath = path.join(__dirname, 'public', this.thumbnail);
//   const imagePath = path.join(this.image);
//   // const thumbnailPath = path.join(__dirname, 'public/images/illustrations/thumbnails', `${this.slug}.jpg`);

//   try {
//     // Compress and resize the thumbnail image
//     // await sharp(thumbnailPath)
//     //   .resize({ width: 500 })
//     //   .toFile(compressedThumbnailPath);
//     await sharp(imagePath)
//       .resize({ width: 500 })
//       .toFile(thumbnailPath);
//     // Update the post object with the compressed thumbnail path
//     this.thumbnail = path.relative('public', thumbnailPath);
//     // console.log(this.compressed_thumbnail);
//     console.log(this.thumbnail);
//   } catch (error) {
//     console.error(error);
//   }

//   next();
// });

// module.exports = mongoose.model('Post', PostSchema);


const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify');
const sharp = require('sharp');
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
