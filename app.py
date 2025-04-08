# import whisper

# # Load the Whisper model
# whisper_model = whisper.load_model("base")

# @app.route('/api/transcribe', methods=['POST'])
# def transcribe_audio():
#     try:
#         if 'audio' not in request.files:
#             return jsonify({'error': 'No audio file provided'}), 400
            
#         audio_file = request.files['audio']
#         if audio_file.filename == '':
#             return jsonify({'error': 'No selected file'}), 400
            
#         # Save the audio file temporarily
#         temp_path = "temp_audio.wav"
#         audio_file.save(temp_path)
        
#         # Transcribe the audio
#         result = whisper_model.transcribe(temp_path)
        
#         # Clean up the temporary file
#         os.remove(temp_path)
        
#         return jsonify({
#             'text': result['text']
#         })
        
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500 