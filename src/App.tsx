import React from 'react'
import './App.css'
import UploadClient from './ui/UploadClient'
import LanguageToggle from './ui/LanguageToggle'
import ThemeToggle from './ui/ThemeToggle'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OpusNav from './components/OpusNav'
import TubesPage from './pages/Tubes'
import Home from './pages/Home'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <BrowserRouter>
      <>
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, rgba(99,102,241,0.6), rgba(59,130,246,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="app-shell" style={{ width: '100%', maxWidth: 1200, borderRadius: 24, background: 'var(--app-bg)', color: 'var(--app-fg)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid var(--app-border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: 'none', gap: 8 }}>
              <OpusNav />
              <div style={{ display: 'flex', gap: 8 }}>
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/analyzer" element={<UploadClient />} />
                <Route path="/tubes" element={<TubesPage />} />
              </Routes>
            </div>
            <Footer />
          </div>
          <ToastContainer position="top-center" autoClose={3000} hideProgressBar closeOnClick pauseOnHover theme={document?.body?.dataset?.theme === 'dark' ? 'dark' : 'light'} toastStyle={{ background: 'var(--app-bg)', color: 'var(--app-fg)', border: '1px solid var(--app-border)' }} />
        </div>
      </>
    </BrowserRouter>
  )
}

export default App
