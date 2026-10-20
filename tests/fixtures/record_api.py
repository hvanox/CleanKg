"""Records the answers of the real FastAPI (prototipe/api) to a fixed scenario of 119 requests, for tests/api-parity.test.ts.

The in-browser demo API (src/lib/demo-api) must answer the same requests the same way. Run this only when prototipe/api
changes its behaviour, with the API's own virtualenv, and commit the new api-recording.json:

    cd prototipe/api && . .venv/bin/activate && python ../web/tests/fixtures/record_api.py

It uses a throw-away SQLite file and never touches cleankg_demo.db.
"""
import json, os, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
API = str(HERE.parents[2] / "api")  # prototipe/web/tests/fixtures -> prototipe/api
sys.path.insert(0, API)
tmp = tempfile.mkdtemp()
os.environ["CLEANKG_API_DB"] = f"sqlite+pysqlite:///{tmp}/parity.db"
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
from fastapi.testclient import TestClient
from app.db import init_db, SessionLocal
from app.seed import seed_demo
from app.main import app

init_db()
with SessionLocal() as s:
    seed_demo(s)

B = "74.3,42.6,74.8,43.1"
def new(**kw):
    d = dict(category="illegal_dump", size="medium", lat=42.8746, lng=74.5698, description="демо: свалка у арыка", anonymous=False)
    d.update(kw); return d

R = []  # (method, path, actor, body)
def add(m, p, a=None, b=None): R.append((m, p, a, b))

# reads of the seed
add("GET", "/api/v1/categories"); add("GET", "/api/v1/organisations")
add("GET", f"/api/v1/reports?bbox={B}")
add("GET", "/api/v1/reports?bbox=" + B + "&status=confirmed")
add("GET", "/api/v1/reports?bbox=" + B + "&category=illegal_dump&limit=3")
for i in range(1, 16): add("GET", f"/api/v1/reports/{i}")
# happy path
add("POST", "/api/v1/reports", "1", new())
add("POST", "/api/v1/reports", "1", new(anonymous=True, category="littered_area", size="large", description="  свалка  "))
add("PATCH", "/api/v1/reports/16/status", "4", dict(to_status="under_review", actor_kind="system"))
add("POST", "/api/v1/reports/16/claim", "2", dict(actor_kind="operator", organisation_id=1))
add("PATCH", "/api/v1/reports/16/status", "2", dict(to_status="resolved", actor_kind="operator"))
add("POST", "/api/v1/reports/16/confirmations", "1", dict(kind="resolution"))
add("POST", "/api/v1/reports/16/confirmations", "2", dict(kind="resolution"))
add("POST", "/api/v1/reports/16/confirmations", "4", dict(kind="resolution"))
add("GET", "/api/v1/reports/16")
# anonymous report path
add("PATCH", "/api/v1/reports/17/status", "4", dict(to_status="under_review", actor_kind="system"))
add("POST", "/api/v1/reports/17/comments", "1", dict(text="  мой комментарий  "))
add("POST", "/api/v1/reports/17/comments", "2", dict(text="чужой комментарий"))
add("POST", "/api/v1/reports/17/confirmations", "1", dict(kind="report", comment="тоже вижу"))
add("POST", "/api/v1/reports/17/confirmations", "1", dict(kind="report"))
add("POST", "/api/v1/reports/17/confirmations", "3", dict(kind="report"))
add("POST", "/api/v1/reports/17/claim", "3", dict(actor_kind="volunteer"))
add("PATCH", "/api/v1/reports/17/status", "3", dict(to_status="resolved", actor_kind="volunteer"))
add("PATCH", "/api/v1/reports/17/status", "1", dict(to_status="disputed", actor_kind="resident"))
add("PATCH", "/api/v1/reports/17/status", "1", dict(to_status="disputed", actor_kind="resident", comment="мусор на месте"))
add("PATCH", "/api/v1/reports/17/status", "4", dict(to_status="in_progress", actor_kind="system"))
add("PATCH", "/api/v1/reports/17/status", "4", dict(to_status="under_review", actor_kind="system"))
add("GET", "/api/v1/reports/17")
# errors
add("PATCH", "/api/v1/reports/18/status", "1", dict(to_status="confirmed", actor_kind="resident"))
add("POST", "/api/v1/reports", "1", new(description="звоните +996 555 12-34-56"))
add("POST", "/api/v1/reports", "1", new(description="ivan@mail.kg"))
add("POST", "/api/v1/reports", "1", new(category="nope"))
add("POST", "/api/v1/reports", "1", new(lat=55, lng=37))
add("POST", "/api/v1/reports", "1", new(size="enormous"))
add("POST", "/api/v1/reports", None, new())
add("POST", "/api/v1/reports", "abc", new())
add("POST", "/api/v1/reports", "99", new())
add("POST", "/api/v1/reports", "1", new(description=""))
add("POST", "/api/v1/reports", "1", new(description="x"*1001))
add("GET", "/api/v1/reports/999"); add("GET", "/api/v1/reports/0"); add("GET", "/api/v1/reports/abc"); add("GET", "/api/v1/reports/2147483648")
for bb in ["1,2,3", "a,b,c,d", "75,42,74,43", "0,0,181,10"]:
    add("GET", f"/api/v1/reports?bbox={bb}")
