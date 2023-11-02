const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
                    // Resolver for the 'me' query
            if (context.user) { // Checking if the user is authenticated
                const userData = await User
                    .findOne({ _id: context.user._id }) // Finding the user data by their ID
                    .select("-__v -password")
                    .populate("books");
                
                return userData;
            };
            throw new AuthenticationError("NOTE: you must be logged in!");
        },
    }, 

    Mutation: {
        // Resolver for the 'login' mutation
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError("Incorrect Login Information");
            };

            const correctPW = await user.isCorrectPassword(password);
            if (!correctPW) {
                throw new AuthenticationError("Incorrect Login Information");
            };

            const token = signToken(user); // Generating a JWT token for the user
            return { token, user };
        },
        // Resolver for the 'addUser' mutation
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);


            return { token, user };
        },
        // Resolver for the 'saveBook' mutation
        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const updatedUser = await User
                    .findOneAndUpdate(
                        { _id: context.user._id }, 
                        { $addToSet: { savedBooks: bookData } },
                        { new: true },
                    )

                    .populate("books");
                return updatedUser;
            };
            throw new AuthenticationError("NOTE: You must be logged in to save books!");
        },
        // Resolver for the 'removeBook' mutation

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId} } },
                    { new: true },
                );

                return updatedUser;
            };

            throw new AuthenticationError("NOTE: You must be logged in to delete books!");
        }
    },
};

module.exports = resolvers;
// exporting 