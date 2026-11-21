"""국내 대학 공시 레이스. Python 3.10 이상, 표준 라이브러리만 사용."""
import argparse
import hashlib
import json
import math
import re
import threading
import time
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PREFIX = "2026-11-18-"
SOURCE = "https://www.academyinfo.go.kr/main/main2130/"
# 원자료 공시 9개 필드(인덱스 0..8) — 제외 사유 매핑과 1:1 대응
FIELDS = [
    "st_1_ps_py_et",      # 0: 학생 1인당 교육비 (천원)
    "ae_tn",              # 1: 평균 등록금 (천원)
    "st_1_ps_py_sp",      # 2: 재학생 1인당 장학금 (원)
    "st_sd_fm_tr_ee_re",  # 3: 전임교원 확보율(재학생 기준, %)
    "ge_et_re",           # 4: 졸업생 취업률 (%)
    "be_ae_re",           # 5: 기숙사 수용률 (%)
    "gn_ie_fm_rt_re",     # 6: 신입생 충원율 (%)
    "fm_tr_le_ce_re",     # 7: 전임교원 강의 비율 (%)
    "st_1_ps_py_bk_ct",   # 8: 학생 1인당 도서 자료 (권)
]
UNITS = ["천원", "천원", "원", "%", "%", "%", "%", "%", "권"]
# 학생 Support 지수 11개 지표 배점 (합계 100점)
# [교육비 20, 실부담등록금 16, 교육비환원율 12, 전임교원확보율 12, 취업률 10, 기숙사 8, 신입생충원율 6, 전임강의 5, 도서 4, 글로컬 3, 서울대10개 4]
WEIGHTS = [20, 16, 12, 12, 10, 8, 6, 5, 4]
GLOCAL_BONUS = 3
SNU10_BONUS = 4
# '서울대 10개 만들기' 2026년 1차 집중 지원 거점국립대 선정 현황 (교육부 2026.09.01 발표)
SNU10 = {
    "부산대학교": (2026, "제조·해양산업 AI 전환(AX) 혁신 선도 국토공간 대전환 플랫폼"),
    "전남대학교": (2026, "서남권 메가프로젝트 선도 첨단반도체·미래에너지·AI 특성화"),
    "충남대학교": (2026, "중부권 4대 성장엔진 산업·연구인력 배출 국가 거점"),
}
# 본지정 연도부터 적용하며 학교명은 공시 단위의 정식 명칭과 대조한다.
GROUPS = {
    2023: "강원대학교 국립강릉원주대학교 강릉원주대학교 경상국립대학교 부산대학교 부산교육대학교 국립순천대학교 순천대학교 안동대학교 국립안동대학교 국립경국대학교 울산대학교 전북대학교 충북대학교 국립한국교통대학교 한국교통대학교 포항공과대학교 한림대학교",
    2024: "건양대학교 경북대학교 국립목포대학교 국립창원대학교 한국승강기대학교 동아대학교 동서대학교 대구보건대학교 광주보건대학교 대전보건대학교 대구한의대학교 원광대학교 원광보건대학교 인제대학교 한동대학교",
    2025: "경성대학교 순천향대학교 전남대학교 제주대학교 조선대학교 조선간호대학교 충남대학교 국립공주대학교 한서대학교",
}
DESIGNATED = {name: year for year, names in GROUPS.items() for name in names.split()}
CANCELLED = {"충북대학교", "국립한국교통대학교", "한국교통대학교"}
KST = timezone(timedelta(hours=9))
state = {}
lock = threading.Lock()


def now():
    return datetime.now(KST).isoformat(timespec="seconds")


def ranked(values):
    # 동점에 부여한 평균 등수의 두 배를 정수로 보관해 총점 동점 판정을 정확히 한다.
    order = sorted(range(len(values)), key=values.__getitem__, reverse=True)
    result = [0] * len(values)
    start = 0
    while start < len(order):
        end = start + 1
        while end < len(order) and values[order[start]] == values[order[end]]:
            end += 1
        for idx in order[start:end]:
            result[idx] = 2 * len(order) - start - end - 1
        start = end
    return result


def pct_points(values, maximum):
    """동점 평균 등수 기반 백분위 환산."""
    n = len(values)
    weights = ranked(values)
    return [maximum * w / (2 * (n - 1)) for w in weights]


