import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import joinedload
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.acquisti import Acquisti
from models.vendite import Vendite
from models.fornitori import Fornitori

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/data", tags=["data"])


class DeleteAllRequest(BaseModel):
    password: str


class DeleteAllResponse(BaseModel):
    success: bool
    deleted_count: int
    message: str


class CreateOrderRequest(BaseModel):
    fornitore: str
    data_ordine: str
    data_consegna: str
    categoria_prodotto: str
    quantita: float
    prezzo_totale: float


class CreateSaleRequest(BaseModel):
    data: str
    canale_vendita: str
    categoria_prodotto: str
    quantita: float
    prezzo_totale: float


class CreateSupplierRequest(BaseModel):
    nome: str


class DeleteSupplierRequest(BaseModel):
    supplier_id: int


@router.get("/acquisti")
async def get_all_acquisti(
    fornitore: Optional[str] = Query(None, description="Filter by supplier name"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all supplier orders for the current user with optional supplier filter"""
    try:
        # Build query with join to fornitori table
        query = (
            select(
                Acquisti.id,
                Fornitori.nome.label("fornitore"),
                Acquisti.data_ordine,
                Acquisti.data_consegna,
                Acquisti.categoria_prodotto,
                Acquisti.quantita,
                Acquisti.prezzo_totale,
                (Acquisti.prezzo_totale / Acquisti.quantita).label("prezzo_unitario")
            )
            .join(Fornitori, Acquisti.fornitore_id == Fornitori.id)
            .where(Acquisti.user_id == current_user.id)
        )
        
        # Apply supplier filter if provided
        if fornitore:
            query = query.where(Fornitori.nome.ilike(f"%{fornitore}%"))
        
        # Order by delivery date descending
        query = query.order_by(Acquisti.data_consegna.desc())
        
        result = await db.execute(query)
        rows = result.all()
        
        # Convert to list of dicts
        acquisti = []
        for row in rows:
            acquisti.append({
                "id": row.id,
                "fornitore": row.fornitore,
                "data_ordine": row.data_ordine.isoformat() if row.data_ordine else None,
                "data_consegna": row.data_consegna.isoformat() if row.data_consegna else None,
                "categoria_prodotto": row.categoria_prodotto,
                "quantita": row.quantita,
                "prezzo_totale": row.prezzo_totale,
                "prezzo_unitario": float(row.prezzo_unitario) if row.prezzo_unitario else 0.0
            })
        
        return {"items": acquisti}
    
    except Exception as e:
        logger.error(f"Error fetching acquisti: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore nel recupero degli ordini: {str(e)}")


@router.get("/vendite")
async def get_all_vendite(
    canale: Optional[str] = Query(None, description="Filter by sales channel"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all sales for the current user with optional channel filter"""
    try:
        # Build query
        query = select(Vendite).where(Vendite.user_id == current_user.id)
        
        # Apply channel filter if provided
        if canale:
            query = query.where(Vendite.canale_vendita.ilike(f"%{canale}%"))
        
        # Order by date descending
        query = query.order_by(Vendite.data.desc())
        
        result = await db.execute(query)
        vendite_records = result.scalars().all()
        
        # Convert to list of dicts
        vendite = []
        for record in vendite_records:
            prezzo_unitario = 0.0
            if record.prezzo_totale and record.quantita > 0:
                prezzo_unitario = record.prezzo_totale / record.quantita
            
            vendite.append({
                "id": record.id,
                "data": record.data.isoformat() if record.data else None,
                "canale_vendita": record.canale_vendita,
                "categoria_prodotto": record.categoria_prodotto,
                "quantita": record.quantita,
                "prezzo_totale": record.prezzo_totale,
                "prezzo_unitario": prezzo_unitario
            })
        
        return {"items": vendite}
    
    except Exception as e:
        logger.error(f"Error fetching vendite: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore nel recupero delle vendite: {str(e)}")


@router.get("/fornitori")
async def get_all_fornitori(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all unique suppliers for the current user"""
    try:
        # Get distinct supplier names from user's orders
        query = (
            select(Fornitori.nome)
            .join(Acquisti, Acquisti.fornitore_id == Fornitori.id)
            .where(Acquisti.user_id == current_user.id)
            .distinct()
            .order_by(Fornitori.nome)
        )
        
        result = await db.execute(query)
        fornitori = [row[0] for row in result.all()]
        
        return {"fornitori": fornitori}
    
    except Exception as e:
        logger.error(f"Error fetching fornitori: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore nel recupero dei fornitori: {str(e)}")


@router.get("/all-suppliers")
async def get_all_suppliers(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all suppliers in the system"""
    try:
        # Get all suppliers
        query = select(Fornitori).order_by(Fornitori.nome)
        
        result = await db.execute(query)
        suppliers_records = result.scalars().all()
        
        suppliers = []
        for record in suppliers_records:
            suppliers.append({
                "id": record.id,
                "nome": record.nome
            })
        
        return {"suppliers": suppliers}
    
    except Exception as e:
        logger.error(f"Error fetching all suppliers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore nel recupero dei fornitori: {str(e)}")


@router.get("/canali")
async def get_all_canali(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all unique sales channels for the current user"""
    try:
        # Get distinct sales channels from user's sales
        query = (
            select(Vendite.canale_vendita)
            .where(Vendite.user_id == current_user.id)
            .distinct()
            .order_by(Vendite.canale_vendita)
        )
        
        result = await db.execute(query)
        canali = [row[0] for row in result.all()]
        
        return {"canali": canali}
    
    except Exception as e:
        logger.error(f"Error fetching canali: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore nel recupero dei canali: {str(e)}")


@router.post("/create-supplier")
async def create_supplier(
    data: CreateSupplierRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new supplier"""
    try:
        # Check if supplier already exists
        query = select(Fornitori).where(Fornitori.nome == data.nome)
        result = await db.execute(query)
        existing_supplier = result.scalar_one_or_none()
        
        if existing_supplier:
            raise HTTPException(
                status_code=400,
                detail=f"Il fornitore '{data.nome}' esiste già"
            )
        
        # Create new supplier
        supplier = Fornitori(nome=data.nome)
        db.add(supplier)
        await db.commit()
        await db.refresh(supplier)
        
        logger.info(f"User {current_user.id} created supplier: {data.nome}")
        
        return {
            "success": True,
            "message": "Fornitore creato con successo",
            "supplier_id": supplier.id,
            "supplier_name": supplier.nome
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating supplier: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore durante la creazione del fornitore: {str(e)}")


@router.post("/delete-supplier")
async def delete_supplier(
    data: DeleteSupplierRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a supplier and all associated orders"""
    try:
        # Check if supplier exists
        query = select(Fornitori).where(Fornitori.id == data.supplier_id)
        result = await db.execute(query)
        supplier = result.scalar_one_or_none()
        
        if not supplier:
            raise HTTPException(status_code=404, detail="Fornitore non trovato")
        
        # Delete all orders associated with this supplier for the current user
        delete_orders_query = delete(Acquisti).where(
            Acquisti.fornitore_id == data.supplier_id,
            Acquisti.user_id == current_user.id
        )
        await db.execute(delete_orders_query)
        
        # Check if any other users have orders with this supplier
        check_query = select(func.count(Acquisti.id)).where(Acquisti.fornitore_id == data.supplier_id)
        check_result = await db.execute(check_query)
        remaining_orders = check_result.scalar()
        
        # Only delete supplier if no other orders exist
        if remaining_orders == 0:
            delete_supplier_query = delete(Fornitori).where(Fornitori.id == data.supplier_id)
            await db.execute(delete_supplier_query)
        
        await db.commit()
        
        logger.info(f"User {current_user.id} deleted supplier {supplier.nome} (ID: {data.supplier_id})")
        
        return {
            "success": True,
            "message": "Fornitore e ordini associati eliminati con successo"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting supplier: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore durante l'eliminazione del fornitore: {str(e)}")


@router.post("/create-order")
async def create_order(
    data: CreateOrderRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new order manually"""
    try:
        # Find or create supplier
        query = select(Fornitori).where(Fornitori.nome == data.fornitore)
        result = await db.execute(query)
        fornitore = result.scalar_one_or_none()
        
        if not fornitore:
            # Create new supplier
            fornitore = Fornitori(nome=data.fornitore)
            db.add(fornitore)
            await db.flush()
        
        # Parse dates
        data_ordine = datetime.fromisoformat(data.data_ordine)
        data_consegna = datetime.fromisoformat(data.data_consegna)
        
        # Create order
        order = Acquisti(
            user_id=current_user.id,
            fornitore_id=fornitore.id,
            data_ordine=data_ordine,
            data_consegna=data_consegna,
            categoria_prodotto=data.categoria_prodotto,
            quantita=data.quantita,
            prezzo_totale=data.prezzo_totale
        )
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        
        return {
            "success": True,
            "message": "Ordine creato con successo",
            "order_id": order.id
        }
    
    except Exception as e:
        logger.error(f"Error creating order: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore durante la creazione dell'ordine: {str(e)}")


@router.post("/create-sale")
async def create_sale(
    data: CreateSaleRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new sale manually"""
    try:
        # Parse date
        data_vendita = datetime.fromisoformat(data.data)
        
        # Create sale
        sale = Vendite(
            user_id=current_user.id,
            data=data_vendita,
            canale_vendita=data.canale_vendita,
            categoria_prodotto=data.categoria_prodotto,
            quantita=data.quantita,
            prezzo_totale=data.prezzo_totale
        )
        
        db.add(sale)
        await db.commit()
        await db.refresh(sale)
        
        return {
            "success": True,
            "message": "Vendita creata con successo",
            "sale_id": sale.id
        }
    
    except Exception as e:
        logger.error(f"Error creating sale: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore durante la creazione della vendita: {str(e)}")


@router.post("/delete-all-acquisti", response_model=DeleteAllResponse)
async def delete_all_acquisti(
    data: DeleteAllRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all supplier orders for the current user (password protected)"""
    try:
        # Check password
        if data.password != "CANCELLATUTTO":
            raise HTTPException(status_code=403, detail="Password errata")
        
        # Count records before deletion
        count_query = select(func.count(Acquisti.id)).where(Acquisti.user_id == current_user.id)
        count_result = await db.execute(count_query)
        count = count_result.scalar()
        
        # Delete all orders for this user
        delete_query = delete(Acquisti).where(Acquisti.user_id == current_user.id)
        await db.execute(delete_query)
        await db.commit()
        
        logger.info(f"User {current_user.id} deleted {count} orders")
        
        return DeleteAllResponse(
            success=True,
            deleted_count=count,
            message=f"Eliminati {count} ordini con successo"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting all acquisti: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore durante l'eliminazione: {str(e)}")


@router.post("/delete-all-vendite", response_model=DeleteAllResponse)
async def delete_all_vendite(
    data: DeleteAllRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all sales for the current user (password protected)"""
    try:
        # Check password
        if data.password != "CANCELLATUTTO":
            raise HTTPException(status_code=403, detail="Password errata")
        
        # Count records before deletion
        count_query = select(func.count(Vendite.id)).where(Vendite.user_id == current_user.id)
        count_result = await db.execute(count_query)
        count = count_result.scalar()
        
        # Delete all sales for this user
        delete_query = delete(Vendite).where(Vendite.user_id == current_user.id)
        await db.execute(delete_query)
        await db.commit()
        
        logger.info(f"User {current_user.id} deleted {count} sales")
        
        return DeleteAllResponse(
            success=True,
            deleted_count=count,
            message=f"Eliminate {count} vendite con successo"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting all vendite: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore durante l'eliminazione: {str(e)}")