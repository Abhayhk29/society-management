"""Generate Python gRPC stubs from shared-protos."""

from pathlib import Path

from grpc_tools import protoc

ROOT = Path(__file__).resolve().parents[1]
PROTO_ROOT = ROOT.parents[1] / "packages" / "shared-protos" / "proto"
OUT_DIR = ROOT / "app" / "grpc_gen"


def _touch_inits() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "__init__.py").touch(exist_ok=True)
    for parts in (("common", "v1"), ("analytics", "v1")):
        cur = OUT_DIR
        for part in parts:
            cur = cur / part
            cur.mkdir(parents=True, exist_ok=True)
            (cur / "__init__.py").touch(exist_ok=True)


def _fix_imports(grpc_file: Path, package_prefix: str) -> None:
    text = grpc_file.read_text(encoding="utf-8")
    # health: from common.v1 import health_pb2 ...
    # analytics: from analytics.v1 import analytics_pb2 ...
    replacements = [
        (
            f"from {package_prefix} import ",
            f"from app.grpc_gen.{package_prefix} import ",
        ),
        (
            "import health_pb2 as health__pb2",
            "from app.grpc_gen.common.v1 import health_pb2 as health__pb2",
        ),
        (
            "import analytics_pb2 as analytics__pb2",
            "from app.grpc_gen.analytics.v1 import analytics_pb2 as analytics__pb2",
        ),
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    grpc_file.write_text(text, encoding="utf-8")


def main() -> None:
    _touch_inits()

    protos = [
        PROTO_ROOT / "common" / "v1" / "health.proto",
        PROTO_ROOT / "analytics" / "v1" / "analytics.proto",
    ]

    result = protoc.main(
        [
            "grpc_tools.protoc",
            f"-I{PROTO_ROOT}",
            f"--python_out={OUT_DIR}",
            f"--grpc_python_out={OUT_DIR}",
            *[str(p) for p in protos],
        ]
    )
    if result != 0:
        raise SystemExit(f"protoc failed with code {result}")

    _fix_imports(OUT_DIR / "common" / "v1" / "health_pb2_grpc.py", "common.v1")
    _fix_imports(
        OUT_DIR / "analytics" / "v1" / "analytics_pb2_grpc.py", "analytics.v1"
    )
    print(f"Generated stubs in {OUT_DIR}")


if __name__ == "__main__":
    main()
