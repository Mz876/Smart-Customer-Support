import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignInPage from './pages/signIn.tsx';
import SignUpPage from './pages/signUp.tsx';
import ProfilePage from './pages/profile.tsx'; 
import ConversationPanel from './pages/conversationPanel.tsx';

export default function Routings() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path='/panel' element={<ConversationPanel />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </Router>
  );
}

 