'use string'

const mocha = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

console.log(TEST_DATABASE_URL);


chai.use(chaiHttp);

//-----------CREATE TEST DATA----------------

function seedBlogData(){
  console.info('seeding Blog data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogData());
  };
  return BlogPost.insertMany(seedData);
};



function generateBlogData(){
  return {
    Title: faker.lorem.sentence(),
    Author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    Content: faker.lorem.paragraph()
//    Comments: {
//      comment: faker.lorem.sentence,
//      comment: faker.lorem.sentence
//    }
  };
};






//------------TEAR DOWN DB------------------

function tearDownDb(){
  console.warn('Deleting database');
//  return mongoose.connection.dropDatabase();
};




//------------TESTING AREA-------------------


describe('BlogPost API resource', function() {

  before(function() {
    console.log(TEST_DATABASE_URL);
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {

    it('should return all of the blog posts', function() {
      let res;

      return chai.request(app)
        .get('/blog-posts')
        .then(function(_res){
            res = _res;
            expect(res).to.have.status(200);
            expect(res).to.have.lengthOf.at.least(1);
            return BlogPost.count();
        })
        .then(function(count) {
            expect(res.body.blogpost).to.have.lengthOf(count);
        });
    });

    it('should have a response with the correct fields', function(){

      let resBlog;
      return chai.request(app)
        .get('/blog-posts')
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body.blogposts).to.be.a('array');
            expect(res.body.BlogPosts).to.have.lengthOf.at.least(1);

            res.body.blogposts.forEach(function(blogpost){
              expect(blogpost).to.be.a('object');
              expect(blogpost).to.include.keys(
                "id", "author", "title", "content");
            });
            resBlog = res.body.blogposts[0];
            return BlogPost.findById(resBlog.id);
        })
        .then(function(blogpost){
          expect(resBlog.id).to.equal(blogpost.id);
          expect(resBlog.name).to.equal(blogpost.name);
          expect(resBlog.title).to.equal(blogpost.title);
          expect(resBlog.author).to.equal(blogpost.author);
        });
    });

  });

  describe('POST endpoint', function(){

    it('should add a new blog post', function(){
      const newPost = generateBlogPost();
      let mostRecentComment;

      return chai.request(app)
        .post('blog-posts')
        .send(newPost)
        .then(function(res){
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.bea('object');
          expect(res.body).to.include.keys(
            'title', 'content', 'author', 'created'
          );
          expect(res.body.title).to.equal(newPost.name);
          expect(res.body.content).to.equal(newPost.content);
          expect(res.body.author).to.equal(newPost.author);
          expect(res.body.created).to.equal(newPost.created);

          return BlogPost.findById(res.body.id);
        })
        .then(function(blog){
          expect(blog.title).to.equal(newBlog.title);
          expect(blog.content).to.equal(newBlog.content);
          expect(blog.author).to.equal(newBlog.author);
          expect(blog.created).to.equal(newBlog.created);
        });
    });
  });
  describe('PUT endpoint',function(){
    it('should modify existing posts', function(){
      const updateData = {
        title: 'The best title ever',
        content: 'the best content ever'
      };

      return BlogPost
        .findOne()
        .then(function(blogpost) {
          updateData.id = blogpost.id;

          return chai.request(app)
            .put(`/blogposts/${blogpost.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return blogpost.findById(updateData.id);
        })
        .then(function(blogpost) {
          expect(blogpost.title).to.equal(updateData.title);
          expect(blogpost.content).to.equal(updateData.content);
        });
    });
  });

  describe('DELETE endpoint', function() {
    it('should delete a blog post by id', function() {
      let post;

      return Restaurant
        .findOne()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/blogposts/${post.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(function(_post) {
          expect(_post).to.be.null;
        });
    });
  });





});















