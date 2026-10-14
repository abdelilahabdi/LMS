const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Progress = require("../src/models/Progress");
const Enrollment = require("../src/models/Enrollment");
const Status = require("../src/models/Status");
const Resource = require("../src/models/Resource");
const Module = require("../src/models/Module");
const progressionController = require("../src/controllers/progressionController");
const validation = require("../src/middlewares/progressionValidation");

const originalMethods = new Map();

const replace = (model, method, implementation) => {
    const key = `${model.modelName}.${method}`;
    if (!originalMethods.has(key)) {
        originalMethods.set(key, { model, method, original: model[method] });
    }
    model[method] = implementation;
};

afterEach(() => {
    for (const { model, method, original } of originalMethods.values()) {
        model[method] = original;
    }
    originalMethods.clear();
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

const runValidation = (middleware, req) => {
    let nextCalled = false;
    const res = response();
    middleware(req, res, () => { nextCalled = true; });
    return { res, nextCalled };
};

test("Progress model requires learner, enrollment, and course references", () => {
    const schema = Progress.schema;
    assert.equal(schema.path("student_id").options.ref, "User");
    assert.equal(schema.path("enrollment_id").options.ref, "Enrollment");
    assert.equal(schema.path("course_id").options.ref, "Course");
    assert.equal(schema.path("completed_resources").embeddedSchemaType.options.ref, "Resource");
    assert.ok(schema.indexes().some(([keys, options]) => keys.enrollment_id === 1 && options.unique));
});

test("initialization validation rejects malformed and extra fields", () => {
    const badId = runValidation(validation.validateProgressionInitialization, {
        body: { enrollment_id: "not-an-id" }
    });
    assert.equal(badId.res.statusCode, 400);
    assert.equal(badId.nextCalled, false);

    const extraField = runValidation(validation.validateProgressionInitialization, {
        body: { enrollment_id: new mongoose.Types.ObjectId().toString(), student_id: "forged" }
    });
    assert.equal(extraField.res.statusCode, 400);
    assert.equal(extraField.nextCalled, false);

    const valid = runValidation(validation.validateProgressionInitialization, {
        body: { enrollment_id: new mongoose.Types.ObjectId().toString() }
    });
    assert.equal(valid.nextCalled, true);
});

test("initialization creates a progression for the authenticated learner's active enrollment", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const enrollmentId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();
    const created = { _id: new mongoose.Types.ObjectId() };
    let createdFields;

    replace(Enrollment, "findOne", async (query) => {
        assert.equal(query._id, enrollmentId.toString());
        assert.equal(query.student_id, learnerId);
        return { _id: enrollmentId, id: enrollmentId.toString(), course_id: courseId, status_id: "status" };
    });
    replace(Status, "findById", async () => ({ status_name: "active" }));
    replace(Progress, "findOne", async () => null);
    replace(Progress, "create", async (fields) => { createdFields = fields; return created; });

    const res = response();
    await progressionController.initializeProgression({
        user: { id: learnerId },
        body: { enrollment_id: enrollmentId.toString() }
    }, res, (error) => { throw error; });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.initialized, true);
    assert.equal(createdFields.student_id, learnerId);
    assert.equal(createdFields.enrollment_id, enrollmentId);
    assert.equal(createdFields.course_id, courseId);
});

test("initialization rejects missing or inactive enrollments", async () => {
    replace(Enrollment, "findOne", async () => null);
    replace(Status, "findById", async () => ({ status_name: "inactive" }));

    const missingResponse = response();
    await progressionController.initializeProgression({
        user: { id: new mongoose.Types.ObjectId().toString() },
        body: { enrollment_id: new mongoose.Types.ObjectId().toString() }
    }, missingResponse, (error) => { throw error; });
    assert.equal(missingResponse.statusCode, 404);

    const enrollmentId = new mongoose.Types.ObjectId();
    replace(Enrollment, "findOne", async () => ({
        _id: enrollmentId,
        course_id: new mongoose.Types.ObjectId(),
        status_id: "inactive"
    }));
    const inactiveResponse = response();
    await progressionController.initializeProgression({
        user: { id: new mongoose.Types.ObjectId().toString() },
        body: { enrollment_id: enrollmentId.toString() }
    }, inactiveResponse, (error) => { throw error; });
    assert.equal(inactiveResponse.statusCode, 403);
});

test("completion recalculates percentage and marks a fully completed course", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const progressionId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();
    const resourceId = new mongoose.Types.ObjectId();
    const enrollment = {
        status_id: "active",
        progress_percentage: 0,
        save: async () => {}
    };
    const progression = {
        _id: progressionId,
        student_id: learnerId,
        enrollment_id: new mongoose.Types.ObjectId(),
        course_id: courseId,
        completed_resources: [],
        completed_at: null,
        save: async () => {}
    };
    const latestProgression = {
        ...progression,
        completed_resources: [resourceId],
        save: async () => {}
    };

    replace(Progress, "findOne", async () => progression);
    replace(Enrollment, "findOne", async () => enrollment);
    replace(Status, "findById", async () => ({ status_name: "active" }));
    replace(Resource, "findById", async () => ({ _id: resourceId, id: resourceId.toString(), module: moduleId }));
    replace(Progress, "updateOne", async () => ({ modifiedCount: 1 }));
    replace(Progress, "findById", async () => latestProgression);
    replace(Module, "findById", async () => ({ course: courseId, order: 1 }));

    let moduleFindCalls = 0;
    replace(Module, "find", () => {
        moduleFindCalls += 1;
        if (moduleFindCalls === 1) {
            return {
                sort() { return this; },
                select: async () => []
            };
        }
        return { distinct: async () => [moduleId] };
    });
    replace(Resource, "find", () => ({ select: async () => [{ _id: resourceId }] }));

    const res = response();
    await progressionController.completeResource({
        user: { id: learnerId },
        params: { id: progressionId.toString(), resourceId: resourceId.toString() }
    }, res, (error) => { throw error; });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.progress_percentage, 100);
    assert.equal(latestProgression.completed, true);
    assert.ok(latestProgression.completed_at instanceof Date);
    assert.equal(enrollment.progress_percentage, 100);
});

test("completion rejects a resource from another course", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const courseId = new mongoose.Types.ObjectId();
    const resourceId = new mongoose.Types.ObjectId();
    const progression = {
        _id: new mongoose.Types.ObjectId(),
        enrollment_id: new mongoose.Types.ObjectId(),
        course_id: courseId,
        completed_resources: []
    };

    replace(Progress, "findOne", async () => progression);
    replace(Enrollment, "findOne", async () => ({ status_id: "active" }));
    replace(Status, "findById", async () => ({ status_name: "active" }));
    replace(Resource, "findById", async () => ({ id: resourceId.toString(), module: "module" }));
    replace(Module, "findById", async () => ({ course: new mongoose.Types.ObjectId() }));

    const res = response();
    await progressionController.completeResource({
        user: { id: learnerId },
        params: { id: progression._id.toString(), resourceId: resourceId.toString() }
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 400);
});
