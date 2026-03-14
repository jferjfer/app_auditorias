import React, { useState, useEffect } from 'react';

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('dark-default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('selected_theme') || 'dark-default';
    setCurrentTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const changeTheme = (theme) => {
    setCurrentTheme(theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('selected_theme', theme);
  };

  return (
    <div className="dropdown">
      <button 
        className="btn btn-outline-secondary dropdown-toggle" 
        type="button" 
        id="themeDropdown" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
      >
        <i className="bi bi-palette-fill me-2"></i> Tema
      </button>
      <ul className="dropdown-menu" aria-labelledby="themeDropdown">
        <li><h6 className="dropdown-header">Temas Oscuros</h6></li>
        <li><button className="dropdown-item" onClick={() => changeTheme('dark-default')}>🌙 Morado Nocturno</button></li>
        <li><button className="dropdown-item" onClick={() => changeTheme('dark-blue')}>💙 Azul Medianoche</button></li>
        <li><button className="dropdown-item" onClick={() => changeTheme('dark-green')}>💚 Verde Esmeralda</button></li>
        <li><hr className="dropdown-divider" /></li>
        <li><h6 className="dropdown-header">Temas Claros</h6></li>
        <li><button className="dropdown-item" onClick={() => changeTheme('light-default')}>☀️ Blanco Puro</button></li>
        <li><button className="dropdown-item" onClick={() => changeTheme('light-warm')}>🔥 Beige Cálido</button></li>
        <li><button className="dropdown-item" onClick={() => changeTheme('light-cool')}>❄️ Gris Azulado</button></li>
        <li><hr className="dropdown-divider" /></li>
        <li><h6 className="dropdown-header">Accesibilidad</h6></li>
        <li><button className="dropdown-item" onClick={() => changeTheme('high-contrast')}>♿ Alto Contraste</button></li>
      </ul>
    </div>
  );
}
