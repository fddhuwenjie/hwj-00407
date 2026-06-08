import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import CourseDetail from '@/pages/CourseDetail';
import LearnPage from '@/pages/LearnPage';
import Profile from '@/pages/Profile';
import CertificatePage from '@/pages/CertificatePage';
import VerifyCertificate from '@/pages/VerifyCertificate';
import DiscussionPage from '@/pages/DiscussionPage';
import DashboardPage from '@/pages/DashboardPage';
import { useAuthStore } from '@/store/useAuthStore';

export default function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/learn/:lessonId" element={<LearnPage />} />
          <Route path="/courses/:courseId/discussions" element={<DiscussionPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/certificates/:certificateNumber" element={<CertificatePage />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-courses" element={<Profile />} />
          <Route path="*" element={<div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">页面不存在</h2>
            <p className="text-gray-500">请检查您访问的地址是否正确</p>
          </div>} />
        </Routes>
      </Layout>
    </Router>
  );
}
