import { BrowserRouter, Routes, Route } from "react-router-dom";
import Setup from "./pages/Setup";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Setup />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;