def log_points(values, maximum, p_lo=0.02, p_hi=0.98):
    """상하위 2% 윈저화 후 log1p 정규화해 실제 투자 규모 격차를 반영한다."""
    ordered = sorted(values)
    lo = ordered[int(len(ordered) * p_lo)]
    hi = ordered[min(len(ordered) - 1, int(len(ordered) * p_hi))]
    l_lo = math.log1p(max(0.0, lo))
    l_hi = math.log1p(max(0.0, hi))
    span = max(1e-9, l_hi - l_lo)
    return [maximum * (math.log1p(max(0.0, min(hi, max(lo, v)))) - l_lo) / span for v in values]


def linear_points(values, maximum, lo, hi):
    """고정 구간 [lo, hi] 선형 환산."""
    span = max(1e-9, hi - lo)
    return [maximum * (min(hi, max(lo, v)) - lo) / span for v in values]


def score(raw, year):
    rows = []
    excluded = []
    seen = set()
    for item in raw:
        uid = item["schl_id"] + "-" + item["psbs_div_cd"]
        if uid in seen or item["svy_yr"] != str(year) or item["schl_knd_cd"] != "03":
            raise ValueError("중복 학교 또는 연도·학교 유형 불일치")
        seen.add(uid)
        name = item["lst_kor_schl_nm"]
        campus = item["psbs_div_nm"]
        if campus != "본교":
            name += " · " + campus
        raw_vals = []
        raw_years = []
        reasons = []
        for i, field in enumerate(FIELDS):
            value = item.get(field)
            period = str(item.get(field + "_year", ""))
            if value in (None, "", "-") or not period.isdigit():
                reasons.append(i)
                continue
            if item[field + "_unit"] != UNITS[i]:
                raise ValueError("공시 단위 변경")
            value = float(str(value).replace(",", ""))
            if not math.isfinite(value) or value < 0 or (i == 4 and value > 100):
                raise ValueError("공시값 범위 오류")
            # 기숙사 수용률(5)과 신입생 충원율(6)은 실제 0% 공시값을 유효 인정한다.
            if value == 0 and i not in (5, 6):
                reasons.append(i)
            raw_vals.append(value)
            raw_years.append(period)
        et_raw = item.get("et_st_ct")
        et_val = 0
        if et_raw not in (None, "", "-"):
            et_val = int(round(float(str(et_raw).replace(",", ""))))
        if reasons or et_val <= 0:
            excluded.append({"name": name, "missing": reasons, "id": uid})
            continue

        edu, tuition, schol, fac_rate, emp, dorm, fill, lec, books = raw_vals
        net_tuition = round(max(0.0, tuition - schol / 1000.0), 2)
        edu_return = round((edu / tuition) * 100.0, 1)
        dorm_capped = round(min(100.0, dorm), 1)
        fill_capped = round(min(100.0, fill), 1)

        # 표시·산정용 9개 수치 [교육비, 실부담등록금, 교육비환원율, 전임교원확보율, 취업률, 기숙사, 신입생충원율, 전임강의, 도서]
        values = [edu, net_tuition, edu_return, fac_rate, emp, dorm_capped, fill_capped, lec, books]
        years = [
            raw_years[0], raw_years[1], raw_years[0], raw_years[3], raw_years[4],
            raw_years[5], raw_years[6], raw_years[7], raw_years[8],
        ]
        rows.append({
            "id": uid,
            "name": name,
            "region": item["pbnf_area_nm"],
            "students": et_val,
            "tuition": tuition,
            "scholarship": schol,
            "values": values,
            "years": years,
            "points": [],
        })

    n = len(rows)
    if n < 100:
        raise ValueError(f"{year}년 산정 가능 단위 {n}곳")

    metric_points = [
        log_points([r["values"][0] for r in rows], WEIGHTS[0]),                   # 0: 학생 1인당 교육비 (22)
        pct_points([-r["values"][1] for r in rows], WEIGHTS[1]),                  # 1: 실부담 등록금 ↓ (16, 0원 동점)
        log_points([r["values"][2] for r in rows], WEIGHTS[2]),                   # 2: 교육비 환원율 (12)
        pct_points([min(150.0, r["values"][3]) for r in rows], WEIGHTS[3]),       # 3: 전임교원 확보율·재학생 기준 (12, 150% 캡)
        pct_points([r["values"][4] for r in rows], WEIGHTS[4]),                   # 4: 졸업생 취업률 (10)
        pct_points([r["values"][5] for r in rows], WEIGHTS[5]),                   # 5: 기숙사 수용률 (8, 100% 캡)
        linear_points([r["values"][6] for r in rows], WEIGHTS[6], 60.0, 100.0),   # 6: 신입생 충원율 (7, 60~100% 선형)
        pct_points([r["values"][7] for r in rows], WEIGHTS[7]),                   # 7: 전임교원 강의 비율 (5)
        pct_points([r["values"][8] for r in rows], WEIGHTS[8]),                   # 8: 학생 1인당 도서 자료 (4)
    ]

    for j, row in enumerate(rows):
        name = row["name"].split(" · ")[0]
        start = DESIGNATED.get(name)
        active = bool(start and start <= year <= 2026 and not (name in CANCELLED and year >= 2026))
        glocal_pts = float(GLOCAL_BONUS if active else 0)
        row["designation"] = start if start and start <= year else None

        snu10_info = SNU10.get(name)
        snu10_active = bool(snu10_info and snu10_info[0] <= year)
        snu10_pts = float(SNU10_BONUS if snu10_active else 0)
        row["snu10"] = {"year": snu10_info[0], "track": snu10_info[1]} if snu10_active else None

        pts = [col[j] for col in metric_points] + [glocal_pts, snu10_pts]
        row["points"] = pts
        row["score"] = round(sum(pts), 6)

    rows.sort(key=lambda r: (-r["score"], r["name"], r["id"]))
    last = None
    for i, row in enumerate(rows, 1):
        if row["score"] != last:
            rank = i
        last = row["score"]
        row["rank"] = rank
    return {"year": year, "rows": rows, "excluded": excluded, "total": len(raw)}


