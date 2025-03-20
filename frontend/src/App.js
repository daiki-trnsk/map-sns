import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Home from "./pages/Home";
import TopicDetail from "./pages/TopicDetail";

function App() {
  const location = useLocation();

  useEffect(() => {
    window.gtag('config', 'G-KV0MNX21RT', {
      page_path: location.pathname,
    });
  }, [location]);

  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topic/:id" element={<TopicDetail />} />
      </Routes>
  );
}

export default App;