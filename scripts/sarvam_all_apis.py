"""
Sarvam AI — Complete API Reference & Demo
==========================================
Every API Sarvam offers, in one file.  Each function is self-contained;
run them individually or call main() to see them all.

APIs covered:
  1. Chat Completions          – LLM chat (sarvam-105b / conversations)
  2. Responses API             – OpenAI-compatible responses endpoint
  3. Text Translation          – Translate text across Indian languages
  4. Transliteration           – Convert script (Devanagari ↔ Latin etc.)
  5. Language Identification   – Detect which language a string is in
  6. Speech-to-Text            – Transcribe audio files
  7. Text-to-Speech            – Generate spoken audio from text
  8. Incident Reporting         – Turn a field report into a structured incident brief
  9. Document Intelligence      – OCR / parse PDFs, scans, handwritten docs
 10. Document Translation       – Translate entire documents (PDF, DOCX…)
 11. Dubbing                   – Localize video/audio into Indian languages
 12. Voice Cloning              – Clone a voice from a short audio clip
 13. Pronunciation Dictionary   – Pin how specific words are spoken in TTS
"""

import io
import os
import sys
import base64

# ── Force UTF-8 on Windows consoles ─────────────────────────────────────────
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ── Load .env ────────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.isfile(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

api_key = os.environ.get("SARVAM_API_KEY")
if not api_key:
    sys.exit("ERROR: SARVAM_API_KEY is not set. Paste your key into .env first.")

from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key=api_key)


