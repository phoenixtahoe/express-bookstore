process.env.NODE_ENV = "test"

const request = require("supertest");


const app = require("../app");
const db = require("../db");

let isbn

beforeEach(async () => {
    let result = await db.query(
    `INSERT INTO books (isbn, amazon_url, author, language, 
        pages, publisher, title, year)   
     VALUES('696969', 'https://amazon.com/phoenix', 'pdavid', 'English', 
        1,  'NY times', 'how to win it big', 2021) 
     RETURNING isbn`);

     isbn = result.rows[0].isbn
});

describe('GET /', function () {
    test('Get list of books', async function () {
        const res = await request(app).get('/books')
        const books = res.body.books

        expect(books).toHaveLength(1)
        expect(books[0]).toHaveProperty("isbn")
        expect(books[0]).toHaveProperty("author")
    })
})

describe('GET /:isbn', function () {
    test('Get single book', async function () {
        const res = await request(app).get(`/books/${isbn}`)
        const book = res.body.book

        expect(isbn).toBe(book.isbn);
        expect(book).toHaveProperty("isbn")
    })

    test("Can't find book", async function () {
        const res = await request(app).get(`/books/0`)
        expect(res.statusCode).toBe(404);
    });
})

describe('DELETE /:isbn', function () {
    test('Delete book', async function () {
        const res = await request(app).delete(`/books/${isbn}`)
        expect(res.body).toEqual({message: "Book deleted"})
    })
})

describe('POST /', function () {
    test('Create book', async function () {
        const res = await request(app).post(`/books`).send({
            "isbn": "0691161518",
            "amazon-url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        })

        expect(res.statusCode).toBe(201)
        expect(res.body.book).toHaveProperty("isbn")
    })

    test('Invalid book', async function () {
        const res = await request(app).post(`/books`).send({
            author: 'the goat'
        })

        expect(res.statusCode).toBe(400)
    })
})

describe('PUT /:isbn', function () {
    test('Update book', async function () {
        const res = await request(app).put(`/books/${isbn}`).send({
            "amazon-url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        })

        expect(res.statusCode).toBe(200)
    })
})

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end()
});