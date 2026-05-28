import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { Resumen } from './pages/Resumen';
import { CargaVivienda } from './pages/CargaVivienda';
import { Acometida } from './pages/Acometida';
import { Regulacion } from './pages/Regulacion';
import { CuadroCargas } from './pages/CuadroCargas';
import { ReportePDF } from './pages/ReportePDF';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<CargaVivienda />} />
          <Route path="acometida" element={<Acometida />} />
          <Route path="regulacion" element={<Regulacion />} />
          <Route path="resumen" element={<Resumen />} />
          <Route path="cuadro" element={<CuadroCargas />} />
          <Route path="pdf" element={<ReportePDF />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
