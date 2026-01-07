// src/pages/Todos/TodoPage.jsx
import { useMemo, useRef, useState } from "react";
import PageShell from "../../components/layout/PageShell";
import Calendar from "../../components/calendar/Calendar";
import Toggle from "../../components/common/Toggle";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fmtKoreanDate(d) {
  // January 6th, 2026 느낌으로: 레퍼런스는 영어 표시라서 그대로 유지
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function startOfWeekSunday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeekSaturday(date) {
  const s = startOfWeekSunday(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return e;
}
function inRange(d, s, e) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const a = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
  const b = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
  return x >= a && x <= b;
}

export default function TodoPage() {
  // ====== UI 상태 ======
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date()); // 캘린더 표시 월

  const [viewMode, setViewMode] = useState("weekly"); // "daily" | "weekly"
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  // ====== 카테고리(로컬) ======
  const [categories, setCategories] = useState([
    { id: 1, name: "Shopping" },
    { id: 2, name: "Study" },
  ]);
  const [categoryId, setCategoryId] = useState("");
  const [catAddOpen, setCatAddOpen] = useState(false);
  const [catNewName, setCatNewName] = useState("");

  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  // ====== 투두(로컬) ======
  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState([
    // 데모 데이터: 없으면 화면이 너무 텅 비어서 1~2개만 깔아둠
    {
      id: 101,
      title: "장보기 목록 작성",
      category_id: 1,
      due_date: toISO(new Date()),
      is_completed: false,
    },
  ]);

  // 투두 인라인 수정
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState("");

  // 삭제 모달
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTodoId, setConfirmTodoId] = useState(null);

  // 날짜 팝업
  const [datePopOpen, setDatePopOpen] = useState(false);
  const popRef = useRef(null);

  // ====== marks(캘린더 회색 표시용) ======
  const marks = useMemo(() => {
    const s = new Set();
    todos.forEach((t) => {
      if (t.due_date) s.add(t.due_date);
    });
    return s;
  }, [todos]);

  // ====== 오른쪽 리스트 계산 ======
  const weekStart = useMemo(() => startOfWeekSunday(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => endOfWeekSaturday(selectedDate), [selectedDate]);

  const rightTitleText = useMemo(() => {
    if (viewMode === "daily") {
      return `선택한 날짜: ${fmtKoreanDate(selectedDate)}`;
    }
    return `Showing tasks for week: ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${weekEnd.getFullYear()}`;
  }, [viewMode, selectedDate, weekStart, weekEnd]);

  const filteredTodos = useMemo(() => {
    const s = weekStart;
    const e = weekEnd;
    const dateIso = toISO(selectedDate);

    let list = todos;

    if (viewMode === "daily") {
      list = list.filter((t) => t.due_date === dateIso);
    } else {
      list = list.filter((t) => inRange(new Date(t.due_date), s, e));
    }

    if (incompleteOnly) {
      list = list.filter((t) => !t.is_completed);
    }

    // 정렬: due_date ASC, id ASC
    list = [...list].sort((a, b) => {
      if (a.due_date < b.due_date) return -1;
      if (a.due_date > b.due_date) return 1;
      return a.id - b.id;
    });

    return list;
  }, [todos, viewMode, selectedDate, weekStart, weekEnd, incompleteOnly]);

  // ====== 액션들 ======
  function handleAddCategory() {
    const name = catNewName.trim();
    if (!name) return;

    const nextId = Math.max(0, ...categories.map((c) => c.id)) + 1;
    const newCat = { id: nextId, name };
    setCategories((prev) => [...prev, newCat]);
    setCatNewName("");
    setCatAddOpen(false);

    // 방금 추가한 카테고리 선택까지
    setCategoryId(String(newCat.id));
  }

  function startEditCategory(cat) {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  }

  function saveEditCategory(catId) {
    const name = editingCatName.trim();
    if (!name) return;

    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, name } : c)));
    setEditingCatId(null);
    setEditingCatName("");
  }

  function deleteCategory(catId) {
    // 카테고리 삭제하면 해당 카테고리 달린 투두는 category_id null 처리(프론트만)
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    setTodos((prev) => prev.map((t) => (t.category_id === catId ? { ...t, category_id: null } : t)));

    if (String(catId) === String(categoryId)) setCategoryId("");
    if (editingCatId === catId) {
      setEditingCatId(null);
      setEditingCatName("");
    }
  }

  function handleAddTodo() {
    const t = title.trim();
    if (!t) return;

    const newTodo = {
      id: Date.now(),
      title: t,
      category_id: categoryId ? Number(categoryId) : null,
      due_date: toISO(selectedDate),
      is_completed: false,
    };

    setTodos((prev) => [newTodo, ...prev]);
    setTitle("");
  }

  function toggleComplete(todoId) {
    setTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, is_completed: !t.is_completed } : t))
    );
  }

  function startEditTodo(todo) {
    setEditingTodoId(todo.id);
    setEditingTodoTitle(todo.title);
  }

  function saveEditTodo(todoId) {
    const t = editingTodoTitle.trim();
    if (!t) return;
    setTodos((prev) => prev.map((x) => (x.id === todoId ? { ...x, title: t } : x)));
    setEditingTodoId(null);
    setEditingTodoTitle("");
  }

  function askDelete(todoId) {
    setConfirmTodoId(todoId);
    setConfirmOpen(true);
  }

  function confirmDelete() {
    setTodos((prev) => prev.filter((t) => t.id !== confirmTodoId));
    setConfirmOpen(false);
    setConfirmTodoId(null);
  }

  // ====== 렌더 ======
  const categoryOptions = useMemo(() => {
    return [
      { value: "", label: "카테고리 선택" },
      ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ];
  }, [categories]);

  const selectedDateText = fmtKoreanDate(selectedDate);

  return (
    <PageShell title="Task Manager" subtitle="Plan your tasks and stay organized">
      <div className="todoBoard">
        {/* LEFT */}
        <section className="todoCard">
          <h2 className="todoCard__title">Add New Task</h2>

          <div className="todoForm">
            <div className="todoForm__group">
              <div className="todoForm__label">TO DO</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="할 일을 입력하세요…"
              />
            </div>

            <div className="todoForm__group">
              <div className="todoForm__label">Category</div>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>

              <button
                type="button"
                className="ghostBtn"
                onClick={() => setCatAddOpen((v) => !v)}
              >
                + 카테고리 추가
              </button>

              {catAddOpen && (
                <div className="inlineAdd">
                  <Input
                    value={catNewName}
                    onChange={(e) => setCatNewName(e.target.value)}
                    placeholder="카테고리 이름 입력"
                  />
                  <Button variant="primary" onClick={handleAddCategory}>
                    추가
                  </Button>
                </div>
              )}
            </div>

            <div className="todoForm__group">
              <div className="todoForm__label">Manage Categories</div>

              <div className="chipBox">
                {categories.map((cat) => {
                  const isEditing = editingCatId === cat.id;

                  return (
                    <div key={cat.id} className="chip">
                      {isEditing ? (
                        <input
                          className="chip__input"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditCategory(cat.id);
                            if (e.key === "Escape") {
                              setEditingCatId(null);
                              setEditingCatName("");
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="chip__text">{cat.name}</span>
                      )}

                      <div className="chip__actions">
                        {isEditing ? (
                          <button
                            type="button"
                            className="chip__icon"
                            onClick={() => saveEditCategory(cat.id)}
                            aria-label="save"
                            title="저장"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="chip__icon"
                            onClick={() => startEditCategory(cat)}
                            aria-label="edit"
                            title="수정"
                          >
                            ✎
                          </button>
                        )}
                        <button
                          type="button"
                          className="chip__icon chip__icon--danger"
                          onClick={() => deleteCategory(cat.id)}
                          aria-label="delete"
                          title="삭제"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="todoForm__group">
              <div className="todoForm__label">Date</div>

              <div className="dateField" ref={popRef}>
                <button
                  type="button"
                  className="dateField__input"
                  onClick={() => setDatePopOpen((v) => !v)}
                >
                  {selectedDateText}
                </button>

                {datePopOpen && (
                  <div className="datePop">
                    <Calendar
                      compact
                      value={selectedDate}
                      onChange={(d) => {
                        setSelectedDate(d);
                        setMonth(d);
                        setDatePopOpen(false);
                      }}
                      month={month}
                      onMonthChange={setMonth}
                      marks={marks}
                    />
                  </div>
                )}
              </div>
            </div>

            <button type="button" className="primaryBig" onClick={handleAddTodo}>
              <span className="primaryBig__plus">＋</span>
              할일 저장하기
            </button>
          </div>
        </section>

        {/* MIDDLE */}
        <section className="todoCard">
          <h2 className="todoCard__title">Calendar</h2>

          <div className="calendarWrap">
            <Calendar
              value={selectedDate}
              onChange={(d) => setSelectedDate(d)}
              month={month}
              onMonthChange={setMonth}
              marks={marks}
            />
          </div>
        </section>

        {/* RIGHT */}
        <section className="todoCard">
          <h2 className="todoCard__title">Tasks</h2>

          <div className="taskToolbar">
            <div className="seg">
              <button
                type="button"
                className={`seg__btn ${viewMode === "daily" ? "is-on" : ""}`}
                onClick={() => setViewMode("daily")}
              >
                Daily
              </button>
              <button
                type="button"
                className={`seg__btn ${viewMode === "weekly" ? "is-on" : ""}`}
                onClick={() => setViewMode("weekly")}
              >
                Weekly
              </button>
            </div>

            <Toggle
              label="미완료"
              checked={incompleteOnly}
              onChange={setIncompleteOnly}
              offText="OFF"
              onText="ON"
            />
          </div>

          <div className="taskHint">{rightTitleText}</div>

          <div className="taskList">
            {filteredTodos.length === 0 ? (
              <div className="taskEmpty">
                {viewMode === "weekly" ? "No tasks for this week" : "No tasks for this day"}
              </div>
            ) : (
              filteredTodos.map((t) => {
                const cat = categories.find((c) => c.id === t.category_id);
                const isEditing = editingTodoId === t.id;

                return (
                  <div key={t.id} className={`taskItem ${t.is_completed ? "is-done" : ""}`}>
                    <label className="taskItem__check">
                      <input
                        type="checkbox"
                        checked={t.is_completed}
                        onChange={() => toggleComplete(t.id)}
                      />
                      <span />
                    </label>

                    <div className="taskItem__body">
                      <div className="taskItem__top">
                        {isEditing ? (
                          <input
                            className="taskItem__edit"
                            value={editingTodoTitle}
                            onChange={(e) => setEditingTodoTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditTodo(t.id);
                              if (e.key === "Escape") {
                                setEditingTodoId(null);
                                setEditingTodoTitle("");
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            className="taskItem__titleBtn"
                            onClick={() => startEditTodo(t)}
                            title="클릭해서 제목 수정"
                          >
                            {t.title}
                          </button>
                        )}
                      </div>

                      <div className="taskItem__meta">
                        <span className="taskItem__date">{t.due_date}</span>
                        {cat ? <span className="taskItem__cat">{cat.name}</span> : null}
                      </div>
                    </div>

                    <div className="taskItem__actions">
                      {isEditing ? (
                        <button
                          type="button"
                          className="miniBtn"
                          onClick={() => saveEditTodo(t.id)}
                        >
                          저장
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="miniBtn miniBtn--danger"
                        onClick={() => askDelete(t.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* 삭제 확인 모달 */}
      {confirmOpen && (
        <div className="modal">
          <div className="modal__backdrop" onClick={() => setConfirmOpen(false)} />
          <div className="modal__card">
            <h3 className="modal__title">정말 삭제하시겠습니까?</h3>
            <p className="modal__text">삭제하면 되돌릴 수 없습니다.</p>
            <div className="modal__actions">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                아니오
              </Button>
              <Button variant="primary" onClick={confirmDelete}>
                네
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
