import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Domains } from './pages/Domains';
import { MCPs } from './pages/MCPs';
import { Agents } from './pages/Agents';
import { Workflows } from './pages/Workflows';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="domains" element={<Domains />} />
          <Route path="mcps" element={<MCPs />} />
          <Route path="agents" element={<Agents />} />
          <Route path="workflows" element={<Workflows />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
