require("dotenv").config();

const { test, afterEach, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const User = require("../src/models/User");
const Course = require("../src/models/Course");
const Module = require("../src/models/Module");
const Resource = require("../src/models/Resource");
const { drive } = require("../src/config/googleDrive");
const app = require("../src/app");
const authorize = require("../src/middlewares/authorize");

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "auth-security-test-secret";

const originalMethods = new Map();

const replace = (model, method, implementation) => {
    const key = `${model.modelName}.${method}`;

    if (!originalMethods.has(key)) {
        originalMethods.set(key, {
            model,
            method,
            original: model[method]
        });
    }

    model[method] = implementation;
};

afterEach(() => {
    for (const { model, method, original } of originalMethods.values()) {
        model[method] = original;
    }

    originalMethods.clear();
});

after(() => {
    if (originalJwtSecret === undefined) {
        delete process.env.JWT_SECRET;
    } else {
        process.env.JWT_SECRET = originalJwtSecret;
    }
});

const response = () => ({
    statusCode: null,
    body: null,

    status(code) {
        this.statusCode = code;
        return this;
    },

    json(body) {
        this.body = body;
        return this;
    }
});

const makeUser = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    name: "Test Learner",
    email: "learner.test@example.com",
    password: "hashed-password",
    role: "learner",
    status: "active",
    ...overrides
});

const makeToken = (userId) => jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

// REGISTER

test("register rejects missing required fields", async () => {
    const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "learner.test@example.com" });

    assert.equal(res.status, 400);
    assert.equal(
        res.body.message,
        "Name, email and password are required"
    );
});

test("register rejects an existing email", async () => {
    replace(User, "findOne", async () => makeUser());

    const res = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Test Learner",
            email: "learner.test@example.com",
            password: "ValidPass123!"
        });

    assert.equal(res.status, 409);
    assert.equal(res.body.message, "Email already exists");
});

test("register hashes the password and assigns learner role by default", async () => {
    let createdFields;

    replace(User, "findOne", async () => null);

    replace(User, "create", async (fields) => {
        createdFields = fields;

        return {
            _id: new mongoose.Types.ObjectId(),
            ...fields,
            status: "active"
        };
    });

    const res = await request(app)
        .post("/api/auth/register")
        .send({
            name: "New Learner",
            email: "new.learner@example.com",
            password: "ValidPass123!"
        });

    assert.equal(res.status, 201);
    assert.equal(createdFields.role, "learner");
    assert.notEqual(createdFields.password, "ValidPass123!");
    assert.equal(
        await bcrypt.compare("ValidPass123!", createdFields.password),
        true
    );
    assert.equal(res.body.user.email, "new.learner@example.com");
    assert.equal("password" in res.body.user, false);
});

// LOGIN

test("login rejects missing email or password", async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "learner.test@example.com" });

    assert.equal(res.status, 400);
    assert.equal(res.body.message, "email and password are required");
});

test("login rejects an unknown email", async () => {
    replace(User, "findOne", async () => null);

    const res = await request(app)
        .post("/api/auth/login")
        .send({
            email: "unknown@example.com",
            password: "ValidPass123!"
        });

    assert.equal(res.status, 401);
    assert.equal(res.body.message, "invalid email or password");
});

test("login rejects an incorrect password", async () => {
    const user = makeUser({
        password: await bcrypt.hash("CorrectPass123!", 10)
    });

    replace(User, "findOne", async () => user);

    const res = await request(app)
        .post("/api/auth/login")
        .send({
            email: user.email,
            password: "WrongPass123!"
        });

    assert.equal(res.status, 401);
    assert.equal(res.body.message, "invalid email or password");
});

test("login returns a JWT for valid credentials", async () => {
    const user = makeUser({
        password: await bcrypt.hash("CorrectPass123!", 10)
    });

    replace(User, "findOne", async () => user);

    const res = await request(app)
        .post("/api/auth/login")
        .send({
            email: user.email,
            password: "CorrectPass123!"
        });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "login successful");
    assert.equal(res.body.user.role, "learner");

    const decoded = jwt.verify(
        res.body.token,
        process.env.JWT_SECRET
    );

    assert.equal(decoded.sub, user._id.toString());
});

