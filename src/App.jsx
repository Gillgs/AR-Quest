import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/home";
import ChoosePage from "./pages/ChoosePage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RegisterPage from "./pages/RegisterPage";
import ClassroomPage from "./pages/ClassroomPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerificationPage from "./pages/VerificationPage";
import StatisticsPage from "./pages/StatisticsPage";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import ModulePage from "./pages/ModulePage";
import SubjectModulePage from "./pages/SubjectModulePage";
import LessonsPage from "./pages/LessonsPage";
import AutoLogout from "./components/AutoLogout";
import AutoLogoutToast from "./components/AutoLogoutToast";
import "./App.css";

function App() {
  return (
    <Router>
  <AutoLogout />
  <AutoLogoutToast />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
           <Route path="/home" element={<Home />} />
           <Route path="/choose" element={<ChoosePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify" element={<VerificationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/classroom" element={<ClassroomPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile" element={<ProfilePage />} />
  {/* <Route path="/progress" element={<ProgressPage />} /> */}
  <Route path="/modules" element={<ModulePage />} />
  <Route path="/module/:subjectName" element={<SubjectModulePage />} />
  <Route path="/lessons/:subjectName" element={<LessonsPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
