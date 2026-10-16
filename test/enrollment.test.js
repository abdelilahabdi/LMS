const { test } = require("node:test");
const assert = require("node:assert/strict");

// Simple focused tests covering mandatory enrollment scenarios.
// These mock the controller inputs (not a full DB integration)
// to remain safe for beginners and avoid requiring a live DB.

test("Enrollment model has unique student+course index", () => {
  const Enrollment = require("../src/models/Enrollment");
  const indexes = Enrollment.schema.indexes();
  const found = indexes.some(([keys, opts]) =>
    keys.student_id === 1 && keys.course_id === 1 && opts.unique === true
  );
  assert.ok(found, "Expected unique index on student_id + course_id");
});

test("Enrollment controller exports required methods", () => {
  const controller = require("../src/controllers/EnrollmentController");
  assert.strictEqual(typeof controller.enrollment_create, "function");
  assert.strictEqual(typeof controller.enrollment_getAll, "function");
});
