# DB2 Performance Viz API Contract

Base URL: `/api`

## General Rules

- Time-filtered endpoints use interval query params:
  - `from`: `YYYY-MM-DDTHH:mm:ss`
  - `to`: `YYYY-MM-DDTHH:mm:ss`
- `subsystem` and `collection` are not sent by the frontend.
- For large lists (packages, statements), backend pagination is required.
- Search endpoints should be optimized for typeahead usage (fast response, lightweight rows).
- Standard response envelope (recommended):

```json
{
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 0,
    "totalPages": 0
  },
  "error": null
}
```

- Error response:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human readable error"
  }
}
```

## 1) Dashboard

### GET `/dashboard/kpis`
Query:
- `from` (required)
- `to` (required)

Response:

```json
{
  "data": {
    "totalCpu": 25056,
    "totalElapsed": 112592,
    "totalGetPages": 7187091651,
    "totalSqlCalls": 343789304
  },
  "meta": null,
  "error": null
}
```

### GET `/dashboard/metrics-trend`
Query:
- `from` (required)
- `to` (required)

Response `data` (array):

```json
[
  {
    "timestamp": "2026-12-03T10:00:00",
    "time": "10:00",
    "cpu": 1200,
    "elapsed": 4100,
    "getPages": 70000,
    "sqlCalls": 2500
  }
]
```

### GET `/dashboard/worst-packages`
Query:
- `from` (required)
- `to` (required)
- `pageNumber` (optional, default `1`)
- `pageSize` (optional, default `15`)
- `sortBy` (optional, e.g. `DB2_CPU`)

Response:

```json
{
  "data": [
    {
      "collection": "PDB2I",
      "program": "xxx",
      "consistencyToken": "xxx",
      "db2Elapsed": 1405,
      "getPages": 43000,
      "sqlCalls": 2430000,
      "binds": [
        {
          "conToken": "xxxx",
          "bindTime": "xxxx",
          "version": "xxxx"
        }
      ],
      "sqlStatements": [],
      "db2Cpu": 1299
    }
  ],
  "meta": null,
  "error": null
}
```

### GET `/dashboard/worst-statements`
Query:
- `from`, `to`, `page`, `pageSize`, `sortBy`

Response `data.items`:

```json
[
  {
    "id": 101,
    "sqlText": "SELECT ...",
    "program": "ORDER_SVC",
    "totalCpu": 9000,
    "totalElapsed": 22000,
    "totalGetPages": 130000,
    "executionCount": 111
  }
]
```

### GET `/dashboard/search-statements`
Query:
- `query` (required)
- `from` (required)
- `to` (required)
- `page` (optional)
- `pageSize` (optional)

## 2) Packages

All package controller endpoints return the same package structure.
Behavior:
- `/packages/{packageName}/binds`: `binds` is populated and `sqlStatements` is empty.
- `/packages/{packageName}/statements`: `sqlStatements` is populated and `binds` is empty.

### GET `/packages`
Query:
- `topN` (optional, e.g. `10`)

Response:

```json
{
  "data": [
    {
      "collection": "PDB2I",
      "program": "xxx",
      "consistencyToken": "xxx",
      "db2Elapsed": 1405,
      "getPages": 43000,
      "sqlCalls": 2430000,
      "binds": [
        {
          "conToken": "xxxx",
          "bindTime": "xxxx",
          "version": "xxxx"
        }
      ],
      "sqlStatements": [
        {
          "seqNumber": 0,
          "statementNumber": 0,
          "statement": ""
        }
      ],
      "db2Cpu": 1299
    }
  ],
  "meta": null,
  "error": null
}
```

### GET `/packages/{packageName}`
Query:
- `showBinds` (optional, boolean)
- `showStatements` (optional, boolean)

Response:

```json
{
  "data": {
    "collection": "PDB2I",
    "program": "xxx",
    "consistencyToken": "xxx",
    "db2Elapsed": 1405,
    "getPages": 43000,
    "sqlCalls": 2430000,
    "binds": [
      {
        "conToken": "xxxx",
        "bindTime": "xxxx",
        "version": "xxxx"
      }
    ],
    "sqlStatements": [
      {
        "seqNumber": 0,
        "statementNumber": 0,
        "statement": ""
      }
    ],
    "db2Cpu": 1299
  },
  "meta": null,
  "error": null
}
```

### GET `/packages/{packageName}/binds`
Response:

```json
{
  "data": {
    "collection": "PDB2I",
    "program": "xxx",
    "consistencyToken": "xxx",
    "db2Elapsed": 1405,
    "getPages": 43000,
    "sqlCalls": 2430000,
    "binds": [
      {
        "conToken": "xxxx",
        "bindTime": "xxxx",
        "version": "xxxx"
      }
    ],
    "sqlStatements": [],
    "db2Cpu": 1299
  },
  "meta": null,
  "error": null
}
```

### GET `/packages/{packageName}/statements`
Response:

```json
{
  "data": {
    "collection": "PDB2I",
    "program": "xxx",
    "consistencyToken": "xxx",
    "db2Elapsed": 1405,
    "getPages": 43000,
    "sqlCalls": 2430000,
    "binds": [],
    "sqlStatements": [
      {
        "seqNumber": 0,
        "statementNumber": 0,
        "statement": ""
      }
    ],
    "db2Cpu": 1299
  },
  "meta": null,
  "error": null
}
```

### POST `/packages/:packageId/rebind`
Body:

```json
{
  "isolationLevel": "CS",
  "blocking": "UNAMBIG"
}
```

Response `data`:

```json
{
  "status": "accepted",
  "jobId": "REBIND-12345"
}
```

## 2.1) User Package State (Watch List + Reviewed)

These endpoints are recommended so watch list and reviewed package state can be synced across sessions/users instead of local storage only.

### GET `/users/me/package-state`
Response `data`:

```json
{
  "favoritePackageIds": ["1", "42", "701"],
  "reviewedPackageIds": ["42"]
}
```

### PUT `/users/me/package-state`
Body:

```json
{
  "favoritePackageIds": ["1", "42", "701"],
  "reviewedPackageIds": ["42"]
}
```

Response `data`:

```json
{
  "updated": true
}
```

Optional split endpoints if preferred:
- `GET /users/me/watch-list`
- `PUT /users/me/watch-list`
- `GET /users/me/reviewed-packages`
- `PUT /users/me/reviewed-packages`

## 3) Statements

### GET `/statements/:statementId`
Response `data`:

```json
{
  "id": 501,
  "sqlText": "SELECT ...",
  "program": "ORDER_SVC",
  "collection": "XDB2I",
  "textToken": "TTABC123",
  "contoken": "CTABC123"
}
```

### GET `/statements/:statementId/metrics`
Query:
- `from` (required)
- `to` (required)

Response `data`:

```json
{
  "executionCount": 1000,
  "avgCpu": 12,
  "avgElapsed": 45
}
```

### GET `/statements/:statementId/trend`
Query:
- `from` (required)
- `to` (required)

Response `data` (array):

```json
[
  {
    "timestamp": "2026-12-03T10:00:00",
    "time": "10:00",
    "cpu": 120,
    "getPages": 4000
  }
]
```

### GET `/statements/:statementId/tables`
Response `data` (array):

```json
[
  {
    "tableName": "TABLE_USERS"
  }
]
```

### GET `/tables/:tableName/statistics`
Response `data`:

```json
{
  "tableName": "TABLE_USERS",
  "tableId": "TAB001",
  "cardinalityEstimate": 500000,
  "lastStatsTime": "2026-11-15T06:10:00",
  "columns": [
    { "name": "USER_ID", "type": "INTEGER", "nullable": false }
  ]
}
```

## 4) Explain

### GET `/explain/statements`
Query:
- `from` (required)
- `to` (required)
- `page` (optional)
- `pageSize` (optional)

Response `data.items`:

```json
[
  {
    "id": 501,
    "sqlText": "SELECT ...",
    "contoken": "CTABC123"
  }
]
```

### GET `/explain/current`
Query:
- `statementId` (required)
- `contoken` (optional)
- `from` (required)
- `to` (required)

### GET `/explain/previous`
Query:
- `statementId` (required)
- `from` (required)
- `to` (required)

Current/previous response `data`:

```json
{
  "statementId": 501,
  "accessMethod": "INDEX RANGE SCAN",
  "indexName": "IDX_MAIN_001",
  "estimatedRows": 15000,
  "estimatedCost": 1250,
  "filterFactor": 0.0567,
  "plansteps": [
    { "step": 1, "method": "INDEX RANGE SCAN", "object": "IDX_MAIN_001", "cost": 1250 }
  ]
}
```

### GET `/explain/compare`
Query:
- `currentId` (optional)
- `previousId` (optional)
- `statementId` (optional)
- `from` (optional)
- `to` (optional)

### POST `/explain/dynamic`
Body:

```json
{
  "sqlText": "SELECT ...",
  "options": {
    "currentSchema": "MYSCHEMA"
  }
}
```

## 5) Config & Health

### GET `/config/settings`
### PUT `/config/settings`
### GET `/config/collections`
### GET `/config/subsystems`
### GET `/config/runtime-context`
### GET `/health`

### GET `/config/runtime-context`
Used by navbar badges and header context.

Response `data`:

```json
{
  "environment": "DEV",
  "subsystem": "DB2",
  "collection": "XDB2I"
}
```

## Compatibility Note

Frontend currently tolerates these payload styles for gradual backend rollout:

- `response.data`
- `response.data.data`
- list payload in `response.data.items` or `response.data.data.items`

Current frontend behavior notes:
- Package Analyzer now uses searchable package selection (typeahead pattern) instead of a full dropdown.
- Watch list and reviewed state are currently persisted in local storage, but API endpoints in section 2.1 are recommended for durable server-side persistence.
- Navbar environment/subsystem/collection are currently read from frontend env vars, but `/config/runtime-context` is recommended for backend-driven context.

Recommended final target is the standard envelope shown above.
