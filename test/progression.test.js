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
    assert.equal(schema.path("completed_resources").caster.options.ref, "Resource");
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


test("completion rejects a resource when earlier module resources are incomplete", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const progressionId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();
    const earlierModuleId = new mongoose.Types.ObjectId();
    const targetModuleId = new mongoose.Types.ObjectId();
    const earlierResourceId = new mongoose.Types.ObjectId();
    const targetResourceId = new mongoose.Types.ObjectId();

    const progression = {
        _id: progressionId,
        enrollment_id: new mongoose.Types.ObjectId(),
        course_id: courseId,
        completed_resources: []
    };

    replace(Progress, "findOne", async () => progression);

    replace(Enrollment, "findOne", async () => ({
        status_id: "active"
    }));

    replace(Status, "findById", async () => ({
        status_name: "active"
    }));

    replace(Resource, "findById", async () => ({
        _id: targetResourceId,
        id: targetResourceId.toString(),
        module: targetModuleId
    }));

    replace(Module, "findById", async () => ({
        course: courseId,
        order: 2
    }));

    replace(Module, "find", () => ({
        sort() {
            return this;
        },
        select: async () => [
            {
                _id: earlierModuleId,
                order: 1,
                title: "Earlier Module"
            }
        ]
    }));

    replace(Resource, "find", () => ({
        select: async () => [
            {
                _id: earlierResourceId,
                module: earlierModuleId
            }
        ]
    }));

    const res = response();

    await progressionController.completeResource(
        {
            user: { id: learnerId },
            params: {
                id: progressionId.toString(),
                resourceId: targetResourceId.toString()
            }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 409);
    assert.equal(
        res.body.message,
        "Complete all resources in earlier modules first"
    );
    assert.equal(
        res.body.required_module_id.toString(),
        earlierModuleId.toString()
    );
});



