from pydantic import BaseModel, HttpUrl


class ProcessRequest(BaseModel):
	youtube_url: HttpUrl


class ValidationResponse(BaseModel):
	valid: bool
	reason: str | None = None


class ProcessResponse(BaseModel):
	status: str
	video_id: str
	summary: str
	quiz_questions: list[str]


class SummarizeRequest(BaseModel):
	youtube_url: HttpUrl


class SummarizeResponse(BaseModel):
	status: str
	video_id: str
	captions: str
	summary: str


class GPTSummaryRequest(BaseModel):
	captions: str
	prompt: str | None = None


class GPTSummaryResponse(BaseModel):
	model_config = {"protected_namespaces": ()}

	status: str
	summary: str
	model_used: str | None = None
