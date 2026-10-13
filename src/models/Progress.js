const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },

        completed_resources: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Resource"
            }
        ]
    },
    {
        timestamps: true
    }
);

progressSchema.index(
    { student_id: 1, course_id: 1 },
    { unique: true }
);

module.exports = mongoose.model("Progress", progressSchema);