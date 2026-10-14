# Progression API

All endpoints require a bearer token for an active learner. A learner can access only progressions linked to their own active enrollment.

## List my progressions

`GET /api/progression`

Example response:

```json
{
  "count": 1,
  "progressions": [
    {
      "_id": "66a000000000000000000001",
      "student_id": "66a000000000000000000002",
      "enrollment_id": "66a000000000000000000003",
      "course_id": {
        "_id": "66a000000000000000000004",
        "title": "MongoDB Fundamentals",
        "description": "Learn MongoDB"
      },
      "completed_resources": [],
      "completed": false,
      "completed_at": null
    }
  ]
}
```

## Get one progression

`GET /api/progression/{id}`

Example response:

```json
{
  "progression": {
    "_id": "66a000000000000000000001",
    "student_id": "66a000000000000000000002",
    "enrollment_id": "66a000000000000000000003",
    "course_id": {
      "_id": "66a000000000000000000004",
      "title": "MongoDB Fundamentals",
      "description": "Learn MongoDB"
    },
    "completed_resources": [],
    "completed": false,
    "completed_at": null
  }
}
```

An ID that is malformed returns `400`. A missing progression returns `404`; a progression owned by another learner returns `403`.

## Initialize progression

`POST /api/progression`

Initialization is on demand after enrollment. The enrollment must belong to the authenticated learner and have active status.

Request:

```json
{
  "enrollment_id": "66a000000000000000000003"
}
```

New progression response (`201`):

```json
{
  "progression": {
    "_id": "66a000000000000000000001",
    "student_id": "66a000000000000000000002",
    "enrollment_id": "66a000000000000000000003",
    "course_id": "66a000000000000000000004",
    "completed_resources": [],
    "completed": false,
    "completed_at": null
  },
  "initialized": true
}
```

Calling initialization again for an existing progression returns `200` with `initialized: false`. Invalid request data returns `400`; a missing enrollment returns `404`; an inactive enrollment returns `403`.

## Complete a resource

`PATCH /api/progression/{id}/resources/{resourceId}`

The request body is empty. Resources must belong to the progression's course. Resources in later modules remain unavailable until every resource in earlier modules is completed.

Example response:

```json
{
  "progression": {
    "_id": "66a000000000000000000001",
    "completed_resources": ["66a000000000000000000005"],
    "completed": false,
    "completed_at": null
  },
  "progress_percentage": 50
}
```

The percentage is calculated from the course's resources and stored on the corresponding enrollment. It is bounded from `0` to `100`. When every resource is complete, the response reports `100`, sets `completed` to `true`, and records `completed_at`.

Invalid IDs return `400`; missing progressions or resources return `404`; resources outside the course or attempts before earlier modules are complete return `400` or `409`; duplicate completion returns `409`.
