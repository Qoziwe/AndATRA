"""Problem category model with self-referencing parent for subcategories."""

from app.extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    icon = db.Column(db.String(50), nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    description = db.Column(db.Text, nullable=True)

    children = db.relationship(
        "Category",
        backref=db.backref("parent", remote_side="Category.id"),
        lazy="select",
    )
    appeals = db.relationship("Appeal", backref="category", lazy="dynamic")

    def to_dict(self, include_children=True):
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "icon": self.icon,
            "parent_id": self.parent_id,
            "description": self.description,
        }
        if include_children:
            data["children"] = [child.to_dict(include_children=True) for child in self.children]
        return data
