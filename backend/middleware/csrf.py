from fastapi import Request, HTTPException
import secrets

# CSRF token storage (en producción usar Redis)
csrf_tokens = set()

def generate_csrf_token() -> str:
    """Genera un token CSRF único"""
    token = secrets.token_urlsafe(32)
    csrf_tokens.add(token)
    return token

def validate_csrf_token(token: str) -> bool:
    """Valida un token CSRF"""
    return token in csrf_tokens

def remove_csrf_token(token: str):
    """Remueve un token CSRF usado"""
    csrf_tokens.discard(token)

async def csrf_protect(request: Request, call_next):
    """Middleware de protección CSRF para métodos mutantes"""
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        # Excepciones para endpoints públicos
        if request.url.path in ["/api/auth/login"]:
            return await call_next(request)
        
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token or not validate_csrf_token(csrf_token):
            raise HTTPException(status_code=403, detail="Token CSRF inválido")
    
    return await call_next(request)
