"""Product classification model."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from .base import BaseModel


class ProductClassification(BaseModel):
    """مدل دسته‌بندی محصولات."""
    
    __tablename__ = "product_classification"
    
    # Fields
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    
    def __repr__(self) -> str:
        return f"<ProductClassification(id={self.id}, name={self.name})>"

