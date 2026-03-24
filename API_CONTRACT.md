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

Response `data`:

```json
{
  "totalCpu": 125420,
  "totalElapsed": 245680,
  "totalGetPages": 5234000,
  "totalSqlCalls": 125000
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
- `page` (optional, default `1`)
- `pageSize` (optional, default `50`)
- `sortBy` (optional: `cpu|elapsed|getPages|sqlCalls`, default `getPages`)

Response `data.items`:

```json
[
  {
    "id": 42,
    "name": "PACKAGE_042",
    "program": "ORDER_SVC",
    "totalCpu": 12345,
    "totalElapsed": 56789,
    "totalGetPages": 456700,
    "totalSqlCalls": 9865,
    "sqlCallsToCpuRatio": "0.80"
  }
]
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

### GET `/packages`
Query:
- `page` (optional)
- `pageSize` (optional)
- `search` (optional)

Behavior requirements:
- Must support very large package volumes (thousands+ rows).
- Must support typeahead search by package name and/or package ID.
- Recommended default sort: worst by CPU (descending) unless explicitly overridden.
- For typeahead in Package Analyzer, backend should return quickly for `pageSize=25`.

Response `data.items`:

```json
[
  {
    "id": 1,
    "name": "PACKAGE_001",
    "program": "ORDER_SVC"
  }
]
```

Recommended `meta` for paging UIs:

```json
{
  "page": 1,
  "pageSize": 25,
  "totalItems": 12450,
  "totalPages": 498
}
```

### GET `/packages/:packageId`
Response `data`:

```json
{
  "id": 1,
  "name": "PACKAGE_001",
  "program": "ORDER_SVC",
  "collection": "XDB2I"
}
```

### GET `/packages/:packageId/bindings`
Response `data` (array):

```json
[
  {
    "contoken": "CTABC123",
    "bindTime": "2026-12-03T10:15:30",
    "isolationLevel": "CS",
    "statementCount": 80
  }
]
```

### GET `/packages/:packageId/trend`
Query:
- `from` (required)
- `to` (required)

Response `data` (array): same shape as `metrics-trend`.

### GET `/packages/:packageId/statements`
Query:
- `page` (optional)
- `pageSize` (optional)
- `sortBy` (optional)
- `search` (optional)
- `from` (required)
- `to` (required)

Response `data.items`:

```json
[
  {
    "id": 501,
    "sqlText": "SELECT ...",
    "executionCount": 120,
    "totalCpu": 5000,
    "totalElapsed": 13000,
    "totalGetPages": 64000
  }
]
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