test("completion rejects a resource that is already completed", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const progressionId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();
    const resourceId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();

    const progression = {
        _id: progressionId,
        enrollment_id: new mongoose.Types.ObjectId(),
        course_id: courseId,
        completed_resources: [resourceId]
    };

    replace(Progress, "findOne", async () => progression);

    replace(Enrollment, "findOne", async () => ({
        status_id: "active"
    }));

    replace(Status, "findById", async () => ({
        status_name: "active"
    }));

    replace(Resource, "findById", async () => ({
        _id: resourceId,
        id: resourceId.toString(),
        module: moduleId
    }));

    replace(Module, "findById", async () => ({
        course: courseId,
        order: 1
    }));

    replace(Module, "find", () => ({
        sort() {
            return this;
        },
        select: async () => []
    }));

    const res = response();

    await progressionController.completeResource(
        {
            user: { id: learnerId },
            params: {
                id: progressionId.toString(),
                resourceId: resourceId.toString()
            }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Resource is already completed");
});



test("getProgressionById rejects another learner's progression", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const anotherLearnerId = new mongoose.Types.ObjectId();

    const progression = {
        _id: new mongoose.Types.ObjectId(),
        student_id: anotherLearnerId,
        enrollment_id: new mongoose.Types.ObjectId(),
        course_id: new mongoose.Types.ObjectId(),
        completed_resources: []
    };

    let populateCalls = 0;

    const query = {
        populate() {
            populateCalls += 1;

            if (populateCalls === 3) {
                return Promise.resolve(progression);
            }

            return this;
        }
    };

    replace(Progress, "findById", () => query);

    const res = response();

    await progressionController.getProgressionById(
        {
            user: { id: learnerId },
            params: { id: progression._id.toString() }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 403);
    assert.equal(
        res.body.message,
        "You cannot access this progression"
    );
});


test("getProgressions returns only the authenticated learner's progressions", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();

    const progressions = [
        {
            _id: new mongoose.Types.ObjectId(),
            student_id: learnerId,
            course_id: new mongoose.Types.ObjectId(),
            completed_resources: []
        }
    ];

    let queryFilter;

    const query = {
        populate() {
            return this;
        },
        then(resolve, reject) {
            return Promise.resolve(progressions).then(resolve, reject);
        }
    };

    replace(Progress, "find", (filter) => {
        queryFilter = filter;
        return query;
    });

    const res = response();

    await progressionController.getProgressions(
        {
            user: { id: learnerId }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(queryFilter.student_id, learnerId);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.count, 1);
    assert.equal(res.body.progressions.length, 1);
});


test("getProgressionById allows the owner to view their progression", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();

    const progression = {
        _id: new mongoose.Types.ObjectId(),
        student_id: new mongoose.Types.ObjectId(learnerId),
        enrollment_id: new mongoose.Types.ObjectId(),
        course_id: new mongoose.Types.ObjectId(),
        completed_resources: []
    };

    const query = {
        populate() {
            return this;
        },
        then(resolve, reject) {
            return Promise.resolve(progression).then(resolve, reject);
        }
    };

    replace(Progress, "findById", (id) => {
        assert.equal(id, progression._id.toString());
        return query;
    });

    const res = response();

    await progressionController.getProgressionById(
        {
            user: { id: learnerId },
            params: { id: progression._id.toString() }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.progression, progression);
});

test("getProgressionById returns 404 when progression does not exist", async () => {
    const query = {
        populate() {
            return this;
        },
        then(resolve, reject) {
            return Promise.resolve(null).then(resolve, reject);
        }
    };

    replace(Progress, "findById", () => query);

    const res = response();

    await progressionController.getProgressionById(
        {
            user: { id: new mongoose.Types.ObjectId().toString() },
            params: { id: new mongoose.Types.ObjectId().toString() }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Progression not found");
});


test("initialization reuses an existing progression for the same enrollment", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const enrollmentId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();

    const existingProgression = {
        _id: new mongoose.Types.ObjectId(),
        student_id: learnerId,
        enrollment_id: enrollmentId,
        course_id: courseId,
        completed_resources: []
    };

    replace(Enrollment, "findOne", async () => ({
        _id: enrollmentId,
        id: enrollmentId.toString(),
        course_id: courseId,
        status_id: "active"
    }));

    replace(Status, "findById", async () => ({
        status_name: "active"
    }));

    replace(Progress, "findOne", async () => existingProgression);

    replace(Progress, "create", async () => {
        throw new Error("A duplicate progression should not be created");
    });

    const res = response();

    await progressionController.initializeProgression(
        {
            user: { id: learnerId },
            body: { enrollment_id: enrollmentId.toString() }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.initialized, false);
    assert.equal(res.body.progression, existingProgression);
});

test("initialization rejects a duplicate progression for the same course", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const oldEnrollmentId = new mongoose.Types.ObjectId();
    const newEnrollmentId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();

    const existingProgression = {
        _id: new mongoose.Types.ObjectId(),
        student_id: learnerId,
        enrollment_id: oldEnrollmentId,
        course_id: courseId,
        completed_resources: []
    };

    replace(Enrollment, "findOne", async () => ({
        _id: newEnrollmentId,
        id: newEnrollmentId.toString(),
        course_id: courseId,
        status_id: "active"
    }));

    replace(Status, "findById", async () => ({
        status_name: "active"
    }));

    replace(Progress, "findOne", async () => existingProgression);

    replace(Progress, "create", async () => {
        throw new Error("A duplicate progression should not be created");
    });

    const res = response();

    await progressionController.initializeProgression(
        {
            user: { id: learnerId },
            body: { enrollment_id: newEnrollmentId.toString() }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 409);
    assert.equal(
        res.body.message,
        "Progression already exists for this course"
    );
});

test("completion returns 404 when progression does not exist", async () => {
    replace(Progress, "findOne", async () => null);

    const res = response();

    await progressionController.completeResource(
        {
            user: { id: new mongoose.Types.ObjectId().toString() },
            params: {
                id: new mongoose.Types.ObjectId().toString(),
                resourceId: new mongoose.Types.ObjectId().toString()
            }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Progression not found");
});

test("completion returns 404 when resource does not exist", async () => {
    const learnerId = new mongoose.Types.ObjectId().toString();
    const progressionId = new mongoose.Types.ObjectId();

    const progression = {
        _id: progressionId,
        student_id: learnerId,
        enrollment_id: new mongoose.Types.ObjectId(),
        course_id: new mongoose.Types.ObjectId(),
        completed_resources: []
    };

    replace(Progress, "findOne", async () => progression);
    replace(Enrollment, "findOne", async () => ({
        status_id: "active"
    }));
    replace(Status, "findById", async () => ({
        status_name: "active"
    }));
    replace(Resource, "findById", async () => null);

    const res = response();

    await progressionController.completeResource(
        {
            user: { id: learnerId },
            params: {
                id: progressionId.toString(),
                resourceId: new mongoose.Types.ObjectId().toString()
            }
        },
        res,
        (error) => {
            throw error;
        }
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Resource not found");
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
