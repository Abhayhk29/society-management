import sys

import uvicorn

from app.config import get_settings


def main() -> None:
    reload = "--no-reload" not in sys.argv
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=reload,
    )


if __name__ == "__main__":
    main()
