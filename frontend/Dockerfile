# frontend/Dockerfile
# Dockerfile for Flask Frontend
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Flask application files
COPY app.py .
# Copy the templates folder (removed comment from same line)
COPY templates/ templates/

# Expose the port Flask runs on
EXPOSE 5000

# Set an environment variable for Flask to run in production mode (optional but good practice)
ENV FLASK_ENV=production

# Command to run the Flask application
# Use gunicorn for a production-ready WSGI server
# gunicorn -w 4 -b 0.0.0.0:5000 app:app
# Or, for simplicity and testing:
CMD ["python", "app.py"]
