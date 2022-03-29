import { clone } from '../index.js';

class Book {
  id;
  published;
  name;
  author;
  properties;
  constructor(data) {
    Object.assign(this, data);
  }

  __clone() {
    this.id = undefined;
  }
}
class Author {
  name;
  age;
  active;
  books = [];
  properties = {};
  constructor(data) {
    Object.assign(this, data);
  }
}

it('clones objects', () => {
  let clonedBook;
  const book = new Book({name: 'I am POTUS', id: 1, published: true});
  const author = new Author({name: 'Donald Trump', age: 75, active: false, properties: {country: 'USA'}});
  book.author = author;
  author.books.push(book);

  clonedBook = clone(book, false);
  expect(clonedBook).toBeInstanceOf(Book);
  expect(clonedBook).not.toBe(book);
  expect(clonedBook.id).toBeUndefined();
  expect(clonedBook.name).toBe(book.name);
  expect(clonedBook.published).toBe(true);
  expect(clonedBook.author).toBe(author);
  expect(clonedBook.properties).toBeUndefined();
  expect(clonedBook.author.properties).toBe(author.properties);
  expect(clonedBook.author.books[0]).toBe(book);

  clonedBook = clone(book, true);
  expect(clonedBook).toBeInstanceOf(Book);
  expect(clonedBook).not.toBe(book);
  expect(clonedBook.id).toBeUndefined();
  expect(clonedBook.name).toBe(book.name);
  expect(clonedBook.published).toBe(true);
  expect(clonedBook.author).toBeInstanceOf(Author);
  expect(clonedBook.author).not.toBe(author);
  expect(clonedBook.author.name).toBe(author.name);
  expect(clonedBook.properties).toBeUndefined();
  expect(clonedBook.author.properties).not.toBe(author.properties);
  expect(clonedBook.author.books[0]).toBe(clonedBook);
});

it('clones arrays', () => {
  const book = new Book({name: 'I am POTUS', id: 1, published: true});
  const collection = [book, book];
  const cloned = clone(collection);

  expect(cloned).toBeInstanceOf(Array);
  expect(cloned[0]).not.toBe(book);
  expect(cloned[1]).not.toBe(book);
  expect(cloned[1]).toBe(cloned[0]); // Generated clones are reused
});

it('doesnt clone unclonable stuff, without complaining', () => {
  expect(clone('foo')).toBe('foo');
  expect(clone(null)).toBe(null);
  expect(clone(undefined)).toBe(undefined);
  expect(clone(42)).toBe(42);
  expect(clone(13.37)).toBe(13.37);
  expect(clone(['foo', null, undefined, 42, 13.37])).toEqual(['foo', null, undefined, 42, 13.37]);
});
