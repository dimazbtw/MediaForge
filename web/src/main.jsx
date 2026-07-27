import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { JobsProvider } from './hooks/useJobs.jsx'
import { CapabilitiesProvider } from './hooks/useCapabilities.jsx'
import { I18nProvider } from './i18n/index.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ThemeProvider>
          <CapabilitiesProvider>
            <JobsProvider>
              <App />
            </JobsProvider>
          </CapabilitiesProvider>
        </ThemeProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)
