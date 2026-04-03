"""Entry point for the AndATRA backend server."""

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(
        app,
        host=app.config["APP_HOST"],
        port=app.config["APP_PORT"],
        debug=app.config["FLASK_DEBUG"],
    )
