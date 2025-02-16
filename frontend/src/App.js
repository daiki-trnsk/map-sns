import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TopicDetail from "./pages/TopicDetail";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topic/:id" element={<TopicDetail />} />
      </Routes>
    </Router>
  );
}

export default App;