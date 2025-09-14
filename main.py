
import os
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from PIL import Image
import json

load_dotenv()

app = Flask(__name__, template_folder='src', static_folder='src/static')

# Configure the Gemini API
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']
    try:
        img = Image.open(image_file.stream)
        prompt = """Analyze the provided image of a plant and identify any diseases. 
        Respond with a JSON object containing the following fields:
        - "disease_name": The common name of the disease.
        - "confidence_score": A float between 0 and 1 indicating your confidence in the diagnosis.
        - "description": A brief description of the disease, including its causes and symptoms.
        - "treatment_recommendation": A detailed recommendation for treating the disease, formatted as an HTML string. Use `<h3>` for subheadings, `<p>` for paragraphs, and `<ul>`/`<li>` for lists. For example: '<h3>Treatment Steps</h3><ul><li>Step 1...</li><li>Step 2...</li></ul>'. Do not use markdown like **.
        
        If the plant appears to be healthy, set the disease_name to "Healthy" and provide a confidence score."""
        
        response = model.generate_content([prompt, img])

        # Clean up the response and parse the JSON
        # The model might return the JSON string wrapped in markdown
        cleaned_text = response.text.strip().replace('```json', '').replace('```', '')
        json_data = json.loads(cleaned_text)
        
        return jsonify(json_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    text_to_translate = data.get('text', '')
    if not text_to_translate:
        return jsonify({'error': 'No text provided for translation'}), 400

    try:
        prompt = f"Translate the following text to Malayalam: {text_to_translate}"
        response = model.generate_content(prompt)
        return jsonify({'translation': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
