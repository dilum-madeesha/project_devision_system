import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'; 
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from './contexts/AuthContext.jsx'
import theme from './theme.js'

createRoot(document.getElementById('root')).render(
  <StrictMode> 
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  </StrictMode>
)
