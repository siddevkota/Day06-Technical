import re
from typing import Optional


YOUTUBE_REGEX = re.compile(
	# https:// and http:// with or without www, youtu.be short links and standard watch URLs
	r"^(https?://)?(www\.|m\.)?(youtube\.com|youtu\.be)/(.+)$",
	re.IGNORECASE,
)


def validate_youtube_url(url: str) -> bool:
	return bool(YOUTUBE_REGEX.match(url)) and parse_video_id(url) is not None


def parse_video_id(url: str) -> Optional[str]:
	# Try typical patterns
	short_match = re.search(r"youtu\.be/([A-Za-z0-9_-]{6,})", url)
	if short_match:
		return short_match.group(1)

	watch_match = re.search(r"v=([A-Za-z0-9_-]{6,})", url)
	if watch_match:
		return watch_match.group(1)

	embed_match = re.search(r"/embed/([A-Za-z0-9_-]{6,})", url)
	if embed_match:
		return embed_match.group(1)

	return None
