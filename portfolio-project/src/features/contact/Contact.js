import React from 'react';
import './Contact.css';
import data from '../models/data';

const Contact = () => {
  return (
    <div className='contact-container'>
      <h1>Get in touch!</h1>
      <p>If you'd like to get in touch with me, please fill out the form below.</p>
      <form>
        <label>Name:</label>
        <input type='text' />
        <label>Email:</label>
        <input type='email' />
        <label>Message:</label>
        <textarea />
        <button>Send</button>
      </form>
    </div>
  );
};

export default Contact;
