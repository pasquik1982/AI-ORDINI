import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.acquisti import AcquistiService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/acquisti", tags=["acquisti"])


# ---------- Pydantic Schemas ----------
class AcquistiData(BaseModel):
    """Entity data schema (for create/update)"""
    fornitore_id: int
    data_ordine: datetime
    data_consegna: Optional[datetime] = None
    categoria_prodotto: str
    quantita: float
    prezzo_totale: float
    created_at: Optional[datetime] = None


class AcquistiUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    fornitore_id: Optional[int] = None
    data_ordine: Optional[datetime] = None
    data_consegna: Optional[datetime] = None
    categoria_prodotto: Optional[str] = None
    quantita: Optional[float] = None
    prezzo_totale: Optional[float] = None
    created_at: Optional[datetime] = None


class AcquistiResponse(BaseModel):
    """Entity response schema"""
    id: int
    fornitore_id: int
    data_ordine: datetime
    data_consegna: Optional[datetime] = None
    categoria_prodotto: str
    quantita: float
    prezzo_totale: float
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AcquistiListResponse(BaseModel):
    """List response schema"""
    items: List[AcquistiResponse]
    total: int
    skip: int
    limit: int


class AcquistiBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[AcquistiData]


class AcquistiBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: AcquistiUpdateData


class AcquistiBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[AcquistiBatchUpdateItem]


class AcquistiBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=AcquistiListResponse)
async def query_acquistis(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query acquistis with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying acquistis: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = AcquistiService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} acquistis")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying acquistis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=AcquistiListResponse)
async def query_acquistis_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query acquistis with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying acquistis: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = AcquistiService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} acquistis")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying acquistis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=AcquistiResponse)
async def get_acquisti(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single acquisti by ID (user can only see their own records)"""
    logger.debug(f"Fetching acquisti with id: {id}, fields={fields}")
    
    service = AcquistiService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Acquisti with id {id} not found")
            raise HTTPException(status_code=404, detail="Acquisti not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching acquisti {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=AcquistiResponse, status_code=201)
async def create_acquisti(
    data: AcquistiData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new acquisti"""
    logger.debug(f"Creating new acquisti with data: {data}")
    
    service = AcquistiService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create acquisti")
        
        logger.info(f"Acquisti created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating acquisti: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating acquisti: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[AcquistiResponse], status_code=201)
async def create_acquistis_batch(
    request: AcquistiBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple acquistis in a single request"""
    logger.debug(f"Batch creating {len(request.items)} acquistis")
    
    service = AcquistiService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} acquistis successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[AcquistiResponse])
async def update_acquistis_batch(
    request: AcquistiBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple acquistis in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} acquistis")
    
    service = AcquistiService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} acquistis successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=AcquistiResponse)
async def update_acquisti(
    id: int,
    data: AcquistiUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing acquisti (requires ownership)"""
    logger.debug(f"Updating acquisti {id} with data: {data}")

    service = AcquistiService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Acquisti with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Acquisti not found")
        
        logger.info(f"Acquisti {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating acquisti {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating acquisti {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_acquistis_batch(
    request: AcquistiBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple acquistis by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} acquistis")
    
    service = AcquistiService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} acquistis successfully")
        return {"message": f"Successfully deleted {deleted_count} acquistis", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_acquisti(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single acquisti by ID (requires ownership)"""
    logger.debug(f"Deleting acquisti with id: {id}")
    
    service = AcquistiService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Acquisti with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Acquisti not found")
        
        logger.info(f"Acquisti {id} deleted successfully")
        return {"message": "Acquisti deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting acquisti {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")