import os
import shutil
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from jose import JWTError, jwt
from typing import Optional, List
from backend import models, schemas, crud
from backend.database import get_db
from backend.services.auth_service import get_password_hash, verify_password
from backend.routers.auth import router as auth_router



# --- Configuración de la Aplicación ---
app = FastAPI(title="API de Auditorías")
app.include_router(auth_router)
# Configuración de CORS
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8001"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
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

@app.post("/login", status_code=status.HTTP_200_OK)
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

        # Leer el archivo Excel, especificando el motor 'openpyxl'
        df = pd.read_excel(temp_file_path, engine='openpyxl')

        # Lógica para el auditor (crea una auditoría con productos)
        ubicacion_destino = str(df.iloc[0].get('Ubicación', ''))
        productos_data = []

        # Mapeo para limpiar los valores de la columna 'Novedad'
        novedad_map = {
            '01 faltante': 'faltante',
            '02 sobrante': 'sobrante',
            '03 averia': 'averia',
            'sin novedad': 'sin_novedad'
        }
        #obtene 
        for _, row in df.iterrows():
            novedad_excel = str(row.get("Novedad", "")).lower()
            novedad_clean = novedad_map.get(novedad_excel, 'sin_novedad')
            
            # Asigna 0 si los valores son nulos antes de convertirlos a int
            cantidad_documento = int(row.get("Cantidad_Documento", 0))
            cantidad_enviada = int(row.get("Cantidad_Enviada", 0))

            producto_data = {
                "sku": str(row.get("SKU")),
                "nombre_articulo": str(row.get("Nombre_Articulo")),
                "cantidad_documento": cantidad_documento,
                "cantidad_enviada": cantidad_enviada,
                "cantidad_fisica": int(row.get("Cantidad_Fisica")) if pd.notna(row.get("Cantidad_Fisica")) else None,
                "novedad": novedad_clean,
                "observaciones": str(row.get("Observaciones", None)) if pd.notna(row.get("Observaciones")) else None,
                "orden_traslado_original": str(row.get("Orden_Traslado_Original"))
            }
            productos_data.append(schemas.ProductBase(**producto_data))

        audit_data = schemas.AuditCreate(
            ubicacion_destino=ubicacion_destino,
            productos=productos_data
        )
        
        # Crear la auditoría y sus productos en la base de datos
        db_audit = crud.create_audit(db, audit_data, auditor_id=current_user.id)
        
        # Eliminar el archivo temporal
        os.remove(temp_file_path)

        return db_audit
    
    except Exception as e:
        print(f"Error al procesar el archivo: {e}")
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error interno del servidor al procesar el archivo: {e}")

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