// src/pages/Todos/TodoPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "../../components/layout/PageShell";
import Calendar from "../../components/calendar/Calendar";
import Toggle from "../../components/common/Toggle";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";

import {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodoComplete,
  deleteTodo,
} from "../../api/todosApi";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categoriesApi";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fmtKoreanDate(d) {
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

  // ====== 카테고리(API) ======
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [catAddOpen, setCatAddOpen] = useState(false);
  const [catNewName, setCatNewName] = useState("");

  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  // ====== 투두(API) ======
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState(""); // ✅ todos.content

  const [todos, setTodos] = useState([]);

  // 투두 인라인 수정(제목/메모/날짜/카테고리)
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState("");
  const [editingTodoMemo, setEditingTodoMemo] = useState("");
  const [editingTodoDue, setEditingTodoDue] = useState("");
  const [editingTodoCategoryId, setEditingTodoCategoryId] = useState("");

  // 삭제 모달
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTodoId, setConfirmTodoId] = useState(null);

  // 날짜 팝업(왼쪽 입력용)
  const [datePopOpen, setDatePopOpen] = useState(false);
  const popRef = useRef(null);

  // ====== 초기 로딩: categories + todos ======
  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        const [cats, ts] = await Promise.all([getCategories(), getTodos()]);
        if (!alive) return;

        setCategories(cats || []);
        setTodos(ts || []);
      } catch (e) {
        if (!alive) return;
        setCategories([]);
        setTodos([]);
      }
    }

    boot();
    return () => {
      alive = false;
    };
  }, []);

  // ====== marks(캘린더 표시용) ======
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
  return `선택된 주: ${(() => {
  const base = new Date(selectedDate);
  base.setHours(0, 0, 0, 0);

  // 일=0, 월=1, ... 토=6
  const day = base.getDay();

  // 선택된 날짜가 포함된 주의 "일요일"
  const sunday = new Date(base);
  sunday.setDate(sunday.getDate() - day);

  // 그 주의 "토요일"
  const saturday = new Date(sunday);
  saturday.setDate(saturday.getDate() + 6);

  const format = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  return `${format(sunday)}~${format(saturday)}`;
})()}`;


  }, [viewMode, selectedDate, weekStart, weekEnd]);

  const filteredTodos = useMemo(() => {
    const s = weekStart;
    const e = weekEnd;
    const dateIso = toISO(selectedDate);

    let list = todos;

    if (viewMode === "daily") {
      list = list.filter((t) => t.due_date === dateIso);
    } else {
      list = list.filter((t) => {
        if (!t.due_date) return false;
        return inRange(new Date(t.due_date), s, e);
      });
    }

    if (incompleteOnly) list = list.filter((t) => !t.is_completed);

    // 정렬: due_date ASC, id ASC
    list = [...list].sort((a, b) => {
      if ((a.due_date || "") < (b.due_date || "")) return -1;
      if ((a.due_date || "") > (b.due_date || "")) return 1;
      return a.id - b.id;
    });

    return list;
  }, [todos, viewMode, selectedDate, weekStart, weekEnd, incompleteOnly]);

  // ====== 카테고리 CRUD ======
  async function handleAddCategory() {
    const name = catNewName.trim();
    if (!name) return;

    try {
      const created = await createCategory(name);
      setCategories((prev) => [...prev, created]);
      setCatNewName("");
      setCatAddOpen(false);
      setCategoryId(String(created.id));
    } catch (e) {}
  }

  function startEditCategory(cat) {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  }

  async function saveEditCategory(catId) {
    const name = editingCatName.trim();
    if (!name) return;

    try {
      const updated = await updateCategory(catId, name);
      setCategories((prev) => prev.map((c) => (c.id === catId ? updated : c)));
      setEditingCatId(null);
      setEditingCatName("");
    } catch (e) {}
  }

  async function handleDeleteCategory(catId) {
    // ✅ DB는 ON DELETE SET NULL이라 todos는 남고 category_id만 NULL 됨
    try {
      await deleteCategory(catId);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      setTodos((prev) =>
        prev.map((t) => (t.category_id === catId ? { ...t, category_id: null } : t))
      );

      if (String(catId) === String(categoryId)) setCategoryId("");
      if (editingCatId === catId) {
        setEditingCatId(null);
        setEditingCatName("");
      }
    } catch (e) {}
  }

  // ====== 투두 CRUD ======
  async function handleAddTodo() {
    const t = title.trim();
    if (!t) return;

    try {
      const created = await createTodo({
        title: t,
        content: memo.trim() ? memo.trim() : null, // ✅ content
        due_date: toISO(selectedDate),
        category_id: categoryId ? Number(categoryId) : null,
      });

      setTodos((prev) => [created, ...prev]);
      setTitle("");
      setMemo("");
      setCategoryId("");
    } catch (e) {}
  }

  async function handleToggleComplete(todoId) {
    try {
      const updated = await toggleTodoComplete(todoId);
      setTodos((prev) => prev.map((t) => (t.id === todoId ? updated : t)));
    } catch (e) {}
  }

  function startEditTodo(todo) {
    setEditingTodoId(todo.id);
    setEditingTodoTitle(todo.title || "");
    setEditingTodoMemo(todo.content || "");
    setEditingTodoDue(todo.due_date || toISO(selectedDate));
    setEditingTodoCategoryId(todo.category_id ? String(todo.category_id) : "");
  }

  async function saveEditTodo(todoId) {
    const t = editingTodoTitle.trim();
    if (!t) return;
    if (!editingTodoDue) return;

    try {
      const updated = await updateTodo(todoId, {
        title: t,
        content: editingTodoMemo.trim() ? editingTodoMemo.trim() : null,
        due_date: editingTodoDue,
        category_id: editingTodoCategoryId ? Number(editingTodoCategoryId) : null,
      });

      setTodos((prev) => prev.map((x) => (x.id === todoId ? updated : x)));
      cancelEditTodo();
    } catch (e) {}
  }

  function cancelEditTodo() {
    setEditingTodoId(null);
    setEditingTodoTitle("");
    setEditingTodoMemo("");
    setEditingTodoDue("");
    setEditingTodoCategoryId("");
  }

  function askDelete(todoId) {
    setConfirmTodoId(todoId);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!confirmTodoId) return;

    try {
      await deleteTodo(confirmTodoId);
      setTodos((prev) => prev.filter((t) => t.id !== confirmTodoId));
    } catch (e) {
    } finally {
      setConfirmOpen(false);
      setConfirmTodoId(null);
    }
  }

  async function clearTodoCategory(todo) {
    // ✅ 할일은 남기고, 해당 할일의 category_id만 NULL
    try {
      const updated = await updateTodo(todo.id, {
        title: todo.title,
        content: todo.content ?? null,
        due_date: todo.due_date,
        category_id: null,
      });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } catch (e) {}
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
          <h2 className="todoCard__title">새 일정 추가하기</h2>

          <div className="todoForm">
            <div className="todoForm__group">
              <div className="todoForm__label">TO DO</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="할 일을 입력하세요…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTodo();
                }}
              />
            </div>

            <div className="todoForm__group">
              <div className="todoForm__label">Category</div>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCategory();
                      if (e.key === "Escape") {
                        setCatAddOpen(false);
                        setCatNewName("");
                      }
                    }}
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
                          onClick={() => handleDeleteCategory(cat.id)}
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

            {/* ✅ Memo(content) 입력칸 */}
            <div className="todoForm__group">
              <div className="todoForm__label">Memo</div>
              <textarea
                className="todoForm__textarea"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력하세요 (선택)…"
                rows={3}
              />
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

        {/* ✅ MIDDLE (가운데 상시 캘린더 유지) */}
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
          <h2 className="todoCard__title">Todo List</h2>

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

          <div className="taskTitle">{rightTitleText}</div>

          <div className="taskList">
            {filteredTodos.length === 0 ? (
              <div className="empty">No tasks.</div>
            ) : (
              filteredTodos.map((t) => {
                const cat = categories.find((c) => c.id === t.category_id);
                const isEditing = editingTodoId === t.id;

                return (
                  <div key={t.id} className={`taskItem ${t.is_completed ? "is-done" : ""}`}>
                    <label className="taskItem__check">
                      <input
                        type="checkbox"
                        checked={!!t.is_completed}
                        onChange={() => handleToggleComplete(t.id)}
                      />
                      <span />
                    </label>

                    <div className="taskItem__body">
                      {isEditing ? (
                        <div className="taskItem__editGrid">
                          <input
                            className="taskItem__edit"
                            value={editingTodoTitle}
                            onChange={(e) => setEditingTodoTitle(e.target.value)}
                            placeholder="제목"
                            autoFocus
                          />

                          <textarea
                            className="taskItem__editTextarea"
                            value={editingTodoMemo}
                            onChange={(e) => setEditingTodoMemo(e.target.value)}
                            placeholder="메모(선택)…"
                            rows={2}
                          />

                          <div className="taskItem__editRow">
                            <input
                              type="date"
                              className="taskItem__editDate"
                              value={editingTodoDue}
                              onChange={(e) => setEditingTodoDue(e.target.value)}
                            />

                            <select
                              className="taskItem__editSelect"
                              value={editingTodoCategoryId}
                              onChange={(e) => setEditingTodoCategoryId(e.target.value)}
                            >
                              {categoryOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="taskItem__editActions">
                            <button
                              type="button"
                              className="taskItem__iconBtn"
                              onClick={() => saveEditTodo(t.id)}
                              title="저장"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="taskItem__iconBtn"
                              onClick={cancelEditTodo}
                              title="취소"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 제목 */}
                          <button
                            type="button"
                            className="taskItem__titleBtn"
                            onClick={() => startEditTodo(t)}
                            title="클릭해서 수정"
                          >
                            {t.title}
                          </button>

                          {/* ✅ 메모(content) 제목 아래 작은 글씨 */}
                          {t.content ? <div className="taskItem__memo">{t.content}</div> : null}

                          <div className="taskItem__meta">
                            <span className="taskItem__date">{t.due_date}</span>

                            {cat ? (
                              <span className="taskItem__cat">
                                {cat.name}
                                {/* ✅ “할 일은 남기고 카테고리만 제거” */}
                                <button
                                  type="button"
                                  className="taskItem__catClear"
                                  onClick={() => clearTodoCategory(t)}
                                  title="이 할 일에서 카테고리 제거"
                                >
                                  ×
                                </button>
                              </span>
                            ) : (
                              <span className="taskItem__cat is-empty">No Category</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="taskItem__actions">
                      {!isEditing && (
                        <button
                          type="button"
                          className="taskItem__iconBtn"
                          onClick={() => startEditTodo(t)}
                          title="수정"
                        >
                          ✎
                        </button>
                      )}
                      <button
                        type="button"
                        className="taskItem__iconBtn"
                        onClick={() => askDelete(t.id)}
                        title="삭제"
                      >
                        🗑
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
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                취소
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