add("GET", "/api/v1/reports?status=gone")
add("GET", "/api/v1/reports?limit=0"); add("GET", "/api/v1/reports?limit=501")
add("POST", "/api/v1/reports/4/claim", "3", dict(actor_kind="volunteer"))
add("POST", "/api/v1/reports/3/claim", "3", dict(actor_kind="volunteer"))
add("POST", "/api/v1/reports/15/claim", "3", dict(actor_kind="volunteer"))
add("POST", "/api/v1/reports/10/claim", "3", dict(actor_kind="volunteer"))
add("POST", "/api/v1/reports/3/claim", "2", dict(actor_kind="operator"))
add("POST", "/api/v1/reports/3/claim", "3", dict(actor_kind="operator"))
add("POST", "/api/v1/reports/3/claim", "4", dict(actor_kind="moderator"))
add("POST", "/api/v1/reports/3/claim", "1", dict(actor_kind="operator", organisation_id=99))
add("POST", "/api/v1/reports/5/claim", "2", dict(actor_kind="operator"))
add("POST", "/api/v1/reports/3/claim", "2", dict(actor_kind="operator", organisation_id=2))
add("PATCH", "/api/v1/reports/3/status", "4", dict(to_status="under_review", actor_kind="system"))
add("PATCH", "/api/v1/reports/13/status", "4", dict(to_status="rejected", actor_kind="moderator"))
add("PATCH", "/api/v1/reports/13/status", "4", dict(to_status="rejected", actor_kind="moderator", reason="bored"))
add("PATCH", "/api/v1/reports/13/status", "4", dict(to_status="rejected", actor_kind="moderator", reason="other"))
add("PATCH", "/api/v1/reports/13/status", "4", dict(to_status="rejected", actor_kind="moderator", reason="other", comment="не отходы"))
add("PATCH", "/api/v1/reports/10/status", "4", dict(to_status="rejected", actor_kind="moderator", reason="spam"))
add("PATCH", "/api/v1/reports/10/status", "1", dict(to_status="under_review", actor_kind="system"))
add("PATCH", "/api/v1/reports/7/status", "2", dict(to_status="under_review", actor_kind="system"))
add("PATCH", "/api/v1/reports/7/status", "4", dict(to_status="under_review", actor_kind="system"))
add("PATCH", "/api/v1/reports/5/status", "4", dict(to_status="under_review", actor_kind="system"))
add("PATCH", "/api/v1/reports/5/status", "2", dict(to_status="resolved", actor_kind="operator"))
add("PATCH", "/api/v1/reports/5/status", "2", dict(to_status="resolved", actor_kind="operator"))
add("PATCH", "/api/v1/reports/2/status", "4", dict(to_status="confirmed", actor_kind="resident"))
add("PATCH", "/api/v1/reports/2/status", "2", dict(to_status="confirmed", actor_kind="resident"))
add("POST", "/api/v1/reports/2/confirmations", "2", dict(kind="resolution"))
add("POST", "/api/v1/reports/2/confirmations", "1", dict(kind="resolution"))
add("POST", "/api/v1/reports/2/confirmations", "1", dict(kind="resolution"))
add("POST", "/api/v1/reports/1/confirmations", "1", dict(kind="resolution"))
add("POST", "/api/v1/reports/1/confirmations", "1", dict(kind="report"))
add("PATCH", "/api/v1/reports/11/status", "4", dict(to_status="in_progress", actor_kind="system", comment="ivan@mail.kg"))
add("PATCH", "/api/v1/reports/11/status", "4", dict(to_status="in_progress", actor_kind="system"))
add("POST", "/api/v1/reports/1/comments", "1", dict(text="тел 0555 123 456"))
add("POST", "/api/v1/reports/1/comments", "1", dict(text=""))
add("PATCH", "/api/v1/reports/1/status", "1", dict(to_status="in_progress", actor_kind="system"))
add("PATCH", "/api/v1/reports/1/status", "4", dict(to_status="in_progress", actor_kind="system"))
add("PATCH", "/api/v1/reports/1/status", "4", dict(to_status="bogus", actor_kind="system"))
add("GET", f"/api/v1/reports?bbox={B}")
for i in range(1, 19): add("GET", f"/api/v1/reports/{i}")

client = TestClient(app)
out = []
for m, p, a, b in R:
    h = {}
    if a is not None: h["X-Actor-Id"] = a
    r = client.request(m, p, headers=h, json=b)
    try: body = r.json()
    except Exception: body = None
    out.append(dict(method=m, path=p, actor=a, body=b, status=r.status_code, response=body))
(HERE / "api-recording.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
print(len(out), "requests recorded")
