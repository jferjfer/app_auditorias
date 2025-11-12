"""
Validadores de seguridad para entrada de usuarios
"""
import re
from fastapi import HTTPException, UploadFile
from typing import List
import pandas as pd
from io import BytesIO

# Límites de seguridad
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_FILES_PER_UPLOAD = 10
ALLOWED_EXTENSIONS = {'.xlsx', '.xls'}

def validate_password_strength(password: str) -> None:
    """
    Valida que la contraseña cumpla con requisitos de seguridad
    """
    if len(password) < 8:
        raise HTTPException(400, "La contraseña debe tener mínimo 8 caracteres")
    
    if not re.search(r"[A-Z]", password):
        raise HTTPException(400, "La contraseña debe tener al menos una mayúscula")
    
    if not re.search(r"[a-z]", password):
        raise HTTPException(400, "La contraseña debe tener al menos una minúscula")
    
    if not re.search(r"[0-9]", password):
        raise HTTPException(400, "La contraseña debe tener al menos un número")

def validate_excel_file(file: UploadFile, content: bytes) -> None:
    """
    Valida que el archivo sea un Excel válido y seguro
    """
    if not any(file.filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(400, f"Solo se permiten archivos Excel ({', '.join(ALLOWED_EXTENSIONS)})")
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"Archivo muy grande. Máximo {MAX_FILE_SIZE // (1024*1024)}MB")
    
    try:
        pd.read_excel(BytesIO(content), nrows=1)
    except Exception as e:
        raise HTTPException(400, f"Archivo Excel inválido o corrupto: {str(e)}")

def validate_files_batch(files: List[UploadFile]) -> None:
    """
    Valida un lote de archivos
    """
    if len(files) > MAX_FILES_PER_UPLOAD:
        raise HTTPException(400, f"Máximo {MAX_FILES_PER_UPLOAD} archivos por carga")
    
    if not files:
        raise HTTPException(400, "No se recibieron archivos")

def sanitize_input(text: str, max_length: int = 500) -> str:
    """
    Sanitiza entrada de texto para prevenir inyecciones
    """
    if not text:
        return ""
    
    text = text[:max_length]
    text = re.sub(r'[<>\"\'%;()&+]', '', text)
    
    return text.strip()

def validate_ot_number(ot: str) -> str:
    """
    Valida y sanitiza número de OT
    """
    if not ot:
        raise HTTPException(400, "Número de OT requerido")
    
    if not re.match(r'^[A-Za-z0-9\s\-]+$', ot):
        raise HTTPException(400, "Número de OT inválido")
    
    if len(ot) > 50:
        raise HTTPException(400, "Número de OT muy largo")
    
    return ot.strip()
