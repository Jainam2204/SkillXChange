import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layout";
import ProfileDetails from "./components/ProfileDetails";
import Subscription from "./components/Subscription";
import Meet from "./components/Meet";
import Chat from "./components/Chat";
import UserList from "./components/UserList";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";
import SuggestionsHome from "./components/SuggestionsHome";
import CourseSuggestions from "./components/CourseSuggestions";
import UpdateProfile from "./components/UpdateProfile";

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<SuggestionsHome />} /> {/* default */}
                <Route path="profile/:id" element={<ProfileDetails />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="view-profiles" element={<UserList />} />
                <Route path="profile-update/:id" element={<UpdateProfile />} />
                <Route path="/dashboard/course-suggestions" element={<CourseSuggestions />} />
              </Route>

              <Route path="/meet/:roomName" element={<Meet />} />
              <Route path="/chat/:userId" element={<Chat />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
}
