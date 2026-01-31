import { BrowserRouter, Routes, Route } from 'react-router';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path ="/" element ={<Home/>}/>
        <Route path ="/" element ={<Profile/>}/>
        <Route path ="/jobs/:id" element ={<Dashboard/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