# ─────────────────────────────────────────────────────────────────────────────
# 1. CHAT COMPLETIONS  (sarvam-105b / sarvam-105b-conversations)
# ─────────────────────────────────────────────────────────────────────────────
def demo_chat_completion():
    """
    Multi-turn chat with Sarvam's 105B model.
    Supports: system/user/assistant messages, temperature, top_p,
              tool calling, structured output (JSON mode), streaming.
    Models:  sarvam-105b  |  sarvam-105b-conversations
    Languages: 10 Indian + English
    """
    print("\n═══ 1. Chat Completions ═══")
    response = client.chat.completions(
        model="sarvam-105b-conversations",
        messages=[
            {"role": "system", "content": "You are a helpful assistant for Kumbh Mela visitors."},
            {"role": "user", "content": "कुंभ मेले में कौन-कौन से प्रमुख स्नान घाट हैं?"},
        ],
    )
    print(response.choices[0].message.content)
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 2. RESPONSES API  (OpenAI-compatible, multi-model)
# ─────────────────────────────────────────────────────────────────────────────
def demo_responses_api():
    """
    Stateless responses with reasoning, structured output, and tool calling.
    Models: sarvam-105b, glm5.3, glm5.3-flash, gemma4,
            deepseekv4.1-flash-1017, deepseekv4-pro, kimi-k3,
            mimo-v2.6-flash, mimo-v2.6-pro
    """
    print("\n═══ 2. Responses API ═══")
    response = client.responses.create(
        model="sarvam-105b",
        input="Explain the significance of Triveni Sangam in 2 sentences.",
    )
    # response has .output list; first item's .content has the text
    for item in response.output:
        if hasattr(item, "content"):
            for part in item.content:
                if hasattr(part, "text"):
                    print(part.text)
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 3. TEXT TRANSLATION  (Mayura / Sarvam-Translate)
# ─────────────────────────────────────────────────────────────────────────────
def demo_translate():
    """
    Translate text between Indian languages.
    Source languages: hi-IN, bn-IN, kn-IN, ml-IN, mr-IN, od-IN, pa-IN,
                      ta-IN, te-IN, en-IN, gu-IN  (+ more with sarvam-translate)
    Target languages: same set
    Models:  mayura:v1  |  sarvam-translate:v1
    """
    print("\n═══ 3. Text Translation ═══")
    response = client.text.translate(
        input="Welcome to Kumbh Mela! The largest spiritual gathering on Earth.",
        source_language_code="en-IN",
        target_language_code="hi-IN",
        model="mayura:v1",
        mode="formal",
    )
    print(f"English → Hindi: {response.translated_text}")
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 4. TRANSLITERATION  (Script conversion)
# ─────────────────────────────────────────────────────────────────────────────
def demo_transliterate():
    """
    Convert text from one script to another.
    e.g. Devanagari → Latin, Latin → Tamil, etc.
    Source: hi-IN, bn-IN, kn-IN, ml-IN, mr-IN, od-IN, pa-IN,
            ta-IN, te-IN, en-IN, gu-IN
    """
    print("\n═══ 4. Transliteration ═══")
    response = client.text.transliterate(
        input="कुंभ मेला भारत का सबसे बड़ा धार्मिक आयोजन है।",
        source_language_code="hi-IN",
        target_language_code="en-IN",
    )
    print(f"Devanagari → Latin: {response.transliterated_text}")
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 5. LANGUAGE IDENTIFICATION
# ─────────────────────────────────────────────────────────────────────────────
def demo_identify_language():
    """
    Detect which language a text string is written in.
    Returns language code + confidence scores.
    """
    print("\n═══ 5. Language Identification ═══")
    test_texts = [
        "कुंभ मेला में आपका स्वागत है",          # Hindi
        "কুম্ভ মেলায় আপনাকে স্বাগতম",            # Bengali
        "కుంభమేళాకు స్వాగతం",                    # Telugu
        "Welcome to Kumbh Mela",                  # English
    ]
    for text in test_texts:
        response = client.text.identify_language(input=text)
        lang = response.language_code
        print(f"  \"{text[:30]}...\" → {lang}")
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 6. SPEECH-TO-TEXT  (Saaras)
# ─────────────────────────────────────────────────────────────────────────────
def demo_speech_to_text(audio_path: str = None):
    """
    Transcribe audio in 23 languages (22 Indian + English).
    Model:  saaras:v3  |  saaras:v4
    Modes:  transcribe, translate, verbatim, translit, codemix
    Formats: wav, mp3, aac, ogg, opus, flac, mp4, amr, webm

    Also available:
      - client.speech_to_text.translate()        → audio to English text
      - client.speech_to_text_streaming           → real-time WebSocket
      - client.speech_to_text_job                 → batch processing
      - client.speech_to_text_realtime_streaming  → ultra-low-latency
    """
    print("\n═══ 6. Speech-to-Text (Saaras) ═══")
    if not audio_path:
        print("  ⏭ Skipped — pass an audio file path to demo_speech_to_text()")
        print("  Example: demo_speech_to_text('sample.wav')")
        print("  Supported modes: transcribe | translate | verbatim | translit | codemix")
        return None

    with open(audio_path, "rb") as f:
        response = client.speech_to_text.transcribe(
            file=f,
            model="saaras:v4",
            mode="codemix",         # keeps English words in English
            language_code="hi-IN",  # change for other languages
        )
    print(f"  Transcript: {response.transcript}")
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 7. TEXT-TO-SPEECH  (Bulbul)
# ─────────────────────────────────────────────────────────────────────────────
def demo_text_to_speech():
    """
    Generate natural speech in 11 languages (10 Indian + English).
    Model:  bulbul:v2  |  bulbul:v3  |  bulbul:v4-flash
    200+ voice options across languages and styles.
    Output: mp3, wav, opus, flac, aac, mulaw, alaw

    Controls: pitch, pace, loudness, temperature
    Also: client.text_to_speech_streaming for WebSocket streaming
    """
    print("\n═══ 7. Text-to-Speech (Bulbul) ═══")
    output_path = os.path.join(os.path.dirname(__file__), "..", "output_tts.mp3")

    response = client.text_to_speech.convert(
        text="कुंभ मेले में आपका स्वागत है! यहाँ आपको सभी जानकारी मिलेगी।",
        language_code="hi-IN",
        speaker="shubh",
        model="bulbul:v4-flash",
    )

    # response.audios is a list of base64-encoded audio chunks
    audio_bytes = base64.b64decode(response.audios[0])
    with open(output_path, "wb") as f:
        f.write(audio_bytes)
    print(f"  ✅ Audio saved to {os.path.abspath(output_path)}")
    print(f"  Size: {len(audio_bytes):,} bytes")
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 8. INCIDENT REPORTING
# ─────────────────────────────────────────────────────────────────────────────
def demo_incident_report(summary: str, zone: str = "unknown", language: str = "en-IN"):
    """Create a structured, multilingual incident brief from a field report.

    This is an assistive draft only: the Kumbh Setu control-room workflow
    remains responsible for validation, severity, dispatch and publication.
    """
    print("\n═══ 8. Incident Reporting ═══")
    response = client.chat.completions(
        model="sarvam-105b-conversations",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a Kumbh Setu incident intake assistant. "
                    "Return a concise JSON draft with keys summary, category, "
                    "severity, zone, immediate_action, and language. "
                    "Never claim verification, dispatch, or live facts."
                ),
            },
            {
                "role": "user",
                "content": f"Language: {language}\nZone: {zone}\nField report: {summary}",
            },
        ],
        temperature=0.1,
    )
    content = response.choices[0].message.content
    print(content)
    return response


