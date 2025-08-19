from fastapi import APIRouter, HTTPException

from app.schemas.process import (
	ProcessRequest,
	ProcessResponse,
	ValidationResponse,
	SummarizeRequest,
	SummarizeResponse,
	GPTSummaryRequest,
	GPTSummaryResponse,
)
from app.services.url import validate_youtube_url, parse_video_id
from app.services.captions import fetch_captions
from app.services.summary import generate_three_sentence_summary
from app.services.quiz import generate_quiz_questions


router = APIRouter()


@router.post("/validate", response_model=ValidationResponse)
def validate(request: ProcessRequest) -> ValidationResponse:
	valid = validate_youtube_url(str(request.youtube_url))
	return ValidationResponse(
		valid=valid, reason=None if valid else "Invalid YouTube URL"
	)


@router.post("/process", response_model=ProcessResponse)
async def process_video(request: ProcessRequest) -> ProcessResponse:
	url = str(request.youtube_url)
	if not validate_youtube_url(url):
		raise HTTPException(status_code=422, detail="Invalid YouTube URL")

	video_id = parse_video_id(url)
	if not video_id:
		raise HTTPException(status_code=422, detail="Could not parse video id from URL")

	try:
		captions = await fetch_captions(video_id)
		summary = generate_three_sentence_summary(captions)
		quiz_questions = generate_quiz_questions(summary, num_questions=4)

		return ProcessResponse(
			status="success",
			video_id=video_id,
			summary=summary,
			quiz_questions=quiz_questions,
		)
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.post("/extract", response_model=SummarizeResponse)
async def extract_captions(request: SummarizeRequest) -> SummarizeResponse:
	"""Simple caption extraction endpoint"""
	url = str(request.youtube_url)
	if not validate_youtube_url(url):
		raise HTTPException(status_code=422, detail="Invalid YouTube URL")

	video_id = parse_video_id(url)
	if not video_id:
		raise HTTPException(status_code=422, detail="Could not parse video id from URL")

	try:
		captions = await fetch_captions(video_id)
		summary = generate_three_sentence_summary(captions)

		return SummarizeResponse(
			status="success",
			video_id=video_id,
			captions=captions,
			summary=summary,
		)
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.post("/gpt-summarize", response_model=GPTSummaryResponse)
async def gpt_summarize(request: GPTSummaryRequest) -> GPTSummaryResponse:
	"""GPT-powered summarization endpoint - placeholder for future AI integration"""
	try:
		# Placeholder for GPT integration
		# Future: Send request.captions + request.prompt to GPT API
		# Future: Use models like GPT-4, Claude, Gemini, etc.

		placeholder_summary = (
			"🤖 AI Summary (Placeholder): "
			"This is where GPT-generated summary will appear. "
			f"Caption length: {len(request.captions)} characters. "
			f"Custom prompt: {'Yes' if request.prompt else 'Default'}. "
			"Future integration will use OpenAI GPT-4, Anthropic Claude, or Google Gemini."
		)

		return GPTSummaryResponse(
			status="success", summary=placeholder_summary, model_used="placeholder-v1"
		)

	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))