// AUTH MIDDLEWARE AND /ME

test("GET /me rejects a request without a token", async () => {
    const res = await request(app).get("/api/auth/me");

    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Authentication token required");
});

test("GET /me rejects an invalid token", async () => {
    const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Invalid token");
});

test("GET /me returns the authenticated user's profile", async () => {
    const user = makeUser();
    const token = makeToken(user._id);

    replace(User, "findById", () => ({
        select: async () => user
    }));

    const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.id, user._id.toString());
    assert.equal(res.body.user.email, user.email);
    assert.equal(res.body.user.role, "learner");
});

test("GET /me rejects an inactive account", async () => {
    const user = makeUser({ status: "inactive" });
    const token = makeToken(user._id);

    replace(User, "findById", () => ({
        select: async () => user
    }));

    const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Account is inactive");
});

// AUTHORIZE MIDDLEWARE

test("authorize rejects a request without an authenticated user", () => {
    const res = response();
    let nextCalled = false;

    authorize("trainer", "admin")(
        {},
        res,
        () => { nextCalled = true; }
    );

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("authorize rejects a role that is not allowed", () => {
    const res = response();
    let nextCalled = false;

    authorize("trainer", "admin")(
        { user: { role: "learner" } },
        res,
        () => { nextCalled = true; }
    );

    assert.equal(res.statusCode, 403);
    assert.equal(
        res.body.message,
        "You do not have permission to access this resource"
    );
    assert.equal(nextCalled, false);
});

test("authorize allows an approved role", () => {
    const res = response();
    let nextCalled = false;

    authorize("trainer", "admin")(
        { user: { role: "trainer" } },
        res,
        () => { nextCalled = true; }
    );

    assert.equal(nextCalled, true);
});

test("course owner can update their course", async () => {
    const trainer = makeUser({ role: "trainer" });
    const courseId = new mongoose.Types.ObjectId();

    const course = {
        _id: courseId,
        title: "Original title",
        description: "Test course",
        category: "Testing",
        level: "beginner",
        status: "published",
        trainer: trainer._id,
        save: async function () {
            return this;
        }
    };

    replace(User, "findById", () => ({
        select: async () => trainer
    }));

    replace(Course, "findById", async (id) => {
        assert.equal(id, courseId.toString());
        return course;
    });

    const token = makeToken(trainer._id);

    const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Updated title"
        });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, "Updated title");
});

test("another trainer cannot update a course they do not own", async () => {
    const anotherTrainer = makeUser({ role: "trainer" });
    const ownerId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();

    const course = {
        _id: courseId,
        title: "Original title",
        description: "Test course",
        category: "Testing",
        level: "beginner",
        status: "published",
        trainer: ownerId,
        save: async function () {
            return this;
        }
    };

    replace(User, "findById", () => ({
        select: async () => anotherTrainer
    }));

    replace(Course, "findById", async (id) => {
        assert.equal(id, courseId.toString());
        return course;
    });

    const token = makeToken(anotherTrainer._id);

    const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Unauthorized update"
        });

    assert.equal(res.status, 403);
    assert.equal(
        res.body.message,
        "You are not allowed to update this course"
    );
});

test("another trainer cannot delete a course they do not own", async () => {
    const anotherTrainer = makeUser({ role: "trainer" });
    const ownerId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();
    let deleteCalled = false;

    const course = {
        _id: courseId,
        title: "Protected course",
        trainer: ownerId,
        deleteOne: async () => {
            deleteCalled = true;
        }
    };

    replace(User, "findById", () => ({
        select: async () => anotherTrainer
    }));

    replace(Course, "findById", async () => course);

    const token = makeToken(anotherTrainer._id);

    const res = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 403);
    assert.equal(
        res.body.message,
        "You are not allowed to delete this course"
    );
    assert.equal(deleteCalled, false);
});

