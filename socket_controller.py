from flask import Flask
from flask_socketio import SocketIO

# Initialize the socketio instance
socketio = SocketIO()

socket_app = None

def set_app(app):
    global socket_app
    socket_app = app
    emit_status('testing')

def emit_status(status):
    if not socket_app:
        return

    with socket_app.app_context():
        socketio.emit('status_update', {'status': status})

def emit_conversation_state(conversation_state):
    with socket_app.app_context():
        socketio.emit('conversation_update', {'conversation_state': conversation_state})
