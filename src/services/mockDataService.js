// Mock data generator for DB2 Performance Visualization

export const generateMockDashboardData = () => {
  const now = new Date()
  const hours = Array.from({ length: 24 }, (_, i) => {
    const date = new Date(now - (23 - i) * 3600000)
    return {
      time: date.getHours() + ':00',
      timestamp: date.toISOString(),
      cpu: Math.floor(Math.random() * 1000 + 500),
      elapsed: Math.floor(Math.random() * 2000 + 1000),
      getPages: Math.floor(Math.random() * 50000 + 20000),
      sqlCalls: Math.floor(Math.random() * 10000 + 5000),
    }
  })

  return hours
}

export const generateMockStatements = (count = 20) => {
  const collections = ['XDB2I', 'PROD', 'TEST']
  const programs = ['PROGRAM_A', 'PROGRAM_B', 'PROGRAM_C', 'PROGRAM_D', 'PROGRAM_E']
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    sqlText: `SELECT * FROM TABLE_${i + 1} WHERE COL_${i} = ? AND COL_${i + 1} > ?`,
    program: programs[Math.floor(Math.random() * programs.length)],
    collection: collections[Math.floor(Math.random() * collections.length)],
    contoken: `CT${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    textToken: `TT${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    executionCount: Math.floor(Math.random() * 50000 + 100),
    totalCpu: Math.floor(Math.random() * 100000 + 1000),
    totalElapsed: Math.floor(Math.random() * 200000 + 2000),
    totalGetPages: Math.floor(Math.random() * 500000 + 10000),
    avgCpu: Math.floor(Math.random() * 100 + 10),
    avgElapsed: Math.floor(Math.random() * 200 + 20),
    avgGetPages: Math.floor(Math.random() * 50000 + 1000),
    ioTotal: Math.floor(Math.random() * 10000 + 100),
    trend: Math.random() > 0.5 ? 1 : -1,
  }))
}

export const generateMockPackageData = (packageId) => {
  return {
    id: packageId,
    name: `PACKAGE_${packageId}`,
    program: 'PROGRAM_A',
    collection: 'XDB2I',
    binds: [
      {
        contoken: `CT${Math.random().toString(36).substring(7, 15).toUpperCase()}`,
        bindTime: new Date(Date.now() - 3600000).toISOString(),
        isolationLevel: 'CS',
        statementCount: Math.floor(Math.random() * 100 + 10),
      },
      {
        contoken: `CT${Math.random().toString(36).substring(7, 15).toUpperCase()}`,
        bindTime: new Date(Date.now() - 7200000).toISOString(),
        isolationLevel: 'RR',
        statementCount: Math.floor(Math.random() * 100 + 10),
      },
      {
        contoken: `CT${Math.random().toString(36).substring(7, 15).toUpperCase()}`,
        bindTime: new Date(Date.now() - 10800000).toISOString(),
        isolationLevel: 'CS',
        statementCount: Math.floor(Math.random() * 100 + 10),
      },
    ],
    statements: generateMockStatements(15),
    trends: generateMockDashboardData(),
  }
}

export const generateMockExplainData = () => {
  return {
    current: {
      statementId: 1,
      accessMethod: 'INDEX RANGE SCAN',
      indexName: 'IDX_MAIN_001',
      tableScanned: 'TABLE_USERS',
      estimatedRows: 15000,
      estimatedCost: 1250,
      filterFactor: 0.0567,
      sortDetails: 'NO SORT',
      plansteps: [
        { step: 1, method: 'INDEX RANGE SCAN', object: 'IDX_MAIN_001', cost: 1250 },
        { step: 2, method: 'FETCH', object: 'TABLE_USERS', cost: 500 },
        { step: 3, method: 'OUTPUT', object: null, cost: 0 },
      ],
    },
    previous: {
      statementId: 1,
      accessMethod: 'TABLE SCAN (FULL)',
      indexName: null,
      tableScanned: 'TABLE_USERS',
      estimatedRows: 15000,
      estimatedCost: 5820,
      filterFactor: 0.0567,
      sortDetails: 'SORT BY COL_ID',
      plansteps: [
        { step: 1, method: 'TABLE SCAN', object: 'TABLE_USERS', cost: 5000 },
        { step: 2, method: 'SORT', object: 'TEMP_TABLE_1', cost: 820 },
        { step: 3, method: 'OUTPUT', object: null, cost: 0 },
      ],
    },
  }
}

export const generateMockTableStatistics = () => {
  return [
    {
      tableName: 'TABLE_USERS',
      tableId: 'TAB001',
      cardinalityEstimate: 500000,
      lastStatsTime: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
      isStale: false,
      columns: [
        { name: 'USER_ID', type: 'INTEGER', nullable: false },
        { name: 'USER_NAME', type: 'VARCHAR(100)', nullable: false },
        { name: 'EMAIL', type: 'VARCHAR(100)', nullable: true },
      ],
    },
    {
      tableName: 'TABLE_ORDERS',
      tableId: 'TAB002',
      cardinalityEstimate: 2000000,
      lastStatsTime: new Date(Date.now() - 40 * 24 * 3600000).toISOString(),
      isStale: true,
      columns: [
        { name: 'ORDER_ID', type: 'INTEGER', nullable: false },
        { name: 'USER_ID', type: 'INTEGER', nullable: false },
        { name: 'ORDER_DATE', type: 'DATE', nullable: false },
      ],
    },
  ]
}

export const generateKPIs = () => {
  return {
    totalCpu: 125420,
    totalElapsed: 245680,
    totalGetPages: 5234000,
    totalSqlCalls: 125000,
    topCpuStatement: {
      id: 1,
      text: 'SELECT * FROM LARGE_TABLE WHERE ID > ?',
      cpu: 45230,
    },
    topElapsedStatement: {
      id: 2,
      text: 'SELECT * FROM TABLE_A JOIN TABLE_B ON ...',
      elapsed: 89230,
    },
    topGetPagesStatement: {
      id: 3,
      text: 'SELECT col1, col2 FROM BIG_TABLE WHERE status = ?',
      getPages: 1245000,
    },
  }
}
