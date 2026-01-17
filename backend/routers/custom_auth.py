import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/custom-auth", tags=["custom-auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str


@router.post("/login", response_model=LoginResponse)
async def custom_login(data: LoginRequest):
    """Custom login with fixed credentials"""
    try:
        # Fixed credentials
        VALID_USERNAME = "AI"
        VALID_PASSWORD = "Carlo2026!"
        
        # Validate credentials
        if data.username == VALID_USERNAME and data.password == VALID_PASSWORD:
            # Generate a simple token (in production, use JWT)
            token = "custom_auth_token_ai_user"
            
            return LoginResponse(
                success=True,
                message="Login effettuato con successo",
                token=token
            )
        else:
            raise HTTPException(
                status_code=401,
                detail="Nome utente o password non validi"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during custom login: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore durante il login: {str(e)}")


@router.post("/verify")
async def verify_token(token: str):
    """Verify if the token is valid"""
    try:
        VALID_TOKEN = "custom_auth_token_ai_user"
        
        if token == VALID_TOKEN:
            return {"valid": True, "username": "AI"}
        else:
            raise HTTPException(status_code=401, detail="Token non valido")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore durante la verifica: {str(e)}")