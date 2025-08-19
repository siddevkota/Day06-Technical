from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.process import router as process_router


def create_app() -> FastAPI:
	application = FastAPI(title="YT Caption Summary & Quiz API", version="0.1.0")

	application.add_middleware(
		CORSMiddleware,
		allow_origins=[
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"https://siddevkota.github.io",
			"https://*.github.io",
		],
		allow_credentials=True,
		allow_methods=["GET", "POST"],
		allow_headers=["*"],
	)

	# Routers
	application.include_router(process_router, prefix="/api", tags=["process"])

	@application.get("/health")
	def healthcheck() -> dict[str, str]:
		return {"status": "ok"}

	return application


app = create_app()
