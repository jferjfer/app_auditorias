from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
import re

# Rate limiting storage
rate_limit_storage = defaultdict(list)

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting: 100 requests per minute per IP"""
    client_ip = request.client.host
    now = datetime.utcnow()
    
    # Clean old requests
    rate_limit_storage[client_ip] = [
        req_time for req_time in rate_limit_storage[client_ip]
        if now - req_time < timedelta(minutes=1)
    ]
    
    # Check limit
    if len(rate_limit_storage[client_ip]) >= 100:
        raise HTTPException(status_code=429, detail="Demasiadas solicitudes")
    
    rate_limit_storage[client_ip].append(now)
    return await call_next(request)

# Input validation
def sanitize_string(value: str, max_length: int = 255) -> str:
    """Remove dangerous characters"""
    if not value:
        return ""
    value = value[:max_length]
    dangerous = [';', '--', '/*', '*/', 'xp_', 'sp_', 'exec', 'execute']
    for pattern in dangerous:
        value = value.replace(pattern, '')
    return value.strip()

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_sku(sku: str) -> bool:
    """Validate SKU format"""
    return bool(re.match(r'^[A-Za-z0-9\-_]{1,50}$', sku))
