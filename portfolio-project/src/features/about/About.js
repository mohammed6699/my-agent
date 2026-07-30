import React from 'react';
import './About.css';
import data from '../models/data';

const About = () => {
  return (
    <div className='about-container'>
      <h1>About me</h1>
      <p>I am a highly motivated and detail-oriented individual with a passion for coding.</p>
      <h2>My Experience:</h2>
      <ul>
        <li>5+ years of experience in web development</li>
        <li>Strong proficiency in JavaScript, HTML, CSS</li>
        <li>Experience with React, Node.js, and MongoDB</li>
      </ul>
      <h2>My Education:</h2>
      <ul>
        <li>Bachelor's degree in Computer Science</li>
      </ul>
    </div>
  );
};

export default About;
