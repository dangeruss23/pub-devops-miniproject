from flask import Flask
import os
import socket

app = Flask(__name__)

@app.route("/")
def hello():
    html = "<h3>Hello {name}!</h3>" \
           "<b>Hostname:</b> {hostname}<br/>" \
           "<b>Favorite dessert:</b> {favoritedesert}<br/>"
    return html.format(name=os.getenv("NAME", "world"), 
                       hostname=socket.gethostname(), 
                       favoritedesert=os.getenv("FAVORITE_DESERT", "ice cream"))

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=os.getenv("PORT", "56789"))