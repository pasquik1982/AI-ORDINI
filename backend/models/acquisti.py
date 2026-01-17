from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Acquisti(Base):
    __tablename__ = "acquisti"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    fornitore_id = Column(Integer, nullable=False)
    data_ordine = Column(DateTime(timezone=True), nullable=False)
    data_consegna = Column(DateTime(timezone=True), nullable=True)
    categoria_prodotto = Column(String, nullable=False)
    quantita = Column(Float, nullable=False)
    prezzo_totale = Column(Float, nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)