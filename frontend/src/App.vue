<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

:root {
  /* Colores Principales */
  --primary-blue: #1976D2;
  --light-blue: #BBDEFB;
  --dark-gray: #333333;
  --medium-gray: #757575;
  --light-gray: #F5F5F5;
  
  /* Colores de Estado */
  --pending: #FFC107;
  --in-review: #2196F3;
  --repaired: #4CAF50;
  --waiting-parts: #FF9800;
  --closed: #9E9E9E;
  
  /* Espaciado */
  --spacing-base: 8px;
  --spacing-small: 8px;
  --spacing-medium: 16px;
  --spacing-large: 24px;
  --spacing-xlarge: 32px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
}

body {
  font-family: 'Roboto', sans-serif;
  color: var(--dark-gray);
  line-height: 1.6;
  background-color: #FFFFFF;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  margin-bottom: var(--spacing-medium);
}

button {
  cursor: pointer;
}

/* Estilos adicionales para mejorar la accesibilidad y consistencia */
input:focus, button:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--light-blue);
}

@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
}
</style>
