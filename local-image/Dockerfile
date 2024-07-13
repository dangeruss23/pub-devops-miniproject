# Use an official Python runtime as a parent image docker build -t "appdev:Dockerfile" .
FROM python:3.12.4-alpine3.20

# Create a non-root user and group
RUN addgroup -S emd && adduser -S emd -G emd

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
# RUN pip install --trusted-host pypi.python.org -r requirements.txt
RUN pip install -r requirements.txt

# Change ownership of the app directory
RUN chown -R emd:emd /app

USER emd

# The app runs on port 56789
EXPOSE 56789

# Run app.py when the container launches
CMD ["python3", "app.py"]