# ─────────────────────────────────────────────────────────────────────────────
# 8. DOCUMENT INTELLIGENCE  (Sarvam Vision)
# ─────────────────────────────────────────────────────────────────────────────
def demo_document_intelligence(pdf_path: str = None):
    """
    OCR and structured extraction from PDFs, scans, handwritten docs.
    23 languages (22 Indian + English).

    Methods:
      - client.doc_ai.parse()              → digitize document (async job)
      - client.doc_ai.extract()            → extract specific fields
      - client.doc_ai.classify()           → classify document type
      - client.doc_ai.split()              → split multi-doc PDFs
      - client.doc_ai.get_status()         → poll job status
      - client.doc_ai.get_results()        → get extraction results
      - client.doc_ai.get_download_url()   → download processed output
      - client.doc_ai.create_upload_url()  → get pre-signed upload URL
      - client.doc_ai.get_capabilities()   → list supported doc types
    """
    print("\n═══ 8. Document Intelligence (Sarvam Vision) ═══")
    if not pdf_path:
        print("  ⏭ Skipped — pass a PDF/image path to demo_document_intelligence()")
        print("  Supports: PDF, JPG, PNG | printed, handwritten, mixed")
        return None

    with open(pdf_path, "rb") as f:
        job = client.doc_ai.parse(
            file=[f],
            language="hi-IN",
        )
    print(f"  Job created: {job.job_id}")
    print(f"  Poll with: client.doc_ai.get_status(job_id='{job.job_id}')")
    return job


# ─────────────────────────────────────────────────────────────────────────────
# 9. DOCUMENT TRANSLATION
# ─────────────────────────────────────────────────────────────────────────────
def demo_document_translation(doc_path: str = None):
    """
    Translate entire documents (PDF, DOCX, XLSX, PPTX, web pages).
    23 languages — layout and formatting preserved.
    Up to 12 target languages per job.

    Flow: create → upload to signed URL → start → poll → export

    Methods:
      - client.document_translation.create()
      - client.document_translation.start()
      - client.document_translation.get_live_status()
      - client.document_translation.trigger_export()
      - client.document_translation.get_export_status()
    """
    print("\n═══ 9. Document Translation ═══")
    if not doc_path:
        print("  ⏭ Skipped — pass a document path to demo_document_translation()")
        print("  Supports: PDF, DOCX, XLSX, PPTX, HTML")
        return None

    job = client.document_translation.create(
        job_name="kumbh-doc",
        source_language_code="en-IN",
        target_language_codes=["hi-IN", "mr-IN"],
        original_filename=os.path.basename(doc_path),
    )
    print(f"  Job created: {job.job_id}")
    print(f"  Upload URL: {job.upload_url[:80]}...")
    print("  Next: PUT file to upload_url, then client.document_translation.start()")
    return job


# ─────────────────────────────────────────────────────────────────────────────
# 10. DUBBING  (Video/Audio Localization)
# ─────────────────────────────────────────────────────────────────────────────
def demo_dubbing():
    """
    Localize video/audio into Indian languages, keeping each speaker's voice.
    Source: en-IN, hi-IN, bn-IN, gu-IN, kn-IN, ml-IN, mr-IN,
            or-IN, pa-IN, ta-IN, te-IN, as-IN
    Target: same set
    Export: video, audio, srt (subtitles)

    Flow: create → upload → start → poll → export

    Methods:
      - client.dubbing.create()
      - client.dubbing.upload()
      - client.dubbing.start()
      - client.dubbing.get_live_status()
      - client.dubbing.get_export_status()
    """
    print("\n═══ 10. Dubbing ═══")
    print("  Dubbing requires a video/audio file upload.")
    print("  Example usage:")
    print("    job = client.dubbing.create(")
    print("        source_language_code='en-IN',")
    print("        target_language_codes=['hi-IN', 'ta-IN'],")
    print("        export_options=['video', 'srt'],")
    print("        voice_cloning=True,")
    print("        num_speakers=2,")
    print("    )")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# 11. VOICE CLONING
