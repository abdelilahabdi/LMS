require("dotenv").config();

const mongoose = require("mongoose");

const Course = require("../src/models/Course");
const Module = require("../src/models/Module");
const Resource = require("../src/models/Resource");

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        await Resource.deleteMany();
        await Module.deleteMany();
        await Course.deleteMany();

        const courses = await Course.insertMany([
            {
                title: "JavaScript Fundamentals",
                description: "Learn the basics of JavaScript programming.",
                category: "Web Development",
                level: "beginner",
                status: "published",
                publishedAt: new Date()
            },
            {
                title: "Node.js Backend Development",
                description: "Build backend applications with Node.js and Express.",
                category: "Backend",
                level: "intermediate",
                status: "published",
                publishedAt: new Date()
            }
        ]);

        const modules = await Module.insertMany([
            {
                title: "JavaScript Variables",
                description: "Learn variables and data types.",
                order: 1,
                course: courses[0]._id
            },
            {
                title: "JavaScript Functions",
                description: "Learn how to create and use functions.",
                order: 2,
                course: courses[0]._id
            },
            {
                title: "Introduction to Node.js",
                description: "Understand Node.js and the backend environment.",
                order: 1,
                course: courses[1]._id
            }
        ]);

        await Resource.insertMany([
            {
                title: "Variables Introduction",
                type: "video",
                url: "https://example.com/javascript-variables",
                module: modules[0]._id
            },
            {
                title: "Functions Cheat Sheet",
                type: "pdf",
                url: "https://example.com/functions-cheat-sheet.pdf",
                module: modules[1]._id
            },
            {
                title: "Node.js Introduction Article",
                type: "article",
                url: "https://example.com/nodejs-introduction",
                module: modules[2]._id
            }
        ]);

        console.log("Database seeded successfully");
    } catch (error) {
        console.error("Seed failed:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
    }
};

seedDatabase();