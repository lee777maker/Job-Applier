import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Jobs from "./pages/Jobs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/dashboard" element={<div style={{padding:40}}>Dashboard (next)</div>} />
      </Routes>
    </BrowserRouter>
  );
}
