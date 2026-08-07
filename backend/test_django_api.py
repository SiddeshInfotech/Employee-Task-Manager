"""
Django DRF Backend - End-to-End API Test Suite
Run with: python test_django_api.py
Django must be running: python manage.py runserver 8002
"""
import urllib.request
import json
import sys

BASE = "http://127.0.0.1:8002/api"
results = []


def test(name, got, expected, extra=""):
    ok = got == expected
    results.append(ok)
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {name}: HTTP {got} {extra}")
    return ok


def req(url, method="GET", data=None, headers=None):
    h = dict(headers or {})
    if data:
        h["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        r = urllib.request.urlopen(request, timeout=35)
        try:
            body = json.loads(r.read())
        except Exception:
            body = {}
        return r.status, body
    except urllib.error.HTTPError as e:
        body = {}
        try:
            body = json.loads(e.read())
        except Exception:
            pass
        return e.code, body
    except Exception as ex:
        # Always return dict so .get() calls don't crash
        return 0, {"__error__": str(ex)}


# ──────────────────────────────────────────────
# 1. Authentication
# ──────────────────────────────────────────────
print("\n[AUTH]")
s, b = req(BASE + "/auth/login", "POST",
           json.dumps({"username": "admin", "password": "admin123"}).encode())
token_type = b.get('token_type') if isinstance(b, dict) else None
test("POST /auth/login (admin)", s, 200, f"token_type={token_type}")

token = b.get("access_token", "") if isinstance(b, dict) else ""
if not token:
    print("FATAL: No token returned from login. Is Django running on port 8002?")
    sys.exit(1)

H = {"Authorization": "Bearer " + token}

# Bad login should return 401
s, _ = req(BASE + "/auth/login", "POST",
           json.dumps({"username": "admin", "password": "wrongpassword"}).encode())
test("POST /auth/login (bad creds)", s, 401)

# ──────────────────────────────────────────────
# 2. Users / Me
# ──────────────────────────────────────────────
print("\n[USERS]")
s, b = req(BASE + "/users/me", headers=H)
test("GET /users/me", s, 200, f"role={b.get('role')}")

s, b = req(BASE + "/users", headers=H)
test("GET /users", s, 200, f"count={len(b) if isinstance(b, list) else '?'}")

# ──────────────────────────────────────────────
# 3. Employees CRUD
# ──────────────────────────────────────────────
print("\n[EMPLOYEES]")
s, b = req(BASE + "/employees", headers=H)
test("GET /employees", s, 200, f"count={len(b) if isinstance(b, list) else '?'}")

import time
unique_id = int(time.time())
emp_payload = json.dumps({
    "first_name": "Django",
    "last_name": "TestUser",
    "email": f"django.testuser.{unique_id}@example.com",
    "department": "Engineering",
    "designation": "QA Engineer"
}).encode()
s, b = req(BASE + "/employees", "POST", emp_payload, H)
test("POST /employees", s, 201, f"id={b.get('employee_id')} name={b.get('first_name')}")
new_emp_id = b.get("employee_id")

s, b = req(BASE + f"/employees/{new_emp_id}", headers=H)
test(f"GET /employees/{new_emp_id}", s, 200, f"name={b.get('first_name')}")

# ──────────────────────────────────────────────
# 4. Tasks CRUD
# ──────────────────────────────────────────────
print("\n[TASKS]")
s, b = req(BASE + "/tasks", headers=H)
test("GET /tasks", s, 200, f"count={len(b) if isinstance(b, list) else '?'}")

task_payload = json.dumps({
    "task_title": "Django E2E Test Task",
    "task_description": "Automated end-to-end test task",
    "due_date": "2026-10-15",
    "employee_id": new_emp_id,
    "progress": 0
}).encode()
s, b = req(BASE + "/tasks", "POST", task_payload, H)
test("POST /tasks", s, 201, f"id={b.get('task_id')} progress={b.get('progress')}")
new_task_id = b.get("task_id")

s, b = req(BASE + f"/tasks/{new_task_id}", headers=H)
test(f"GET /tasks/{new_task_id}", s, 200, f"title={b.get('task_title')}")

# Update: mark in progress, set progress 50%
upd_payload = json.dumps({"status_id": 2, "progress": 50}).encode()
s, b = req(BASE + f"/tasks/{new_task_id}", "PUT", upd_payload, H)
test(f"PUT /tasks/{new_task_id} (in progress)", s, 200,
     f"progress={b.get('progress')} status_id={b.get('status_id')}")

# Update: mark completed, progress 100%
upd_payload2 = json.dumps({"status_id": 3, "progress": 100}).encode()
s, b = req(BASE + f"/tasks/{new_task_id}", "PUT", upd_payload2, H)
test(f"PUT /tasks/{new_task_id} (completed)", s, 200,
     f"progress={b.get('progress')} status_id={b.get('status_id')}")

# ──────────────────────────────────────────────
# 5. Dashboard
# ──────────────────────────────────────────────
print("\n[DASHBOARD]")
s, b = req(BASE + "/dashboard/summary", headers=H)
test("GET /dashboard/summary", s, 200,
     f"total={b.get('total_tasks')} completed={b.get('completed_tasks')}")

# ──────────────────────────────────────────────
# 6. Reports
# ──────────────────────────────────────────────
print("\n[REPORTS]")
s, b = req(BASE + "/reports", headers=H)
test("GET /reports", s, 200,
     f"total={b.get('summary', {}).get('total_tasks')}")

s, b = req(BASE + f"/reports?employee_id={new_emp_id}", headers=H)
test(f"GET /reports?employee_id={new_emp_id}", s, 200,
     f"total={b.get('summary', {}).get('total_tasks')}")

# ──────────────────────────────────────────────
# 7. Notifications
# ──────────────────────────────────────────────
print("\n[NOTIFICATIONS]")
s, b = req(BASE + "/notifications", headers=H)
test("GET /notifications", s, 200, f"count={len(b) if isinstance(b, list) else '?'}")

# ──────────────────────────────────────────────
# 8. Reminders
# ──────────────────────────────────────────────
print("\n[REMINDERS]")
s, b = req(BASE + "/reminders", headers=H)
test("GET /reminders", s, 200, f"count={len(b) if isinstance(b, list) else '?'}")

# ──────────────────────────────────────────────
# 9. Profile
# ──────────────────────────────────────────────
print("\n[PROFILE]")
s, b = req(BASE + "/profile", headers=H)
# Admin may not have an employee profile (404 is acceptable)
ok = s in (200, 404)
results.append(ok)
icon = "PASS" if ok else "FAIL"
print(f"  [{icon}] GET /profile: HTTP {s} (200 or 404 acceptable for admin)")

# ──────────────────────────────────────────────
# 10. Auth required (unauthenticated request should 401/403)
# ──────────────────────────────────────────────
print("\n[SECURITY]")
s, _ = req(BASE + "/tasks")
test("GET /tasks (no auth) -> 401/403", s in (401, 403), True, f"status={s}")

s, _ = req(BASE + "/employees")
test("GET /employees (no auth) -> 401/403", s in (401, 403), True, f"status={s}")

# ──────────────────────────────────────────────
# 11. Cleanup
# ──────────────────────────────────────────────
print("\n[CLEANUP]")
s, _ = req(BASE + f"/tasks/{new_task_id}", "DELETE", headers=H)
test(f"DELETE /tasks/{new_task_id}", s, 204)

s, _ = req(BASE + f"/employees/{new_emp_id}", "DELETE", headers=H)
test(f"DELETE /employees/{new_emp_id}", s, 204)

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
passed = sum(results)
total = len(results)
print(f"\n{'='*55}")
print(f"  RESULTS: {passed}/{total} tests passed")
if passed == total:
    print("  ALL TESTS PASSED (OK) - Django DRF backend fully operational")
else:
    print(f"  {total - passed} test(s) FAILED — check output above")
print(f"{'='*55}\n")
sys.exit(0 if passed == total else 1)
