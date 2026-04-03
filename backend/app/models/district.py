"""City district model."""

from app.extensions import db


class District(db.Model):
    __tablename__ = "districts"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    city = db.Column(db.String(100), nullable=False, default="РђР»РјР°С‚С‹")
    coordinates_center = db.Column(db.JSON, nullable=True)

    appeals = db.relationship("Appeal", backref="district", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "city": self.city,
            "coordinates_center": self.coordinates_center,
        }
