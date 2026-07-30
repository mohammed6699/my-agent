import React from 'react';

const dataService = {
  fetchData: async () => {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  }
};

export default dataService;
