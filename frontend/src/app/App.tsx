import Navbar from '@/widgets/navbar/Navbar'
import './App.css'
import { PageRoutes } from './providers/router/routeConfig'
import { Routes } from 'react-router-dom'
import { renderRoutes } from './providers/router/renderRoutes'

function App() {
  return (
    <div>
      <Navbar links={PageRoutes.filter(
        (route) => route.showInNavbar
      )}></Navbar>
      <Routes>{renderRoutes(PageRoutes)}</Routes>
    </div>
  )
}

export default App
