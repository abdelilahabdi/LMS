const { test } = require("node:test");
const assert = require("node:assert/strict");

test("Trainer routes expose enrolled and progression endpoints", () => {
  const trainerRoutes = require("../src/routes/trainerRoutes");
  const paths = trainerRoutes.stack
    .map((layer) => layer.route && layer.route.path)
    .filter(Boolean);
  assert.ok(paths.includes("/enrolled"));
  assert.ok(paths.includes("/progression/:studentId/:courseId"));
});
