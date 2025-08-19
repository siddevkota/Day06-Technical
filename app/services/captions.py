import json
import asyncio
from youtube_transcript_api import YouTubeTranscriptApi

ytt_api = YouTubeTranscriptApi()


def _fetch_transcript_text(video_id: str) -> str:
	"""Blocking transcript fetch, offloaded to thread in async context."""
	try:
		fetched = ytt_api.fetch(video_id)
		data = []
		for snippet in fetched:
			data.append(
				{
					"text": snippet.text,
					"start": snippet.start,
					"duration": snippet.duration,
				}
			)

		full_transcript = " ".join([entry["text"] for entry in data])
		return full_transcript

	except Exception as e:
		error_msg = str(e)
		if "TranscriptsDisabled" in error_msg or "disabled" in error_msg.lower():
			raise Exception(
				"Error: This video has captions disabled for third-party access"
			)
		elif "NoTranscriptFound" in error_msg or "not found" in error_msg.lower():
			raise Exception("Error: No transcripts found for this video")
		else:
			raise Exception(f"Error: Could not extract captions - {error_msg}")


async def fetch_captions(video_id: str) -> str:
	"""Async wrapper for transcript fetching"""
	return await asyncio.to_thread(_fetch_transcript_text, video_id)


def fetch_captions_sync(video_id: str) -> str:
	"""Synchronous version for backward compatibility"""
	return _fetch_transcript_text(video_id)
