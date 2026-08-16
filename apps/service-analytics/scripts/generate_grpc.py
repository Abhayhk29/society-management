"""Generate Python gRPC stubs from shared-protos."""

from pathlib import Path

from grpc_tools import protoc

ROOT = Path(__file__).resolve().parents[1]
PROTO_ROOT = ROOT.parents[1] / "packages" / "shared-protos" / "proto"
OUT_DIR = ROOT / "app" / "grpc_gen"


def _touch_inits() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "__init__.py").touch(exist_ok=True)
    (OUT_DIR / "common").mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "common" / "__init__.py").touch(exist_ok=True)
    (OUT_DIR / "common" / "v1").mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "common" / "v1" / "__init__.py").touch(exist_ok=True)


def main() -> None:
    _touch_inits()

    result = protoc.main(
        [
            "grpc_tools.protoc",
            f"-I{PROTO_ROOT}",
            f"--python_out={OUT_DIR}",
            f"--grpc_python_out={OUT_DIR}",
            str(PROTO_ROOT / "common" / "v1" / "health.proto"),
        ]
    )
    if result != 0:
        raise SystemExit(f"protoc failed with code {result}")

    grpc_file = OUT_DIR / "common" / "v1" / "health_pb2_grpc.py"
    text = grpc_file.read_text(encoding="utf-8")
    text = text.replace(
        "from common.v1 import health_pb2 as common_dot_v1_dot_health__pb2",
        "from app.grpc_gen.common.v1 import health_pb2 as common_dot_v1_dot_health__pb2",
    )
    text = text.replace(
        "import health_pb2 as health__pb2",
        "from app.grpc_gen.common.v1 import health_pb2 as health__pb2",
    )
    grpc_file.write_text(text, encoding="utf-8")
    print(f"Generated stubs in {OUT_DIR}")


if __name__ == "__main__":
    main()
