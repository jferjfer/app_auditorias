import os
import shutil
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from jose import JWTError, jwt
from typing import Optional, List
from backend import models, schemas, crud
from backend.database import get_db
from backend.services.auth_service import get_password_hash, verify_password

# --- Configuración de la Aplicación ---
app = FastAPI(title="API de Auditorías")

# Configuración de CORS COMPLETA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para agregar headers CORS a todas las responses
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    return response

# Manejar requests OPTIONS para todos los endpoints
@app.options("/{path:path}")
async def options_handler(path: str):
    return JSONResponse(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
            "Access-Control-Allow-Credentials": "true"
        }
    )

# --- Autenticación y Seguridad (JWT) ---
SECRET_KEY = os.getenv("SECRET_KEY", "tu-clave-secreta-debe-ser-fuerte-y-unica")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=correo)
    if user is None:
        raise credentials_exception
    return user

# --- Rutas de Autenticación ---
@app.post("/auth/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en el sistema.
    """
    db_user = crud.get_user_by_email(db, email=user.correo)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya está registrado."
        )

    hashed_password = get_password_hash(user.contrasena)
    new_user = crud.create_user(db=db, user=user, hashed_password=hashed_password)
    return new_user

@app.post("/auth/login", status_code=status.HTTP_200_OK)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Permite a un usuario iniciar sesión y obtener un token JWT.
    """
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.correo, "rol": user.rol}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Obtiene el usuario actual a partir del token JWT.
    """
    return current_user

# --- Ruta de Carga de Archivos para Auditores ---
@app.post("/audits/upload-file", status_code=status.HTTP_201_CREATED)
async def upload_audit_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Carga un archivo de Excel para que un auditor cree una nueva auditoría.
    """
    if current_user.rol != "auditor":
        raise HTTPException(status_code=403, detail="No tienes permiso para cargar archivos.")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos Excel (.xlsx, .xls)")

    try:
        # Guardar el archivo temporalmente
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Leer el archivo Excel
        df = pd.read_excel(temp_file_path, engine='openpyxl', header=None)
        
        # Buscar la fila que contiene los encabezados
        header_row = None
        target_patterns = [
            ["número", "documento"],
            ["sku", "articulo"], 
            ["nombre", "articulo"],
            ["cantidad"],
            ["un", "enviada"]
        ]
        
        for i in range(len(df)):
            row_values = [str(cell).lower().strip() if pd.notna(cell) else "" for cell in df.iloc[i]]
            
            # Verificar si esta fila contiene todos los patrones buscados
            matches = 0
            for pattern in target_patterns:
                if any(all(keyword in cell for keyword in pattern) for cell in row_values):
                    matches += 1
            
            if matches >= 3:  # Si al menos 3 de los 5 patrones coinciden
                header_row = i
                print(f"Encabezados encontrados en fila {i}: {row_values}")
                break
        
        if header_row is None:
            # Buscar alternativa: maybe los encabezados están en español exacto
            for i in range(len(df)):
                row_values = [str(cell) if pd.notna(cell) else "" for cell in df.iloc[i]]
                if "Número de documento" in row_values and "SKU ARTICULO" in row_values:
                    header_row = i
                    print(f"Encabezados exactos encontrados en fila {i}")
                    break
        
        if header_row is None:
            raise HTTPException(status_code=400, detail="No se encontraron los encabezados requeridos en el archivo")
        
        # Leer el archivo con la fila correcta como encabezado
        df = pd.read_excel(temp_file_path, engine='openpyxl', header=header_row)
        
        # Debug: mostrar columnas originales
        print("=" * 50)
        print("COLUMNAS ORIGINALES EN EL ARCHIVO:")
        for i, col in enumerate(df.columns):
            print(f"{i}: '{col}' (tipo: {type(col)})")
        print("=" * 50)
        
        # Mapeo exacto para tus columnas específicas
        exact_mapping = {
            'Número de documento': 'número de documento',
            'SKU ARTICULO': 'sku articulo',
            'NOMBRE ARTICULO': 'nombre articulo', 
            'Cantidad': 'cantidad',
            'Un Enviada': 'un enviada'
        }
        
        # Crear el mapeo
        column_mapping = {}
        for original_col in df.columns:
            original_col_str = str(original_col).strip()
            if original_col_str in exact_mapping:
                column_mapping[original_col] = exact_mapping[original_col_str]
                print(f"Mapeada '{original_col}' -> '{exact_mapping[original_col_str]}'")
            else:
                # Buscar coincidencia insensible a mayúsculas
                for key in exact_mapping.keys():
                    if original_col_str.lower() == key.lower():
                        column_mapping[original_col] = exact_mapping[key]
                        print(f"Mapeada (case-insensitive) '{original_col}' -> '{exact_mapping[key]}'")
                        break
        
        # Renombrar columnas
        df = df.rename(columns=column_mapping)
        print(f"Columnas después del mapeo: {list(df.columns)}")  

        
        # Verificar que tenemos las columnas necesarias
        required_columns = ["número de documento", "sku articulo", "nombre articulo", "cantidad", "un enviada"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            print(f"Columnas en el DataFrame: {list(df.columns)}")
            print(f"Columnas faltantes: {missing_columns}")
            
            # Intentar encontrar la columna de nombre manualmente
            for df_col in df.columns:
                df_col_lower = str(df_col).lower()
                if "nombre" in df_col_lower or "articulo" in df_col_lower or "artículo" in df_col_lower:
                    df = df.rename(columns={df_col: "nombre articulo"})
                    print(f"Renombrada manualmente '{df_col}' -> 'nombre articulo'")
                    break
            
            # Revisar nuevamente después del renombrado manual
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Faltan columnas requeridas: {', '.join(missing_columns)}. Columnas encontradas: {', '.join(list(df.columns))}"
                )
        
        # Extraer el número de documento
        numero_documento = None
        doc_column = [col for col in df.columns if "documento" in col.lower()][0]
        
        for i in range(len(df)):
            doc_value = df.iloc[i][doc_column]
            if pd.notna(doc_value) and str(doc_value).strip() and "total" not in str(doc_value).lower():
                numero_documento = str(doc_value).strip()
                print(f"Número de documento encontrado: '{numero_documento}'")
                break
        
        if not numero_documento:
            numero_documento = "Documento no especificado"
        
        ubicacion_destino = f"Auditoría {numero_documento} - {datetime.now().strftime('%Y-%m-%d')}"
        
        productos_data = []

        # Procesar cada fila de productos
        for i in range(len(df)):
            row = df.iloc[i]
            
            # Saltar filas vacías, de totales o sin SKU
            sku_value = row["sku articulo"]
            if (pd.isna(sku_value) or 
                str(sku_value).strip() == "" or
                "total" in str(sku_value).lower()):
                continue
            
            try:
                # Extraer los datos - eliminar .0 decimal del SKU
                sku = str(sku_value).strip()
                if '.' in sku and sku.endswith('.0'):
                    sku = sku[:-2]  # Eliminar .0 al final
                    
                nombre_articulo = str(row["nombre articulo"]).strip() if pd.notna(row["nombre articulo"]) else "Sin nombre"
                
                # Manejar valores numéricos
                cantidad_documento = 0
                if pd.notna(row["cantidad"]):
                    try:
                        cantidad_documento = int(float(row["cantidad"]))
                    except (ValueError, TypeError):
                        cantidad_documento = 0
                
                cantidad_enviada = 0
                if pd.notna(row["un enviada"]):
                    try:
                        cantidad_enviada = int(float(row["un enviada"]))
                    except (ValueError, TypeError):
                        cantidad_enviada = 0
                
                # Extraer solo la parte VE23673 de la orden de traslado
                orden_traslado = str(numero_documento).strip()
                
                # Buscar específicamente "VE" seguido de números
                if "VE" in orden_traslado:
                    import re
                    # Buscar VE seguido de cualquier cantidad de dígitos
                    match = re.search(r'VE\d+', orden_traslado)
                    if match:
                        orden_traslado = match.group(0)
                        print(f"Orden de traslado extraída: {orden_traslado}")
                    else:
                        # Si no encuentra el patrón VE, tomar los primeros 8 caracteres
                        orden_traslado = orden_traslado[:8]
                        print(f"Orden de traslado truncada: {orden_traslado}")
                else:
                    # Si no contiene "VE", tomar los primeros caracteres alfanuméricos
                    import re
                    match = re.search(r'[A-Za-z0-9]+', orden_traslado)
                    if match:
                        orden_traslado = match.group(0)
                        print(f"Orden de traslado extraída (alfanumérica): {orden_traslado}")
                    else:
                        orden_traslado = orden_traslado[:10]
                        print(f"Orden de traslado truncada: {orden_traslado}")
                
                producto_data = {
                    "sku": sku,
                    "nombre_articulo": nombre_articulo,
                    "cantidad_documento": cantidad_documento,
                    "cantidad_enviada": cantidad_enviada,
                    "cantidad_fisica": None,
                    "novedad": "sin_novedad",
                    "observaciones": None,
                    "orden_traslado_original": orden_traslado
                }
                
                productos_data.append(schemas.ProductBase(**producto_data))
                print(f"Producto procesado: {sku} - {nombre_articulo} - Orden: {orden_traslado}")
                
            except (ValueError, TypeError, KeyError) as e:
                print(f"Error procesando fila {i}: {e}")
                continue

        if not productos_data:
            raise HTTPException(status_code=400, detail="No se encontraron productos válidos en el archivo")

        audit_data = schemas.AuditCreate(
            ubicacion_destino=ubicacion_destino,
            productos=productos_data
        )
        
        # Crear la auditoría
        db_audit = crud.create_audit(db, audit_data, auditor_id=current_user.id)
        
        # Eliminar el archivo temporal
        os.remove(temp_file_path)

        return {
            "message": "Auditoría creada exitosamente",
            "audit_id": db_audit.id,
            "productos_procesados": len(productos_data),
            "numero_documento": numero_documento
        }
    
    except Exception as e:
        print(f"Error detallado al procesar el archivo: {str(e)}")
        import traceback
        traceback.print_exc()
        
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")

