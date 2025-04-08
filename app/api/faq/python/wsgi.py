from faq_model import app, load_model_and_data

# Load model data immediately
load_model_and_data()

# This is for WSGI servers like gunicorn
if __name__ == "__main__":
    app.run() 