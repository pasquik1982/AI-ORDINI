import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.acquisti import Acquisti
from models.vendite import Vendite

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


class CategoryData(BaseModel):
    categoria: str
    acquisti_quantita: float
    vendite_quantita: float
    acquisti_valore: float
    vendite_valore: float


class MonthlyData(BaseModel):
    anno: int
    mese: int
    acquisti_quantita: float
    vendite_quantita: float
    acquisti_valore: float
    vendite_valore: float


class SummaryData(BaseModel):
    totale_acquisti_quantita: float
    totale_vendite_quantita: float
    totale_acquisti_valore: float
    totale_vendite_valore: float
    categorie_count: int


class AnalyticsSummaryResponse(BaseModel):
    summary: SummaryData
    by_category: List[CategoryData]
    by_month: List[MonthlyData]


@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    anno: Optional[int] = Query(None, description="Filter by year"),
    mese: Optional[int] = Query(None, description="Filter by month (1-12)"),
    categoria: Optional[str] = Query(None, description="Filter by category"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get analytics summary with filters"""
    try:
        logger.info(f"Analytics request - anno: {anno}, mese: {mese}, categoria: {categoria}")
        
        # Build base filters
        acquisti_filters = [Acquisti.user_id == current_user.id]
        vendite_filters = [Vendite.user_id == current_user.id]
        
        # Apply year filter
        if anno:
            acquisti_filters.append(extract('year', Acquisti.data_consegna) == anno)
            vendite_filters.append(extract('year', Vendite.data) == anno)
        
        # Apply month filter
        if mese:
            acquisti_filters.append(extract('month', Acquisti.data_consegna) == mese)
            vendite_filters.append(extract('month', Vendite.data) == mese)
        
        # Apply category filter
        if categoria:
            acquisti_filters.append(Acquisti.categoria_prodotto == categoria)
            vendite_filters.append(Vendite.categoria_prodotto == categoria)
        
        # Get overall summary for acquisti
        acquisti_summary_query = select(
            func.coalesce(func.sum(Acquisti.quantita), 0).label('total_qty'),
            func.coalesce(func.sum(Acquisti.prezzo_totale), 0).label('total_price'),
            func.count(func.distinct(Acquisti.categoria_prodotto)).label('cat_count')
        ).where(*acquisti_filters)
        
        acquisti_result = await db.execute(acquisti_summary_query)
        acquisti_summary = acquisti_result.first()
        
        # Get overall summary for vendite
        vendite_summary_query = select(
            func.coalesce(func.sum(Vendite.quantita), 0).label('total_qty'),
            func.coalesce(func.sum(Vendite.prezzo_totale), 0).label('total_price')
        ).where(*vendite_filters)
        
        vendite_result = await db.execute(vendite_summary_query)
        vendite_summary = vendite_result.first()
        
        summary = SummaryData(
            totale_acquisti_quantita=float(acquisti_summary.total_qty or 0),
            totale_vendite_quantita=float(vendite_summary.total_qty or 0),
            totale_acquisti_valore=float(acquisti_summary.total_price or 0),
            totale_vendite_valore=float(vendite_summary.total_price or 0),
            categorie_count=int(acquisti_summary.cat_count or 0)
        )
        
        # Get data by category
        acquisti_by_cat_query = select(
            Acquisti.categoria_prodotto,
            func.sum(Acquisti.quantita).label('qty'),
            func.sum(Acquisti.prezzo_totale).label('price')
        ).where(*acquisti_filters).group_by(Acquisti.categoria_prodotto)
        
        acquisti_by_cat = await db.execute(acquisti_by_cat_query)
        acquisti_cat_dict = {row.categoria_prodotto: (float(row.qty or 0), float(row.price or 0)) for row in acquisti_by_cat}
        
        vendite_by_cat_query = select(
            Vendite.categoria_prodotto,
            func.sum(Vendite.quantita).label('qty'),
            func.sum(Vendite.prezzo_totale).label('price')
        ).where(*vendite_filters).group_by(Vendite.categoria_prodotto)
        
        vendite_by_cat = await db.execute(vendite_by_cat_query)
        vendite_cat_dict = {row.categoria_prodotto: (float(row.qty or 0), float(row.price or 0)) for row in vendite_by_cat}
        
        logger.info(f"Acquisti categories: {list(acquisti_cat_dict.keys())}")
        logger.info(f"Vendite categories: {list(vendite_cat_dict.keys())}")
        
        # Combine categories
        all_categories = set(acquisti_cat_dict.keys()) | set(vendite_cat_dict.keys())
        by_category = []
        for cat in sorted(all_categories):
            acq_qty, acq_price = acquisti_cat_dict.get(cat, (0.0, 0.0))
            ven_qty, ven_price = vendite_cat_dict.get(cat, (0.0, 0.0))
            by_category.append(CategoryData(
                categoria=cat,
                acquisti_quantita=acq_qty,
                vendite_quantita=ven_qty,
                acquisti_valore=acq_price,
                vendite_valore=ven_price
            ))
        
        logger.info(f"Returning {len(by_category)} categories")
        
        # Get data by month (only if no month filter is applied)
        by_month = []
        if not mese:
            acquisti_by_month_query = select(
                extract('year', Acquisti.data_consegna).label('anno'),
                extract('month', Acquisti.data_consegna).label('mese'),
                func.sum(Acquisti.quantita).label('qty'),
                func.sum(Acquisti.prezzo_totale).label('price')
            ).where(*acquisti_filters).group_by('anno', 'mese').order_by('anno', 'mese')
            
            acquisti_by_month = await db.execute(acquisti_by_month_query)
            acquisti_month_dict = {(int(row.anno), int(row.mese)): (float(row.qty or 0), float(row.price or 0)) for row in acquisti_by_month}
            
            vendite_by_month_query = select(
                extract('year', Vendite.data).label('anno'),
                extract('month', Vendite.data).label('mese'),
                func.sum(Vendite.quantita).label('qty'),
                func.sum(Vendite.prezzo_totale).label('price')
            ).where(*vendite_filters).group_by('anno', 'mese').order_by('anno', 'mese')
            
            vendite_by_month = await db.execute(vendite_by_month_query)
            vendite_month_dict = {(int(row.anno), int(row.mese)): (float(row.qty or 0), float(row.price or 0)) for row in vendite_by_month}
            
            # Combine months
            all_months = set(acquisti_month_dict.keys()) | set(vendite_month_dict.keys())
            for anno_val, mese_val in sorted(all_months):
                acq_qty, acq_price = acquisti_month_dict.get((anno_val, mese_val), (0.0, 0.0))
                ven_qty, ven_price = vendite_month_dict.get((anno_val, mese_val), (0.0, 0.0))
                by_month.append(MonthlyData(
                    anno=anno_val,
                    mese=mese_val,
                    acquisti_quantita=acq_qty,
                    vendite_quantita=ven_qty,
                    acquisti_valore=acq_price,
                    vendite_valore=ven_price
                ))
        
        return AnalyticsSummaryResponse(
            summary=summary,
            by_category=by_category,
            by_month=by_month
        )
    
    except Exception as e:
        logger.error(f"Error getting analytics summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Errore nel recupero delle analisi: {str(e)}")