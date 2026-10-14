import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import AppRoutes from '@/routes'
import { UnsavedProvider } from '@/contexts/UnsavedContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function App() {
  return (

    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <UnsavedProvider>
            <AppRoutes />
          </UnsavedProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}