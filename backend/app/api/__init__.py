"""API blueprints package and SocketIO event registration."""

from flask_socketio import SocketIO


def register_socketio_events(socketio: SocketIO):
    """Register SocketIO event handlers."""

    @socketio.on("connect", namespace="/ws/updates")
    def handle_connect():
        """Handle client connection to the updates namespace."""
        pass

    @socketio.on("disconnect", namespace="/ws/updates")
    def handle_disconnect():
        """Handle client disconnection."""
        pass
