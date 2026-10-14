const mongoose = require("mongoose");
const Status = require("../src/models/Status");

const seedStatus = async () => {
    const now = new Date();

    return Status.updateOne(
        { status_name: "active" },
        {
            $setOnInsert: {
                status_name: "active",
                createdAt: now,
                updatedAt: now
            }
        },
        { upsert: true, runValidators: true, timestamps: false }
    );
};

const seedDatabase = async () => {
    require("dotenv").config();

    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is required.");
        }

        await mongoose.connect(process.env.MONGO_URI);

        const result = await seedStatus();
        console.log(result.upsertedCount === 1
            ? "Active status created successfully."
            : "Active status already exists. No changes made.");
    } finally {
        await mongoose.connection.close();
    }
};

if (require.main === module) {
    seedDatabase().catch((error) => {
        console.error("Status seed failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = { seedStatus, seedDatabase };
