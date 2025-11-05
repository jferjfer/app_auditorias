# 📘 INSTRUCTIVO DE USUARIO - SISTEMA DE AUDITORÍAS NEMESIS V1

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Roles y Permisos](#roles-y-permisos)
4. [Módulo Auditor](#módulo-auditor)
5. [Módulo Analista](#módulo-analista)
6. [Módulo Administrador](#módulo-administrador)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🎯 INTRODUCCIÓN

El **Sistema de Auditorías NEMESIS V1** es una aplicación web diseñada para gestionar auditorías de inventario de manera eficiente y colaborativa. Permite cargar órdenes de traslado desde archivos Excel, auditar productos en tiempo real con escaneo de códigos, y generar reportes analíticos.

### Características Principales

✅ Carga de archivos Excel de órdenes de traslado  
✅ Escaneo de productos por SKU (teclado o cámara)  
✅ Auditorías colaborativas en tiempo real  
✅ Registro de novedades (faltantes, sobrantes, averías)  
✅ Historial completo de cambios  
✅ Cálculo automático de porcentaje de cumplimiento  
✅ Reportes en PDF y Excel  
✅ Interfaz responsive (móvil, tablet, desktop)  
✅ 7 temas de color + modo alto contraste  

---

## 🔐 ACCESO AL SISTEMA

### URL de Acceso

**Producción**: https://app-auditorias.onrender.com  
**Desarrollo Local**: http://127.0.0.1:8000

### Inicio de Sesión

1. Ingresa tu **correo electrónico**
2. Ingresa tu **contraseña**
3. Haz clic en **"Iniciar Sesión"**

> **Nota**: Si olvidaste tu contraseña, contacta al administrador del sistema.

### Registro de Nuevos Usuarios

1. Haz clic en **"Registrarse"**
2. Completa el formulario:
   - Nombre completo
   - Correo electrónico
   - Contraseña (mínimo 6 caracteres)
   - Selecciona tu rol (auditor/analista/administrador)
3. Haz clic en **"Registrarse"**

---

## 👥 ROLES Y PERMISOS

### 🔍 Auditor
- Cargar archivos Excel de órdenes de traslado
- Crear y gestionar auditorías
- Agregar colaboradores a auditorías
- Escanear productos y registrar cantidades físicas
- Registrar novedades y observaciones
- Ver historial de cambios
- Finalizar auditorías

### 📊 Analista
- Ver todas las auditorías del sistema
- Generar reportes en PDF y Excel
- Analizar porcentajes de cumplimiento
- Filtrar auditorías por estado, auditor, fecha
- Visualizar gráficos y estadísticas

### ⚙️ Administrador
- Todos los permisos de Auditor y Analista
- Gestionar usuarios (crear, editar, eliminar)
- Supervisar el sistema completo
- Acceso a todas las auditorías

---

## 🔍 MÓDULO AUDITOR

### 1. Cargar Archivos Excel

#### Paso 1: Preparar el Archivo
El archivo Excel debe contener las siguientes columnas:
- **SKU**: Código del producto
- **Nombre del Artículo**: Descripción del producto
- **Cantidad Documento**: Cantidad según orden de traslado
- **Cantidad Enviada**: Cantidad despachada
- **Ubicación Destino**: Bodega/ubicación destino

#### Paso 2: Subir el Archivo
1. En el **Dashboard del Auditor**, ve a la sección **"Cargar Archivos Excel"**
2. Haz clic en **"Seleccionar archivos"**
3. Selecciona uno o varios archivos `.xlsx` o `.xls`
4. Haz clic en **"Subir"**
5. Espera la confirmación: *"Auditoría #X creada exitosamente"*

> **Nota**: Puedes cargar múltiples archivos a la vez. Cada archivo crea una auditoría independiente.

---

### 2. Iniciar una Auditoría

1. En la tabla **"Mis Auditorías"**, localiza la auditoría con estado **"pendiente"**
2. Haz clic en el botón **"Iniciar"**
3. El estado cambiará a **"en_progreso"**
4. Ahora puedes hacer clic en **"Ver"** para comenzar a auditar

---

### 3. Agregar Colaboradores

Las auditorías pueden ser realizadas por múltiples personas simultáneamente.

#### Paso 1: Abrir Modal de Colaboradores
1. En la tabla **"Mis Auditorías"**, haz clic en el ícono de personas (👥)
2. Se abrirá el modal **"Agregar Colaboradores"**

#### Paso 2: Seleccionar Colaboradores
1. Marca las casillas de los usuarios que deseas agregar
2. Haz clic en **"Agregar Colaboradores"**
3. Los colaboradores ahora pueden ver y editar la auditoría

> **Importante**: Los colaboradores verán los cambios en tiempo real gracias a WebSockets.

---

### 4. Auditar Productos

#### Método 1: Escaneo con Teclado (Recomendado)

1. **Enfoca el campo de escaneo** (debe tener el cursor parpadeando)
2. **Escanea el código de barras** con el lector o escribe el SKU manualmente
3. **Presiona Enter**

**Flujo de Escaneo:**

**Caso A: Producto SIN Novedad**
1. Escanea el SKU → Presiona Enter
2. El sistema anuncia la cantidad del documento (voz)
3. Escanea el siguiente SKU → Presiona Enter
4. El producto anterior se guarda automáticamente como **"Sin Novedad"** con cantidad física = cantidad documento

**Caso B: Producto CON Novedad**
1. Escanea el SKU → Presiona Enter
2. El sistema anuncia la cantidad del documento (voz)
3. **Escanea el mismo SKU nuevamente** → Presiona Enter
4. El sistema anuncia **"Ingrese novedad"**
5. El cursor se posiciona en el campo **"Cantidad Física"**
6. Ingresa la cantidad física real → Presiona Enter
7. El sistema calcula automáticamente la novedad:
   - **Faltante**: Si cantidad física < cantidad documento
   - **Sobrante**: Si cantidad física > cantidad documento
   - **Sin Novedad**: Si son iguales

#### Método 2: Escaneo con Cámara (Móvil/Tablet)

1. Haz clic en el botón de **cámara** (📷)
2. Permite el acceso a la cámara
3. Apunta al código de barras o QR
4. El sistema escaneará automáticamente

#### Método 3: Edición Manual

1. Localiza el producto en la tabla usando el buscador
2. Haz clic en el campo **"Cantidad Física"**
3. Ingresa el valor
4. Presiona **Enter** o cambia de campo
5. Selecciona la **Novedad** del menú desplegable:
   - Sin Novedad
   - Faltante
   - Sobrante
   - Avería
   - Fecha Corta
   - Contaminado
   - Vencido
6. Agrega **Observaciones** si es necesario

---

### 5. Búsqueda y Filtros

#### Buscar Productos
- Escribe en el campo **"🔍 Buscar por SKU o nombre..."**
- La búsqueda es en tiempo real
- Busca por SKU o nombre del artículo

#### Filtrar por Novedad
- Usa el menú desplegable **"Todas las novedades"**
- Selecciona: Sin Novedad, Faltante, Sobrante, Avería
- La tabla se filtra automáticamente

---

### 6. Colaboración en Tiempo Real

Cuando varios auditores trabajan en la misma auditoría:

#### Bloqueo de Productos
- Cuando un auditor edita un producto, se **bloquea automáticamente**
- Otros colaboradores verán un candado 🔒 con el nombre del usuario
- Al terminar de editar, el producto se desbloquea

#### Notificaciones
- Recibirás notificaciones cuando:
  - Un colaborador edita un producto
  - Un colaborador bloquea un producto que estás viendo
- Las notificaciones aparecen en la esquina superior derecha

#### Sincronización
- Los cambios se sincronizan **instantáneamente**
- No necesitas recargar la página
- El porcentaje de cumplimiento se actualiza en tiempo real

---

### 7. Historial de Cambios

1. Haz clic en el botón **"Historial"** (🕐)
2. Se abrirá un modal con todos los cambios realizados
3. Verás:
   - Usuario que hizo el cambio
   - Producto modificado (SKU)
   - Campo modificado
   - Valor anterior → Valor nuevo
   - Fecha y hora del cambio

---

### 8. Finalizar Auditoría

1. Asegúrate de haber auditado todos los productos necesarios
2. Haz clic en el botón **"Finalizar"** (✓)
3. Confirma la acción en el modal
4. El sistema:
   - Calcula el **porcentaje de cumplimiento**
   - Cambia el estado a **"finalizada"**
   - Registra la fecha de finalización
   - Bloquea la edición de productos

> **Importante**: Una vez finalizada, la auditoría no se puede editar.

---

### 9. Porcentaje de Cumplimiento

El sistema calcula automáticamente el cumplimiento:

**Fórmula:**
```
Cumplimiento = (Cantidad Física Registrada / Cantidad Documento Total) × 100
```

**Ejemplo:**
- Cantidad Documento Total: 1000 unidades
- Cantidad Física Registrada: 950 unidades
- **Cumplimiento: 95%**

El badge de cumplimiento muestra:
- **Azul (info)**: Durante la auditoría (actualización en tiempo real)
- **Verde (primary)**: Auditoría finalizada (valor final)

---

## 📊 MÓDULO ANALISTA

### 1. Ver Auditorías

1. Accede al **Dashboard del Analista**
2. Verás una tabla con todas las auditorías del sistema
3. Columnas disponibles:
   - ID de auditoría
   - Auditor responsable
   - Ubicación destino
   - Estado (pendiente/en_progreso/finalizada)
   - Porcentaje de cumplimiento
   - Fecha de creación
   - Fecha de finalización

---

### 2. Filtrar Auditorías

#### Filtro por Estado
- Usa el menú desplegable **"Estado"**
- Opciones: Todas, Pendiente, En Progreso, Finalizada

#### Filtro por Auditor
- Usa el menú desplegable **"Auditor"**
- Selecciona un auditor específico o "Todos"

#### Filtro por Búsqueda
- Escribe en el campo de búsqueda
- Busca por ubicación destino o ID de auditoría

---

### 3. Ver Detalles de Auditoría

1. Haz clic en el botón **"Ver Detalles"** (👁️)
2. Se abrirá un modal con:
   - Información general de la auditoría
   - Lista completa de productos
   - Cantidades documento vs físicas
   - Novedades registradas
   - Observaciones

---

### 4. Generar Reportes

#### Reporte en PDF

1. Selecciona las auditorías que deseas incluir (checkboxes)
2. Haz clic en **"Descargar PDF"**
3. El sistema genera un PDF con:
   - Resumen de auditorías
   - Porcentajes de cumplimiento
   - Gráficos de novedades
   - Detalle de productos

#### Reporte en Excel

1. Selecciona las auditorías que deseas incluir
2. Haz clic en **"Descargar Excel"**
3. El sistema genera un archivo `.xlsx` con:
   - Hoja de resumen
   - Hoja de productos por auditoría
   - Hoja de novedades

> **Nota**: Si no seleccionas ninguna auditoría, se exportarán todas las visibles según los filtros aplicados.

---

### 5. Gráficos y Estadísticas

El dashboard del analista muestra:

#### Gráfico de Cumplimiento
- Porcentaje de cumplimiento por auditoría
- Gráfico de barras con colores según nivel:
  - Verde: ≥ 95%
  - Amarillo: 80-94%
  - Rojo: < 80%

#### Gráfico de Novedades
- Distribución de novedades (faltantes, sobrantes, averías)
- Gráfico de pastel/dona

#### Métricas Generales
- Total de auditorías
- Auditorías finalizadas
- Promedio de cumplimiento
- Total de productos auditados

---

## ⚙️ MÓDULO ADMINISTRADOR

### 1. Gestión de Usuarios

#### Ver Usuarios
1. Accede al **Dashboard del Administrador**
2. Ve a la sección **"Gestión de Usuarios"**
3. Verás una tabla con todos los usuarios registrados

#### Crear Usuario
1. Haz clic en **"Nuevo Usuario"**
2. Completa el formulario:
   - Nombre completo
   - Correo electrónico
   - Contraseña
   - Rol (auditor/analista/administrador)
3. Haz clic en **"Crear"**

#### Editar Usuario
1. Haz clic en el botón **"Editar"** (✏️) del usuario
2. Modifica los campos necesarios
3. Haz clic en **"Guardar"**

#### Eliminar Usuario
1. Haz clic en el botón **"Eliminar"** (🗑️) del usuario
2. Confirma la acción
3. El usuario será eliminado del sistema

> **Advertencia**: Eliminar un usuario no elimina las auditorías que creó.

---

### 2. Supervisión del Sistema

El administrador tiene acceso a:
- Todas las auditorías del sistema
- Todos los reportes
- Estadísticas globales
- Logs de actividad (próximamente)

---

## ❓ PREGUNTAS FRECUENTES

### ¿Qué navegadores son compatibles?
- Google Chrome (recomendado)
- Microsoft Edge
- Firefox
- Safari (iOS/macOS)

### ¿Funciona en móviles?
Sí, la aplicación es completamente responsive y funciona en:
- Smartphones (Android/iOS)
- Tablets
- Laptops
- Desktops

### ¿Puedo usar el sistema sin internet?
No, el sistema requiere conexión a internet para funcionar. Se recomienda una conexión estable para la sincronización en tiempo real.

### ¿Qué pasa si pierdo la conexión durante una auditoría?
- Los cambios guardados antes de perder conexión están seguros
- Al recuperar la conexión, el sistema se reconectará automáticamente
- Los cambios no guardados se perderán

### ¿Puedo editar una auditoría finalizada?
No, una vez finalizada, la auditoría queda bloqueada para edición. Esto garantiza la integridad de los datos.

### ¿Cuántos colaboradores puedo agregar a una auditoría?
No hay límite. Puedes agregar tantos colaboradores como necesites.

### ¿Cómo funciona el escaneo con cámara?
El sistema usa la cámara del dispositivo para leer códigos de barras y QR. Requiere permiso de acceso a la cámara.

### ¿Qué formato debe tener el archivo Excel?
El archivo debe ser `.xlsx` o `.xls` con las columnas:
- SKU
- Nombre del Artículo
- Cantidad Documento
- Cantidad Enviada
- Ubicación Destino

### ¿Puedo cambiar el tema de color?
Sí, haz clic en el botón de paleta (🎨) en la barra superior y selecciona uno de los 7 temas disponibles o el modo alto contraste.

### ¿Cómo cierro sesión?
Haz clic en el botón **"Cerrar Sesión"** en la esquina superior derecha.

### ¿Qué significa el badge de cumplimiento?
- **Badge azul (info)**: Cumplimiento actual durante la auditoría (se actualiza en tiempo real)
- **Badge verde (primary)**: Cumplimiento final de auditoría finalizada

### ¿Por qué no encuentro un producto al escanear?
Verifica que:
- El SKU esté en el archivo Excel cargado
- Estés en la auditoría correcta
- El código escaneado coincida con el SKU del sistema
- El sistema busca SKU sin importar mayúsculas/minúsculas y ceros iniciales

### ¿Puedo deshacer un cambio?
No directamente, pero puedes:
- Ver el historial de cambios
- Editar manualmente el producto para corregir
- Si la auditoría no está finalizada, puedes modificar cualquier campo

---

## 📞 SOPORTE TÉCNICO

Para asistencia técnica o reportar problemas:

**Email**: soporte@nemesis.com  
**Teléfono**: +1 (555) 123-4567  
**Horario**: Lunes a Viernes, 8:00 AM - 6:00 PM

---

## 📝 NOTAS IMPORTANTES

1. **Guarda tu trabajo frecuentemente**: Aunque el sistema guarda automáticamente, es buena práctica verificar que los cambios se hayan guardado.

2. **Conexión estable**: Para auditorías colaborativas, mantén una conexión a internet estable.

3. **Permisos de cámara**: Si usas escaneo con cámara, asegúrate de permitir el acceso cuando el navegador lo solicite.

4. **Seguridad**: No compartas tu contraseña. Cierra sesión al terminar, especialmente en dispositivos compartidos.

5. **Actualizaciones**: El sistema se actualiza automáticamente. No necesitas reinstalar nada.

---

**Versión del Instructivo**: 1.0  
**Fecha**: Diciembre 2024  
**Sistema**: NEMESIS V1 - Sistema de Auditorías  

---

© 2024 NEMESIS. Todos los derechos reservados.
