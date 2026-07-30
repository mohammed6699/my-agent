import React from 'react';
import './Home.css';
import data from '../models/data';

const Home = () => {
  return (
    <div className='home-container'>
      <h1>Welcome to my portfolio!</h1>
      <h2> About me:</h2>
      <p>I am a highly motivated and detail-oriented individual with a passion for coding.</p>
      <h2>My Skills:</h2>
      <ul>
        {data.skills.map(skill => (
          <li key={skill.id}>{skill.name}</li>
        ))}
      </ul>
      <h2>My Projects:</h2>
      <ul>
        {data.projects.map(project => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
