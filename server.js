'use strict';

require('dotenv').config();

// Application Dependencies
const express = require('express');
const methodOverride = require('method-override');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Setup client to talk to pg
// const client = new pg.Client(process.env.DATABASE_URL);
// client.on('error', console.error);
// client.connect();

// Application Middleware
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

// // look in the urlencoded POST body and delete _method then change to a put
app.use(methodOverride((request, response) => {
  console.log(request.body);
  if(request.body && typeof request.body === 'object' && '_method' in request.body) {
    let method = request.body._method; // 'PUT';
    delete request.body._method;
    return method; // 'PUT'
  }
}));

// SQL commands
const SQL = {};
SQL.getAllData = 'SELECT * FROM book_app;';
SQL.idCheck = 'SELECT * FROM book_app WHERE id=$1;';
SQL.deleteBook = 'DELETE FROM book_app WHERE id=$1';

// Set the view engine for server-side templating
app.set('view-engine', 'ejs');

// API Routes
// Renders the search form
app.get('/', (request, response) => {
  client.query(SQL.getAllData).then(result => {
    // console.log(testSelected);
    // console.log(result.rows)
    response.render('pages/index.ejs', {testing:result.rows});
  });
});

// Creates a new search to the Google Books API
app.post('/bookshelf', (request,response) => {
  console.log('attempt to post');
  console.log(request.body);

  const {title, authors, image_link, description, isbn, bookshelf} = request.body;

  const sql = 'INSERT INTO book_app (title, authors, description, image_link, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)';
  client.query(sql, [title, authors, description, image_link, isbn, bookshelf]);

  // response.render('/searches/addBook.ejs')
  response.redirect('/');
});


app.get('/new', (request, response) => {
  response.render('pages/new.ejs');
});

app.get('/details/:id', (request, response) => {
  const testSelected = request.params.id; //parseInt(request.params.id)
  client.query(SQL.idCheck, [testSelected]).then(result => {
    response.render('pages/details.ejs', {testing:result.rows[0]});
  });
});

app.post('/searches', (request, response) => {
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({query: '{ books }'}),
  })
    .then(response => response.json())
    .then(data => console.log('data returned:', data.books));
});

app.delete('/details/:id', removeFromDB);


// HELPER FUNCTIONS
function build_book_display(val){
  let book_object = new Book_input(val);
  return book_object;
}

function removeFromDB(request, response){
  console.log('====================================================');
  const deletedBook = parseInt(request.params.id);
  client.query(SQL.deleteBook, [deletedBook]).then(result => {
    response.redirect('/');
  });
}

// Book constructor

let book_array = [];

function Book_input(book) {
  this.title = book.volumeInfo.title;
  this.authors = book.volumeInfo.authors;
  this.description = book.volumeInfo.description;
  this.image_link = book.volumeInfo.imageLinks.thumbnail.slice(0,4) + 's' + book.volumeInfo.imageLinks.thumbnail.slice(4);
  this.ISBN = book.volumeInfo.industryIdentifiers.identifier;
  book_array.push(this);
}

// below test renders page
app.get('/test', (request, response) => {
  response.render('pages/index.ejs');
});

// No API key required
// Console.log request.body and request.body.search
// console.log(book_array);

app.listen(PORT, () => console.log('app is up on port ' + PORT));
