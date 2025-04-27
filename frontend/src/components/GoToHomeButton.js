// src/components/GoToHomeButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const GoToHomeButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/'); // Redirige a la página de inicio
  };

  return (
    <button
      onClick={handleClick}
      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
    >
      Volver a Inicio
    </button>
  );
};

export default GoToHomeButton;