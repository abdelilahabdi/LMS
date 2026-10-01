const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        order: {
            type: Number,
            required: true,
            min: 1
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Module = mongoose.model("Module", moduleSchema);

module.exports = Module;