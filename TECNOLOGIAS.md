# Tecnologías del Proyecto FixTrack

Este documento detalla las tecnologías utilizadas en el proyecto, separadas por Backend y Frontend, y sus respectivas funciones.

## Backend

El backend está construido sobre **Node.js**:

*   **Express** (`express`): Framework web minimalista y flexible para Node.js. Se utiliza para estructurar la API REST, manejar rutas y procesar las peticiones HTTP.
*   **Sequelize** (`sequelize`): ORM (Object-Relational Mapper) basado en promesas. Facilita la interacción con la base de datos utilizando modelos y objetos de JavaScript en lugar de escribir SQL puro.
*   **SQLite3** (`sqlite3`): Sistema de gestión de bases de datos relacional ligero. En este proyecto, actúa como el motor de persistencia de datos donde Sequelize almacena la información.
*   **Bcrypt** (`bcrypt`): Librería para el cifrado (hashing) de contraseñas. Se usa para proteger las credenciales de los usuarios almacenándolas de forma segura.
*   **JSON Web Token** (`jsonwebtoken`): Utilizado para la autenticación y autorización segura. Genera tokens firmados que permiten validar la identidad del usuario en cada petición.
*   **CORS** (`cors`): Middleware que permite el intercambio de recursos de origen cruzado. Es fundamental para permitir que el Frontend se comunique con el Backend aunque estén en dominios o puertos diferentes.
*   **Multer** (`multer`): Middleware para el manejo de `multipart/form-data`. Se utiliza principalmente para la subida y gestión de archivos en el servidor.
*   **ExcelJS** (`exceljs`): Librería para leer, manipular y escribir archivos de hojas de cálculo (XLSX). Útil para exportar reportes o manejar datos tabulares.
*   **PDFKit** (`pdfkit`): Herramienta para generar documentos PDF complejos desde el servidor, útil para la creación de reportes o facturas.
*   **Dotenv** (`dotenv`): Carga variables de entorno desde un archivo `.env`, permitiendo configurar secretos y opciones del entorno sin exponerlos en el código fuente.
*   **Jest** (`jest`) & **Supertest** (`supertest`): Herramientas para testing. Jest es el framework de pruebas, mientras que Supertest facilita las pruebas de integración sobre los endpoints HTTP.
*   **Nodemon** (`nodemon`): Herramienta de desarrollo que reinicia automáticamente el servidor cuando detecta cambios en el código fuente.

## Frontend

El frontend está desarrollado con **Vue.js**:

*   **Vue.js 3** (`vue`): Framework de JavaScript progresivo para construir interfaces de usuario. Es el núcleo de la aplicación del lado del cliente.
*   **Vite** (`vite`): Herramienta de construcción (build tool) y servidor de desarrollo. Proporciona un entorno de desarrollo extremadamente rápido y optimiza el código para producción.
*   **Pinia** (`pinia`): La librería oficial de gestión de estado para Vue. Almacena y gestiona datos compartidos entre componentes (como el usuario autenticado o configuraciones globales) de manera reactiva.
*   **Vue Router** (`vue-router`): El enrutador oficial para Vue.js. Permite la navegación entre las diferentes "páginas" o vistas de la aplicación sin recargar el navegador (SPA - Single Page Application).
*   **Vite Plugins** (`@vitejs/plugin-vue`, `vite-plugin-vue-devtools`): Extensiones para Vite que habilitan la compilación de componentes de Vue y proporcionan herramientas de depuración avanzadas en el navegador.
