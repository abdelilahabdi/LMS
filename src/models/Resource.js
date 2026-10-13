const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: ["video", "pdf", "article", "exercise", "link"],
            required: true
        },

        url: {
            type: String,
            required: true,
            trim: true
        },

        fileId: {
            type: String,
            default: null
        },

        module: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Resource = mongoose.model("Resource", resourceSchema);

module.exports = Resource;