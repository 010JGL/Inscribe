import {
  BrowserRouter as Router,
  Route,
  Routes
} from "react-router-dom";
import Home from "./pages/Home";
import CreateTopic from "./pages/CreateTopic"
import WriteMessage from "./pages/WriteMessage"
import UploadPDF from "./pages/UploadPDF"
import SearchTopic from "./pages/SearchTopic"
import Collection from "./pages/Collection"
import Contact from "./pages/Contact"
import SaveTweet from './pages/SaveTweet'
import LoginSignUp from './components/LoginSignUp';

export default function AppRouter() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-topic" element={<CreateTopic />} />
        <Route path="/write-message" element={<WriteMessage />} />
        <Route path="/upload-pdf" element={<UploadPDF />} />
        <Route path="/search" element={<SearchTopic />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/save-tweet" element={<SaveTweet />} />
        <Route path="/login" element={<LoginSignUp />} />
      </Routes>
  )
}