test("another trainer cannot upload a resource to a course they do not own", async () => {
    const anotherTrainer = makeUser({ role: "trainer" });
    const ownerId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();

    const course = {
        _id: courseId,
        title: "Protected course",
        trainer: ownerId
    };

    replace(User, "findById", () => ({
        select: async () => anotherTrainer
    }));

    replace(Module, "findById", (id) => {
        assert.equal(id, moduleId.toString());

        return {
            select: async () => ({
                _id: moduleId,
                course: courseId
            })
        };
    });

    replace(Course, "findById", async (id) => {
        assert.equal(id.toString(), courseId.toString());
        return course;
    });

    const token = makeToken(anotherTrainer._id);

    const res = await request(app)
        .post(`/api/modules/${moduleId}/resources`)
        .set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 403);
    assert.equal(
        res.body.message,
        "you are not allowed to access this course content"
    );
});

test("course owner can upload a resource to their course", async () => {
    const trainer = makeUser({ role: "trainer" });
    const courseId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();

    const course = {
        _id: courseId,
        trainer: trainer._id,
        status: "published"
    };

    let driveUploadCalled = false;

    const originalDriveCreate = drive.files.create;
    const originalFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    process.env.GOOGLE_DRIVE_FOLDER_ID = "test-folder-id";

    drive.files.create = async ({ media }) => {
        driveUploadCalled = true;
        media.body.destroy();

        return {
            data: {
                id: "test-drive-file-id",
                name: "owner-test.pdf",
                webViewLink:
                    "https://drive.google.com/file/d/test-drive-file-id/view"
            }
        };
    };

    replace(User, "findById", () => ({
        select: async () => trainer
    }));

    replace(Module, "findById", (id) => {
        assert.equal(id, moduleId.toString());

        return {
            select: async () => ({
                _id: moduleId,
                course: courseId
            })
        };
    });

    replace(Course, "findById", async (id) => {
        assert.equal(id.toString(), courseId.toString());
        return course;
    });

    replace(Module, "exists", async () => ({
        _id: moduleId
    }));

    replace(Resource, "create", async (fields) => ({
        _id: new mongoose.Types.ObjectId(),
        ...fields
    }));

    try {
        const res = await request(app)
            .post(`/api/modules/${moduleId}/resources`)
            .set("Authorization", `Bearer ${makeToken(trainer._id)}`)
            .field("title", "Owner upload test")
            .attach(
                "file",
                Buffer.from("%PDF-1.4\nTest PDF content"),
                {
                    filename: "owner-test.pdf",
                    contentType: "application/pdf"
                }
            );

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.title, "Owner upload test");
        assert.equal(driveUploadCalled, true);
    } finally {
        drive.files.create = originalDriveCreate;

        if (originalFolderId === undefined) {
            delete process.env.GOOGLE_DRIVE_FOLDER_ID;
        } else {
            process.env.GOOGLE_DRIVE_FOLDER_ID = originalFolderId;
        }
    }
});

test("learner cannot create a course", async () => {
    const learner = makeUser({ role: "learner" });
    const token = makeToken(learner._id);

    replace(User, "findById", () => ({
        select: async () => learner
    }));

    const res = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Unauthorized Course",
            description: "This course should not be created",
            category: "Testing",
            level: "beginner"
        });

    assert.equal(res.status, 403);
    assert.equal(
        res.body.message,
        "You do not have permission to access this resource"
    );
});

test("learner cannot upload a resource", async () => {
    const learner = makeUser({ role: "learner" });
    const moduleId = new mongoose.Types.ObjectId();
    const token = makeToken(learner._id);

    replace(User, "findById", () => ({
        select: async () => learner
    }));

    const res = await request(app)
        .post(`/api/modules/${moduleId}/resources`)
        .set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 403);
    assert.equal(
        res.body.message,
        "You do not have permission to access this resource"
    );
});