def pull(year):
    params = dict(svyYr=year, schKndCdArr="03", schEstbDivCdArr="", schZnCdArr="",
                  schZnCdArr1="", numStu="", schl_div_cd="02", lst_kor_schl_nm="")
    request = Request(SOURCE + "selectSchlList.do", data=urlencode(params).encode(),
                      headers={"X-Requested-With": "XMLHttpRequest", "Referer": SOURCE + "doInit.do"})
    with urlopen(request, timeout=40) as response:
        return json.load(response)["resultList"]


def research_names():
    # 한 번의 수집에서 같은 기관 목록을 세 연도에 공통 사용한다.
    page = 1
    institutions = {}
    while True:
        query = urlencode(dict(filter="country_code:kr,type:education", per_page=100,
                               select="id,display_name_alternatives,counts_by_year", page=page,
                               sort="id:asc"))
        with urlopen("https://api.openalex.org/institutions?" + query, timeout=30) as response:
            batch = json.load(response)
        for record in batch["results"]:
            institutions[record["id"]] = record
        if len(institutions) >= batch["meta"]["count"]:
            break
        if not batch["results"] or page >= 12:
            raise ValueError("OpenAlex 기관 목록 불완전")
        page += 1
    names = {}
    for record in institutions.values():
        for alias in set(record["display_name_alternatives"] or []):
            names.setdefault(alias.replace(" ", ""), {})[record["id"]] = record
    return names


