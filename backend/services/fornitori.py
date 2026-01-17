import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.fornitori import Fornitori

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class FornitoriService:
    """Service layer for Fornitori operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Fornitori]:
        """Create a new fornitori"""
        try:
            obj = Fornitori(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created fornitori with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating fornitori: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Fornitori]:
        """Get fornitori by ID"""
        try:
            query = select(Fornitori).where(Fornitori.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching fornitori {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of fornitoris"""
        try:
            query = select(Fornitori)
            count_query = select(func.count(Fornitori.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Fornitori, field):
                        query = query.where(getattr(Fornitori, field) == value)
                        count_query = count_query.where(getattr(Fornitori, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Fornitori, field_name):
                        query = query.order_by(getattr(Fornitori, field_name).desc())
                else:
                    if hasattr(Fornitori, sort):
                        query = query.order_by(getattr(Fornitori, sort))
            else:
                query = query.order_by(Fornitori.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching fornitori list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Fornitori]:
        """Update fornitori"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Fornitori {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated fornitori {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating fornitori {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete fornitori"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Fornitori {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted fornitori {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting fornitori {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Fornitori]:
        """Get fornitori by any field"""
        try:
            if not hasattr(Fornitori, field_name):
                raise ValueError(f"Field {field_name} does not exist on Fornitori")
            result = await self.db.execute(
                select(Fornitori).where(getattr(Fornitori, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching fornitori by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Fornitori]:
        """Get list of fornitoris filtered by field"""
        try:
            if not hasattr(Fornitori, field_name):
                raise ValueError(f"Field {field_name} does not exist on Fornitori")
            result = await self.db.execute(
                select(Fornitori)
                .where(getattr(Fornitori, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Fornitori.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching fornitoris by {field_name}: {str(e)}")
            raise