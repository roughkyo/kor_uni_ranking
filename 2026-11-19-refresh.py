import json
import runpy
from pathlib import Path

collector = runpy.run_path("2026-11-18-대학비교서버.py")
data = Path("data/2026-11-19-data.json")
status = Path("data/2026-11-19-status.json")
state = collector["state"]
state.update(json.loads(data.read_text(encoding="utf8")))
# 수집에 실패하면 마지막 정상판을 보존하고 상태에 지연을 표시한다.
try:
    collector["refresh"]()
except Exception:
    state["error"] = True
    raise
finally:
    meta = {key: value for key, value in state.items() if key != "editions"}
    status.write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
if not state["error"]:
    data.write_text(json.dumps(state, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
