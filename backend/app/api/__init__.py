"""API blueprints package and SocketIO event registration."""

from flask_socketio import SocketIO

from app.utils.validators import has_valid_socketio_token


def register_socketio_events(socketio: SocketIO):
    """Register SocketIO event handlers."""

    @socketio.on("connect", namespace="/ws/updates")
    def handle_connect(auth=None):
        """Handle client connection to the updates namespace."""
        return has_valid_socketio_token(auth)

    @socketio.on("disconnect", namespace="/ws/updates")
    def handle_disconnect():
        """Handle client disconnection."""
        pass
