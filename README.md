# DB2 Performance Visualizer

A professional React frontend for visualizing and analyzing DB2 performance metrics on z/OS. This tool helps DBA's identify bottlenecks, analyze trends, and optimize database performance.

## 🎯 Features

- **Dashboard**: Real-time KPI metrics and performance trends
- **Package Analyzer**: Drill down into packages and their statements
- **Statement Analyzer**: Detailed analysis of individual SQL statements with table statistics
- **Access Path Viewer**: Compare current vs. previous explain plans
- **Settings**: Configurable subsystem, collection, time ranges, and data thresholds

## 📋 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Navbar.jsx       # Top navigation bar
│   ├── Sidebar.jsx      # Left sidebar navigation
│   ├── TimeRangePicker.jsx
│   ├── MetricsCard.jsx
│   ├── FilterBar.jsx
│   └── Paginator.jsx
├── pages/               # Page components
│   ├── Dashboard.jsx
│   ├── PackageAnalyzer.jsx
│   ├── StatementAnalyzer.jsx
│   ├── AccessPathViewer.jsx
│   └── Settings.jsx
├── services/            # Business logic & API layers
│   ├── api.js          # Axios API client (ready for backend endpoints)
│   └── mockDataService.js  # Mock data generators
├── context/            # React Context for state management
│   └── AppContext.jsx
├── App.jsx            # Main app component with routing
├── index.js           # React DOM render
└── index.css          # Tailwind CSS styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm 8+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🛠 Tech Stack

- **React** 18.2 - UI framework
- **React Router** 6.8 - Client-side routing
- **Recharts** 2.5 - Professional charting library
- **Tailwind CSS** 3.2 - Utility-first CSS styling
- **Axios** 1.1 - HTTP client (ready for backend integration)
- **Create React App** - Project scaffolding

## 📊 Mock Data

Currently, the app uses mock data generators in `src/services/mockDataService.js`. This includes:
- Dashboard KPI metrics
- Performance trends (hourly data for 24h)
- Package and statement data
- Explain plans (current vs. previous)
- Table statistics with freshness indicators

## 🔗 Backend Integration

The `src/services/api.js` file contains all API endpoints configured and ready to connect to the Spring Boot backend once available. Endpoints include:

### Dashboard
- `GET /dashboard/kpis`
- `GET /dashboard/metrics-trend`
- `GET /dashboard/worst-statements`
- `GET /dashboard/search-statements`

### Package Management
- `GET /packages/{packageId}`
- `GET /packages`
- `GET /packages/{packageId}/trend`
- `GET /packages/{packageId}/bindings`
- `GET /packages/{packageId}/statements`
- `POST /packages/{packageId}/rebind`

### Statement Analysis
- `GET /statements/{statementId}`
- `GET /statements/{statementId}/metrics`
- `GET /statements/{statementId}/trend`
- `GET /statements/{statementId}/tables`
- `GET /tables/{tableName}/statistics`

### Explain Plans
- `GET /explain/current`
- `GET /explain/previous`
- `POST /explain/dynamic`
- `GET /explain/compare`

### Configuration
- `GET /config/settings`
- `PUT /config/settings`
- `GET /config/collections`
- `GET /config/subsystems`

## 📝 Key Configuration

### Settings (src/pages/Settings.jsx)
- Subsystem (default: DB2)
- Collection (default: XDB2I)
- Default time range (24h, 7d, 30d, custom)
- Items per page (default: 50)
- Statistics staleness threshold (default: 30 days)

### Environment Variables
Create a `.env` file based on `.env.example`:
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_ENVIRONMENT=development
```

## 🎨 UI/UX Highlights

- **Professional Design**: Dark sidebar navigation, clean white content areas
- **Responsive Charts**: Trend analysis with Recharts
- **Pagination**: 50 rows per page with dynamic pagination controls
- **Search & Filter**: Autocomplete package/statement search, sorting by metrics
- **Time Range Picker**: Predefined ranges + custom date picker
- **Statistics Warnings**: Orange highlights for stale statistics (>30 days)
- **Drill-Down Navigation**: Flow from Dashboard → Package → Statement → Access Path

## 🔄 User Flow

1. **Dashboard** - See KPI spikes (GETPAGES, CPU, Elapsed)
2. **Package Analyzer** - Filter by program, check binding history
3. **Statement Analyzer** - Analyze SQL with execution metrics & table stats
4. **Access Path Viewer** - Compare current vs. previous explain plans
5. **Settings** - Configure preferences

## 📱 Desktop-Only

This application is designed for desktop browsers. No mobile optimization is planned for the MVP.

## 📦 Build & Deployment

```bash
npm run build
```

Creates an optimized production build in the `build/` folder.

## 🐛 Known Limitations (MVP)

- No backend connection yet (using mock data)
- No authentication/security (to be added)
- No real-time data (only hourly metrics)
- No export/PDF reports
- No prediction/ML recommendations
- Single subsystem/collection support in current build

## 🔜 Future Enhancements

- Real-time data from DB2 Insight views
- Automated performance anomaly detection
- Cost attribution per application
- SLA monitoring & compliance tracking
- Workload balancing recommendations
- Multi-subsystem support

## 📝 Notes for Development

- Keep components small and reusable
- Use TailwindCSS utility classes for styling
- Mock data updates should be in `mockDataService.js`
- API client is ready in `api.js` - just add backend endpoints
- Context state management in `AppContext.jsx`

## 📄 License

This project is part of a z/OS DB2 performance optimization internship project.
