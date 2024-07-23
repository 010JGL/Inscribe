import {
  BrowserRouter as Router,
  Route,
  Routes
} from "react-router-dom";
import Home from "./pages/Home";
import CreateTopic from "./pages/CreateTopic"
import WriteMessage from "./pages/WriteMessage"

export default function AppRouter() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-topic" element={<CreateTopic />} />
        <Route path="/write-message" element={<WriteMessage />} />
      </Routes>
  )
}