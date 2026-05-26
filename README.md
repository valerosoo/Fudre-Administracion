# Fudre - Administración

Sistema de administración con backend en Spring Boot y frontend en Vite, integrado con la API de Tiendanube para gestión de stock y pedidos.

---

## Requisitos previos

Asegurate de tener instalado:

- [Java 17+](https://adoptium.net/) — verificar con `java -version`
- [Node.js y npm](https://nodejs.org/) — verificar con `node -v` y `npm -v`
- [MySQL](https://dev.mysql.com/downloads/) corriendo en tu máquina
- [Git](https://git-scm.com/)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/valerosoo/Fudre-Administracion.git
cd Fudre-Administracion
```

### 2. Configurar la base de datos

Crear una base de datos en MySQL:

```sql
CREATE DATABASE fudre;
```

Luego completar las credenciales en `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fudre
spring.datasource.username=TU_USUARIO
spring.datasource.password=TU_CONTRASEÑA
```

### 3. Configurar las credenciales de Tiendanube

En el mismo `application.properties`, completar los tokens de Tiendanube:

```properties
tiendanube.app.id=TU_APP_ID
tiendanube.client.secret=TU_CLIENT_SECRET
tiendanube.access.token=TU_ACCESS_TOKEN
tiendanube.store.id=TU_STORE_ID
```

> ⚠️ Estos valores los obtenés desde el panel de partners de Tiendanube, en la sección **Claves de Acceso** de tu app.

---

## Cómo correr el proyecto

### Backend (Spring Boot + Gradle)

```bash
cd backend

# Windows
gradlew.bat bootRun

# Linux / Mac
./gradlew bootRun
```

El backend levanta en: `http://localhost:8080`

Cuando veas este mensaje en consola, está listo:
```
Started FudreApplication in X seconds (JVM running for X)
```

### Frontend (Vite)

Abrí una terminal nueva y ejecutá:

```bash
cd frontend
npm install
npm run dev
```

El frontend levanta en: `http://localhost:5173`

---

## Estructura del proyecto

```
Fudre-Administracion/
├── backend/        # Spring Boot + Gradle
│   └── src/
│       └── main/
│           └── resources/
│               └── application.properties  ← configurar aquí
├── frontend/       # Vite
│   └── src/
└── README.md
```

---

## Notas importantes

- El archivo `application.properties` **no se sube al repositorio** por seguridad. Cada desarrollador debe configurarlo localmente con sus propias credenciales.
- La carpeta `node_modules` tampoco está en el repo, por eso es necesario correr `npm install` la primera vez.
- La integración con Tiendanube usa webhooks para detectar pedidos y actualizar el stock automáticamente.
