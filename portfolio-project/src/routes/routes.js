import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../home/Home';
import About from '../about/About';
import Contact from '../contact/Contact';

const routes = (
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/about' element={<About>} />
      <Route path='/contact' element={<Contact />} />
    </Routes>
  </BrowserRouter>
);

export default routes;
