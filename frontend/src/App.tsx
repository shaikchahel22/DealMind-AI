import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Vendors from "./pages/Vendors";
import VendorProfile from "./pages/VendorProfile";
import NegotiationPage from "./pages/Negotiation";
import Memory from "./pages/Memory";
import Insights from "./pages/Insights";
import DemoMode from "./pages/DemoMode";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/vendors/:id" element={<VendorProfile />} />
        <Route path="/negotiate" element={<NegotiationPage />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/demo" element={<DemoMode />} />
      </Route>
    </Routes>
  );
}