def combine(edition, names):
    year = edition["year"]
    result = []
    skipped = list(edition["excluded"])
    for school in edition["rows"]:
        name = school["name"].replace(" ", "")
        matches = names.get(name) or names.get(name.removeprefix("국립"), {})
        if len(matches) != 1:
            skipped.append(dict(name=school["name"], id=school["id"], reason="연구 기관 단위 대응 미확인"))
            continue
        institution = next(iter(matches.values()))
        periods = [a for a in institution["counts_by_year"] if year-3 <= a["year"] < year]
        if len({a["year"] for a in periods}) != 3:
            skipped.append(dict(name=school["name"], id=school["id"], reason="3개년 연구 집계 미확인"))
            continue
        works = sum(a["works_count"] for a in periods)
        citations = sum(a["cited_by_count"] for a in periods)
        result.append(dict(school, source=institution["id"], supportRank=school["rank"],
                           values=school["values"]+[None,None,works,citations],
                           years=school["years"]+["","",f"{year-3}–{year-1}",f"{year-3}–{year-1}"]))
    if len(result) < 100:
        raise ValueError("종합 비교 가능 대학이 100곳 미만")
    peaks = [max(r["values"][i] for r in result) for i in (11, 12)]
    for r in result:
        # 최댓값 대비 제곱근으로 연구량 격차를 줄인다. 모든 대학에 동일한 배점을 적용한다.
        points = [v / 2 for v in r["points"]]
        for i, peak in zip((11, 12), peaks):
            points.append(25 * math.sqrt(r["values"][i] / peak))
        r["points"] = points
        r["score"] = round(sum(points), 6)
    result.sort(key=lambda r: (-r["score"], r["name"], r["id"]))
    for i, r in enumerate(result):
        if i == 0 or result[i-1]["score"] != r["score"]:
            rank = i + 1
        r["rank"] = rank
    return dict(year=year,rows=result,excluded=skipped,total=edition["total"])


def refresh():
    with urlopen(SOURCE + "doInit.do", timeout=30) as response:
        page = response.read().decode()
    select = page.split('id="vn_svyYr"', 1)[1].split("</select>", 1)[0]
    years = sorted({int(y) for y in re.findall(r'<option value="(20\d\d)"', select)})[-3:]
    if not years:
        raise ValueError("조회 가능 연도 없음")
    names = research_names()
    editions = []
    for year in years:
        raw = pull(year)
        edition = score(raw, year)
        previous = next((e for e in state.get("editions", []) if e["year"] == year), None)
        if previous and len(raw) < previous["total"]:
            raise ValueError("공시 단위 감소 확인 필요")
        edition["combined"] = combine(edition, names)
        editions.append(edition)
    payload = json.dumps(editions, ensure_ascii=False, separators=(",", ":")).encode()
    version = hashlib.sha256(payload).hexdigest()[:16]
    stamp = now()
    with lock:
        previous = state.get("version")
        update = dict(version=version, checked=stamp, published=state.get("published", stamp),
                      editions=editions, error=False)
        if previous != version:
            update["published"] = stamp
            # 버전별 새 파일에 모두 기록한 뒤에만 메모리의 공개판을 교체한다.
            path = ROOT / (PREFIX + "대학비교공시판-" + stamp[:19].replace(":", "") + "-" + version + ".json")
            with path.open("x", encoding="utf8") as f:
                json.dump(update, f, ensure_ascii=False, separators=(",", ":"))
        state.update(update)


def cycle():
    while True:
        try:
            refresh()
        except Exception as err:
            with lock:
                state["error"] = True
            print("공시 갱신 지연", err, flush=True)
        time.sleep(3600)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # 창 없이 실행하는 pythonw에서는 표준 오류 스트림이 제공되지 않는다.
        return

    def do_GET(self):
        if self.path.split("?")[0] in ("/api/판", "/api/data", "/api/status"):
            with lock:
                obj = dict(state)
            if self.path.startswith("/api/status"):
                obj.pop("editions", None)
            body = json.dumps(obj, ensure_ascii=False).encode()
            self.send_response(200 if obj.get("version") else 503)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path == "/":
            self.path = "/" + PREFIX + "campus.html"
        super().do_GET()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--collect", action="store_true")
    parser.add_argument("--port", type=int, default=8772)
    args = parser.parse_args()
    # 종전 실행기의 와일드카드가 이 파일을 호출해도 이전 판의 포트는 점유하지 않는다.
    if args.port in (8770, 8771):
        raise SystemExit(0)
    # 중단 중 생성된 불완전한 파일은 건너뛰고 마지막 정상판에서 시작한다.
    for path in sorted(ROOT.glob(PREFIX + "대학비교공시판-*.json"), reverse=True):
        try:
            state.update(json.loads(path.read_text(encoding="utf8")))
            break
        except (ValueError, OSError):
            continue
    if args.collect:
        refresh()
        print([(e["year"], e["total"], len(e["rows"])) for e in state["editions"]])
    else:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(ROOT)))
        threading.Thread(target=cycle, daemon=True).start()
        server.serve_forever()
