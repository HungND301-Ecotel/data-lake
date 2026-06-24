import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { tenantConfig } from './config/tenant'

// Inject tenant colors as CSS variables → dùng được trong Tailwind qua var(--primary)
document.documentElement.style.setProperty('--primary', tenantConfig.primaryColor)
document.documentElement.style.setProperty('--primary-dark', tenantConfig.primaryDark)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