# ─────────────────────────────────────────────────────────────────────────────
def demo_voice_cloning():
    """
    Clone a voice from a short audio clip, then generate speech in it.
    12 languages: as-IN, bn-IN, en-IN, gu-IN, hi-IN, kn-IN,
                  ml-IN, mr-IN, od-IN, pa-IN, ta-IN, te-IN

    Methods:
      - client.voice_cloning.create_voice()   → register a voice
      - client.voice_cloning.list_voices()     → list your voices
      - client.voice_cloning.get_voice()       → get voice details
      - client.voice_cloning.convert()         → TTS with cloned voice
      - client.voice_cloning.convert_stream()  → streaming TTS
      - client.voice_cloning.delete_voice()    → remove a voice

    Also: client.voice_cloning_streaming for WebSocket streaming
    """
    print("\n═══ 11. Voice Cloning ═══")
    print("  Requires a reference audio clip (5-30 seconds recommended).")
    print("  Example usage:")
    print("    # Step 1: Register voice")
    print("    voice = client.voice_cloning.create_voice(")
    print("        file=open('ref_audio.wav', 'rb'),")
    print("        name='my_voice', language='hi-IN',")
    print("        style='conversational', gender='male',")
    print("    )")
    print("    # Step 2: Generate speech")
    print("    result = client.voice_cloning.convert(")
    print("        text='कुंभ मेले में आपका स्वागत है',")
    print("        language_code='hi-IN',")
    print("        voice_id=voice.voice_id,")
    print("    )")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# 12. PRONUNCIATION DICTIONARY
# ─────────────────────────────────────────────────────────────────────────────
def demo_pronunciation_dictionary():
    """
    Control how specific words are spoken in TTS.
    Useful for brand names, abbreviations, regional terms.

    Methods:
      - client.pronunciation_dictionary.create()
      - client.pronunciation_dictionary.list()
      - client.pronunciation_dictionary.get()
      - client.pronunciation_dictionary.update()
      - client.pronunciation_dictionary.delete()

    Then pass dict_id to any TTS call.
    """
    print("\n═══ 12. Pronunciation Dictionary ═══")
    print("  Example usage:")
    print("    # Create a dictionary")
    print("    d = client.pronunciation_dictionary.create(")
    print("        name='kumbh-terms',")
    print("        data=[")
    print("            {'word': 'KumbhSetu', 'pronunciation': 'कुम्भ सेतु'},")
    print("            {'word': 'IRCTC', 'pronunciation': 'आई आर सी टी सी'},")
    print("        ],")
    print("    )")
    print("    # Use in TTS")
    print("    client.text_to_speech.convert(")
    print("        text='Book via KumbhSetu or IRCTC',")
    print("        language_code='hi-IN', speaker='shubh',")
    print("        model='bulbul:v4-flash', dict_id=d.dict_id,")
    print("    )")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# MAIN — Run everything
# ─────────────────────────────────────────────────────────────────────────────
def main():
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║           Sarvam AI — Complete API Demo                    ║")
    print("║           KumbhSetu Project                                ║")
    print("╚══════════════════════════════════════════════════════════════╝")

    # APIs that work with just text (no file uploads needed)
    demo_chat_completion()
    demo_responses_api()
    demo_translate()
    demo_transliterate()
    demo_identify_language()
    demo_text_to_speech()
    demo_incident_report(
        "A pilgrim needs assistance near the north gate; language support requested.",
        zone="Ramkund",
        language="hi-IN",
    )

    # APIs that need file inputs (skipped by default)
    demo_speech_to_text()         # pass audio_path to run
    demo_document_intelligence()  # pass pdf_path to run
    demo_document_translation()   # pass doc_path to run

    # APIs that need setup (shown as examples)
    demo_dubbing()
    demo_voice_cloning()
    demo_pronunciation_dictionary()

    print("\n" + "═" * 60)
    print("Done! Text-based APIs ran live. File-based APIs show usage.")
    print("Run individual functions with file paths to test those too.")


if __name__ == "__main__":
    main()
