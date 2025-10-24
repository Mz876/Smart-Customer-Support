import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignInPage from './pages/signIn.tsx';
import SignUpPage from './pages/signUp.tsx';
export default function Routings() {
  return (
    <Router>
      <Routes>
         <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </Router>
  );
}

 