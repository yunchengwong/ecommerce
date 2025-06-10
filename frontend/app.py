# app.py
from flask import Flask, render_template, request, jsonify
import os
import requests

app = Flask(__name__)

# Get the backend URL from environment variables,
# which will be set by Docker Compose.
# The 'backend' hostname will resolve to the backend service's IP within the Docker network.
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:3000')
INSTANCE_ID = os.getenv('INSTANCE_ID', 'N/A')

@app.route('/')
def index():
    """
    Renders the main index page.
    """
    return render_template('index.html', instance_id=INSTANCE_ID)

@app.route('/get_products', methods=['GET'])
def get_products_from_backend():
    """
    Endpoint to fetch data from the Node.js Express backend.
    Makes an HTTP GET request to the backend service.
    """
    try:
        # Make a request to the backend service using its Docker service name
        # The backend service is named 'backend' in docker-compose.yml
        response = requests.get(f"{BACKEND_URL}/api/products")
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)
        data = response.json()
        return jsonify(data)
    except requests.exceptions.ConnectionError as e:
        # Handle connection errors (e.g., backend not running or unreachable)
        return jsonify({"error": f"Could not connect to backend: {e}", "backend_url": BACKEND_URL}), 500
    except requests.exceptions.Timeout:
        # Handle timeout errors
        return jsonify({"error": "Backend request timed out"}), 504
    except requests.exceptions.RequestException as e:
        # Handle any other request-related errors
        return jsonify({"error": f"An error occurred: {e}"}), 500
    except Exception as e:
        # Catch any other unexpected errors
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

if __name__ == '__main__':
    # When running locally (outside Docker), set host to 0.0.0.0 to make it accessible externally
    # Inside Docker, Flask's default host (127.0.0.1) would only be accessible within the container.
    app.run(debug=True, host='0.0.0.0', port=5000)
