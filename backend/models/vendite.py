from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Vendite(Base):
    __tablename__ = "vendite"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    data = Column(DateTime(timezone=True), nullable=False)
    canale_vendita = Column(String, nullable=False)
    categoria_prodotto = Column(String, nullable=False)
    quantita = Column(Float, nullable=False)
    prezzo_totale = Column(Float, nullable=True)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)