import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { AuthProvider } from "./context/AuthContext";
import TopicDetail from "./pages/TopicDetail";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import User from "./pages/User";

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/topic/:id" element={<TopicDetail />} />
                    <Route path="/user" element={<User />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
