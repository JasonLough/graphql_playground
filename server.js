/*
    definitions:
        fields - the key in an key:value pair  {x:1} x is the field
        query - what youre asking for, looks like this: query{ authors { books  { name } } }
        mutation - a special query that can alter data (CRUD)
*/




//begin setup

const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const app = express()

//note: these are basically types. (there are a lot more, not all are present)
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLScalarType
} = require('graphql')

//faking a database here - normally this would be some database somewhere
const books = [
    { id: 1, name: 'book1', authorId: 2 },
    { id: 2, name: 'book2', authorId: 1 },
    { id: 3, name: 'book3', authorId: 2 },
    { id: 4, name: 'book4', authorId: 3 }
]

const authors = [
    { id: 1, name: 'bob' },
    { id: 2, name: 'sam' },
    { id: 3, name: 'joe' },
]


////////// end setup, the real stuff can start now :) ////////////


//the whole goal here is to create the GraphQLSchema
//we build up each part, using the part we just created to create the next part, till we can finally create it.

//first define some custom types

//this AuthorType defines an object with a name, description, and fields
const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: 'AuthorType desc here',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        books: {
            type: new GraphQLList(BookType),
            resolve: author => books.filter(book => book.authorId === author.id)
        }
    })
})

//similar to AuthorType, but for BookType
const BookType = new GraphQLObjectType({
    name: 'Book',
    description: 'BookType desc here',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        authorId: { type: GraphQLNonNull(GraphQLInt) },
        author: {
            type: AuthorType,
            resolve: (book) => {
                return authors.find(author => author.id === book.authorId)
            }
        }
    })
})

//now define root fields. These end up being the parts of the query
const rootFields = () => ({
    author: {
        type: AuthorType,
        description: 'single author',
        args: { //note this one takes arguments, an int
            id: { type: GraphQLInt }
        },
        resolve: (p, args) => authors.find(author => author.id === args.id)
    },
    book: {
        type: BookType,
        description: 'single book',
        args: { //also takes an argument
            id: { type: GraphQLInt }
        },
        resolve: (p, args) => books.find(book => book.id === args.id)
    },
    books: {
        type: new GraphQLList(BookType),
        description: 'List of all books',
        resolve: () => books //just gives back ALL the books
    },
    authors: {
        type: new GraphQLList(AuthorType),
        description: 'List of all authors',
        resolve: () => authors //gives back ALL the authors
    }
})

//this will be passed as an argument to a function that creates the schema
const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: rootFields
})



//OPTIONAL: define mutation fields if you want to create / update / delete data
const mutationFields = () => ({
    addBook: {
        type: BookType,
        description: 'add a book',
        args: { //note it takes 2 arguments
            name: { type: GraphQLNonNull(GraphQLString) },
            authorId: { type: GraphQLNonNull(GraphQLInt) }
        },
        resolve: (parent, args) => {
            const book = { //we create the new entry for the database
                id: books.length + 1, //yes, this is naieve :)
                name: args.name, //from the arguments
                authorId: args.authorId //from the arguments
            }
            books.push(book) //we change the 'database'
            return book
        }
    },
    addAuthor: {
        type: AuthorType,
        description: 'add an author',
        args: {
            name: { type: GraphQLNonNull(GraphQLString) }
        },
        resolve: (parent, args) => {
            const author = {
                id: authors.length + 1,
                name: args.name,
                bookId: args.bookId
            }
            authors.push(author)
            return author
        }
    }
})

//create the mutation object that the schema needs
const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root mutation',
    fields: mutationFields
})

//finally! create the schema using the parts we just built above
const schema = new GraphQLSchema({
    query: RootQueryType, //required
    mutation: RootMutationType //this guy is optional
})

//this is just expressjs talk for "when this endpoint is hit, run graphql" (defines the route and connect it to graphQL)
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true
}))

//start the server
app.listen(5000, () => console.log('server running'))


/*
    Try these queries:

    1) (dont copy the numbered lines) this will show all books and their ids
    query{
        books {
            id
        }
    }

    2) grab an author, and the name of their books
    query{
        author(id:2) {
                books {
                  name
                }
        }
    }

    3) add an author named alex
    mutation{
        addAuthor(name:"alex") {
            name
        }
    }
*/

/*
    exercises:
        1) write a mutation that deletes a book
        2) write a query that grabs the latest book (last in the list)
        3) add a date type to books
*/

