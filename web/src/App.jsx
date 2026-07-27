import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Converter from './pages/Converter.jsx'
import Video from './pages/Video.jsx'
import Music from './pages/Music.jsx'
import HistoryPage from './pages/History.jsx'
import Faq from './pages/Faq.jsx'
import NotFound from './pages/NotFound.jsx'
import { useI18n } from './i18n/index.jsx'

const TITLE_KEYS = {
  '/': null,
  '/conversor': 'converter.title',
  '/video': 'video.title',
  '/musica': 'music.title',
  '/historico': 'history.title',
  '/faq': 'faq.title',
}

export default function App() {
  const location = useLocation()
  const { t, language } = useI18n()

  useEffect(() => {
    const key = TITLE_KEYS[location.pathname]
    document.title = key ? `${t(key)} — MediaForge` : 'MediaForge'
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, t, language])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/conversor" element={<Converter />} />
        <Route path="/video" element={<Video />} />
        <Route path="/musica" element={<Music />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/converter" element={<Navigate to="/conversor" replace />} />
        <Route path="/music" element={<Navigate to="/musica" replace />} />
        <Route path="/history" element={<Navigate to="/historico" replace />} />
        <Route path="/sobre" element={<Navigate to="/faq" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
