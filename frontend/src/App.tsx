import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CommandCenter } from './pages/CommandCenter/CommandCenter';
import { Dashboard } from './pages/Dashboard';
import { Domains } from './pages/Domains';
import { DomainDetail } from './pages/DomainDetail';
import { MCPs } from './pages/MCPs';
import { Agents } from './pages/Agents';
import { Workflows } from './pages/Workflows';
import { CrossDomain } from './pages/CrossDomain';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/domains" element={<Domains />} />
            <Route path="/domains/:id" element={<DomainDetail />} />
            <Route path="/mcps" element={<MCPs />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/cross-domain" element={<CrossDomain />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
