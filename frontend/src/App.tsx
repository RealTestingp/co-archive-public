import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import CharacterPage from './pages/CharacterPage';
import PersonPage from './pages/PersonPage';
import ProductionPage from './pages/ProductionPage';
import DashboardPage from './pages/DashboardPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SearchPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/reports" element={<div>Reports coming soon</div>} />
                <Route path="/person/:id" element={<PersonPage />} />
                <Route path="/production/:id" element={<ProductionPage />} />
                <Route path="/character/:id" element={<CharacterPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;