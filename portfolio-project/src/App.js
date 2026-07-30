import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './features/home/Home';
import About from './features/about/About';
import Contact from './features/contact/Contact';
import Header from './components/shared/Header';
import Footer from './components/shared/Footer';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