# --- Rutas de Auditorías ---
@app.get("/audits/", response_model=List[schemas.Audit])
def get_audits(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene las auditorías según el rol del usuario.
    """
    if current_user.rol == "auditor":
        audits = crud.get_audits_by_auditor(db, auditor_id=current_user.id)
    else:
        # Analista o Administrador
        audits = crud.get_all_audits(db)
    return audits

@app.get("/audits/auditor/{auditor_id}", response_model=List[schemas.Audit])
def get_audits_by_auditor(
    auditor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene todas las auditorías asignadas a un auditor específico.
    """
    # Verificar permisos (solo el propio auditor o un admin puede ver estas auditorías)
    if current_user.rol != "administrador" and current_user.id != auditor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver estas auditorías"
        )
    
    audits = crud.get_audits_by_auditor(db, auditor_id)
    return audits

@app.put("/audits/{audit_id}/iniciar", response_model=schemas.Audit)
def iniciar_auditoria(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Cambia el estado de una auditoría a "en_progreso".
    """
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    
    if not db_audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Auditoría no encontrada"
        )
    
    # Verificar permisos (solo el auditor asignado puede iniciar la auditoría)
    if current_user.id != db_audit.auditor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para iniciar esta auditoría"
        )
    
    # Verificar que la auditoría esté en estado pendiente
    if db_audit.estado != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede iniciar una auditoría en estado '{db_audit.estado}'"
        )
    
    # Actualizar el estado
    db_audit.estado = "en_progreso"
    db.commit()
    db.refresh(db_audit)
    
    return db_audit

@app.get("/audits/{audit_id}", response_model=schemas.AuditDetails)
def get_audit_details(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene los detalles de una auditoría, incluyendo sus productos.
    """
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    
    if current_user.rol == "auditor" and db_audit.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta auditoría")
    
    db_products = crud.get_products_by_audit(db, audit_id=audit_id)
    
    # Asignar los productos al esquema de auditoría
    db_audit.productos = db_products
    return db_audit

@app.put("/audits/{audit_id}/products/{product_id}", response_model=schemas.ProductBase)
def update_product_endpoint(
    audit_id: int,
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Actualiza la cantidad física, novedad y observaciones de un producto.
    """
    if current_user.rol != "auditor":
        raise HTTPException(status_code=403, detail="No tienes permiso para actualizar productos.")
    
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    
    if db_audit.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta auditoría")

    updated_product = crud.update_product(db, product_id, product.dict(exclude_unset=True))
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return updated_product

# Finalizar una auditoría
@app.put("/audits/{audit_id}/finish", response_model=schemas.Audit)
def finish_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    
    if current_user.rol == "auditor" and db_audit.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta auditoría")

    # Actualizar el estado de la auditoría y calcular el cumplimiento
    products = crud.get_products_by_audit(db, audit_id=audit_id)
    
    # Calcular cumplimiento
    total_productos = len(products)
    if total_productos == 0:
        cumplimiento = 100 
    else:
        correctos = sum(1 for p in products if p.cantidad_fisica == p.cantidad_enviada and p.novedad == 'sin_novedad')
        cumplimiento = (correctos / total_productos) * 100 if total_productos > 0 else 0
    
    updated_audit = crud.update_audit_status(db, audit_id=audit_id, new_status="finalizada", cumplimiento=cumplimiento)
    return updated_audit

@app.get("/audits/{audit_id}/products", response_model=List[schemas.ProductBase])
def get_audit_products(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene la lista de productos de una auditoría específica.
    """
    db_audit = crud.get_audit_by_id(db, audit_id=audit_id)
    if not db_audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")

    if current_user.rol == "auditor" and db_audit.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta auditoría")
        
    products = crud.get_products_by_audit(db, audit_id=audit_id)
    return products

# --- Rutas de Usuarios ---
@app.get("/users/", response_model=List[schemas.User])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene todos los usuarios (solo para administradores).
    """
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="No tienes permisos para ver usuarios")
    
    users = db.query(models.User).all()
    return users

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)