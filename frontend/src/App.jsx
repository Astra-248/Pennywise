
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/expenses";
const BUDGET_API = "http://localhost:5000/api/budget";

const categories = ["Food", "Travel", "Bills", "Shopping", "Education", "Other"];

function getCurrentMonth() {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
}

function getToday() {
  const now = new Date();
  return now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");
}

function money(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(getToday());
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  const [activePage, setActivePage] = useState("Overview");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);

  async function loadExpenses() {
    try {
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load expenses");
      }

      setExpenses(data);
    } catch (error) {
      setMessage("Could not load expenses. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBudget(month) {
    try {
      const response = await fetch(
          BUDGET_API + "?month=" + encodeURIComponent(month)
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load budget");
      }

      setBudget(Number(data.amount) || 0);
      setBudgetInput(data.amount ? String(data.amount) : "");
    } catch (error) {
      setMessage("Could not load the budget. Check the backend.");
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    loadBudget(selectedMonth);
  }, [selectedMonth]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      if (Number.isNaN(expenseDate.getTime())) {
        return false;
      }

      const expenseMonth = expenseDate.getFullYear() + "-" +
          String(expenseDate.getMonth() + 1).padStart(2, "0");

      return expenseMonth === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  const monthlySpent = monthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
  );

  const remaining = budget - monthlySpent;
  const budgetPercent = budget > 0
      ? Math.min((monthlySpent / budget) * 100, 100)
      : 0;

  const categoryTotals = useMemo(() => {
    const totals = {};

    monthExpenses.forEach((expense) => {
      totals[expense.category] =
          (totals[expense.category] || 0) + Number(expense.amount);
    });

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  const highestCategory = categoryTotals.length > 0
      ? categoryTotals[0]
      : null;

  const currentDay = selectedMonth === getCurrentMonth()
      ? new Date().getDate()
      : new Date(
          Number(selectedMonth.slice(0, 4)),
          Number(selectedMonth.slice(5, 7)),
          0
      ).getDate();

  const dailyAverage = currentDay > 0 ? monthlySpent / currentDay : 0;

  const filteredExpenses = useMemo(() => {
    let result = [...monthExpenses];

    result = result.filter((expense) => {
      const matchesSearch =
          expense.title.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
          filterCategory === "All" || expense.category === filterCategory;

      const expenseDate = new Date(expense.date);
      const dateString =
          expenseDate.getFullYear() + "-" +
          String(expenseDate.getMonth() + 1).padStart(2, "0") + "-" +
          String(expenseDate.getDate()).padStart(2, "0");

      const matchesStart = !startDate || dateString >= startDate;
      const matchesEnd = !endDate || dateString <= endDate;

      return matchesSearch && matchesCategory && matchesStart && matchesEnd;
    });

    result.sort((a, b) => {
      if (sortOrder === "oldest") {
        return new Date(a.date) - new Date(b.date);
      }

      if (sortOrder === "highest") {
        return Number(b.amount) - Number(a.amount);
      }

      if (sortOrder === "lowest") {
        return Number(a.amount) - Number(b.amount);
      }

      return new Date(b.date) - new Date(a.date);
    });

    return result;
  }, [
    monthExpenses,
    search,
    filterCategory,
    startDate,
    endDate,
    sortOrder
  ]);

  function resetForm() {
    setTitle("");
    setAmount("");
    setCategory("Food");
    setDate(getToday());
    setEditId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!title.trim() || !amount || Number(amount) <= 0 || !date) {
      setMessage("Enter a title, positive amount and date.");
      return;
    }

    const expenseData = {
      title: title.trim(),
      amount: Number(amount),
      category,
      date
    };

    try {
      const url = editId ? API + "/" + editId : API;
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save expense");
      }

      const wasEditing = Boolean(editId);
      resetForm();
      setMessage(wasEditing ? "Expense updated successfully." : "Expense added successfully.");

      await loadExpenses();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleEdit(expense) {
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(new Date(expense.date).toISOString().slice(0, 10));
    setEditId(expense._id);
    setMessage("");
    setActivePage("Transactions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(API + "/" + id, {
        method: "DELETE"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete expense");
      }

      if (editId === id) {
        resetForm();
      }

      setMessage("Expense deleted successfully.");
      await loadExpenses();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveBudget(event) {
    event.preventDefault();
    setMessage("");

    if (!budgetInput || Number(budgetInput) <= 0) {
      setMessage("Enter a budget amount greater than zero.");
      return;
    }

    try {
      const response = await fetch(BUDGET_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          amount: Number(budgetInput)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save budget");
      }

      setBudget(Number(result.amount));
      setBudgetInput(String(result.amount));
      setMessage("Monthly budget saved successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function changePage(page) {
    setActivePage(page);
    setMessage("");
  }

  function renderExpenseForm() {
    return (
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">TRANSACTION DETAILS</p>
              <h2>{editId ? "Edit expense" : "Add an expense"}</h2>
            </div>
            {editId && (
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  Cancel edit
                </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Expense name
              <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Lunch with friends"
                  required
              />
            </label>

            <div className="form-row">
              <label>
                Amount (₹)
                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    required
                />
              </label>

              <label>
                Category
                <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                      <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Date
              <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
              />
            </label>

            <button className="primary-btn" type="submit">
              {editId ? "Save changes" : "Add expense"}
            </button>
          </form>
        </section>
    );
  }

  function renderTransactions(showForm) {
    return (
        <>
          {showForm && renderExpenseForm()}

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">YOUR MONEY, ACCOUNTED FOR</p>
                <h2>Transactions</h2>
                <p className="muted">
                  {filteredExpenses.length} matching transactions
                </p>
              </div>
            </div>

            <div className="filters">
              <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search expenses..."
                  aria-label="Search expenses"
              />

              <select
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                  aria-label="Filter by category"
              >
                <option value="All">All categories</option>
                {categories.map((item) => (
                    <option key={item}>{item}</option>
                ))}
              </select>

              <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  aria-label="Sort transactions"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>

              <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  aria-label="Start date"
                  title="Start date"
              />

              <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  aria-label="End date"
                  title="End date"
              />

              <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilterCategory("All");
                    setStartDate("");
                    setEndDate("");
                    setSortOrder("newest");
                  }}
              >
                Clear filters
              </button>
            </div>

            {loading ? (
                <div className="empty">
                  <h3>Loading transactions...</h3>
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">₹</div>
                  <h3>No matching expenses</h3>
                  <p>Try changing your filters or add a new expense.</p>
                </div>
            ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                    <tr>
                      <th>Expense</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredExpenses.map((expense) => (
                        <tr key={expense._id}>
                          <td className="expense-name">{expense.title}</td>
                          <td>
                                                <span className="category-tag">
                                                    {expense.category}
                                                </span>
                          </td>
                          <td>
                            {new Date(expense.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="amount-cell">
                            {money(expense.amount)}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                  className="edit-btn"
                                  onClick={() => handleEdit(expense)}
                              >
                                Edit
                              </button>
                              <button
                                  className="delete-btn"
                                  onClick={() => handleDelete(expense._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </section>
        </>
    );
  }

  function renderBudget() {
    return (
        <div className="content-grid">
          <section className="panel budget-panel">
            <p className="eyebrow">YOUR MONTHLY LIMIT</p>
            <h2>Set your student budget</h2>
            <p className="muted">
              Choose how much you can spend this month. Pennywise will
              compare your recorded expenses with your limit.
            </p>

            <form onSubmit={saveBudget}>
              <label>
                Budget month
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    required
                />
              </label>

              <label>
                Monthly budget (₹)
                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={budgetInput}
                    onChange={(event) => setBudgetInput(event.target.value)}
                    placeholder="e.g. 8000"
                    required
                />
              </label>

              <button className="primary-btn" type="submit">
                Save monthly budget
              </button>
            </form>
          </section>

          <section className="panel budget-status">
            <p className="eyebrow">BUDGET STATUS</p>
            <h2>{budget > 0 ? money(monthlySpent) : "Set a budget first"}</h2>

            {budget > 0 ? (
                <>
                  <p className="muted">of {money(budget)} planned this month</p>
                  <div className="progress-track">
                    <div
                        className={
                            "progress-fill " +
                            (monthlySpent > budget ? "over-budget" : "")
                        }
                        style={{ width: budgetPercent + "%" }}
                    />
                  </div>
                  <p className="progress-label">
                    {Math.round((monthlySpent / budget) * 100)}% used
                  </p>
                  <div className="budget-remaining">
                    <span>{remaining >= 0 ? "Still available" : "Over budget"}</span>
                    <strong className={remaining < 0 ? "danger-text" : ""}>
                      {money(Math.abs(remaining))}
                    </strong>
                  </div>
                  {monthlySpent >= budget && (
                      <p className="alert-message">
                        You've reached or exceeded your monthly budget.
                      </p>
                  )}
                  {monthlySpent >= budget * 0.8 && monthlySpent < budget && (
                      <p className="warning-message">
                        You've used at least 80% of your budget. Spend carefully.
                      </p>
                  )}
                </>
            ) : (
                <p className="muted">Your spending progress will appear here.</p>
            )}
          </section>
        </div>
    );
  }

  return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark">p.</span>
            <span>Pennywise</span>
          </div>

          <p className="sidebar-label">WORKSPACE</p>

          <nav className="sidebar-nav">
            <button
                className={activePage === "Overview" ? "nav-item active" : "nav-item"}
                onClick={() => changePage("Overview")}
            >
              <span className="nav-icon">⌂</span> Overview
            </button>
            <button
                className={activePage === "Transactions" ? "nav-item active" : "nav-item"}
                onClick={() => changePage("Transactions")}
            >
              <span className="nav-icon">↔</span> Transactions
            </button>
            <button
                className={activePage === "Budget" ? "nav-item active" : "nav-item"}
                onClick={() => changePage("Budget")}
            >
              <span className="nav-icon">◷</span> Budget planner
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <span className="note-symbol">✳</span>
              <p>Small choices today. More freedom tomorrow.</p>
            </div>
            <span className="sidebar-caption">PERSONAL FINANCE · 2026</span>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div>
              <span className="topbar-label">YOUR PERSONAL FINANCE SPACE</span>
              <h1>{activePage === "Overview" ? "Overview" :
                  activePage === "Transactions" ? "Transactions" : "Budget planner"}</h1>
            </div>

            <label className="month-picker">
              <span>MONTH</span>
              <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>
          </header>

          {message && (
              <div className="message" role="status">
                <span>{message}</span>
                <button onClick={() => setMessage("")} aria-label="Dismiss message">
                  ×
                </button>
              </div>
          )}

          {activePage === "Overview" && (
              <>
                <section className="welcome-row">
                  <div>
                    <p className="eyebrow">A CLEARER VIEW OF YOUR MONEY</p>
                    <h2>Make your money work for you.</h2>
                    <p className="muted">
                      Track the little things. Stay ready for the big things.
                    </p>
                  </div>
                  <button
                      className="primary-btn"
                      onClick={() => {
                        changePage("Transactions");
                        resetForm();
                      }}
                  >
                    + Add expense
                  </button>
                </section>

                <section className="stats-grid">
                  <article className="stat-card stat-primary">
                    <div className="stat-top">
                      <span>MONTHLY SPENDING</span>
                      <span className="stat-symbol">₹</span>
                    </div>
                    <h2>{money(monthlySpent)}</h2>
                    <p>{monthExpenses.length} expenses recorded</p>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>MONTHLY BUDGET</span>
                      <span className="stat-symbol">◷</span>
                    </div>
                    <h2>{budget > 0 ? money(budget) : "Not set"}</h2>
                    <p>{budget > 0 ? "Your spending limit" : "Set a limit to stay on track"}</p>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>{remaining < 0 ? "OVER BUDGET" : "LEFT TO SPEND"}</span>
                      <span className="stat-symbol">↗</span>
                    </div>
                    <h2 className={remaining < 0 ? "danger-text" : ""}>
                      {budget > 0 ? money(Math.abs(remaining)) : "—"}
                    </h2>
                    <p>{budget > 0 ? (remaining < 0 ? "Above your monthly limit" : "Available this month") : "Budget required for calculation"}</p>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>DAILY AVERAGE</span>
                      <span className="stat-symbol">⌁</span>
                    </div>
                    <h2>{money(dailyAverage)}</h2>
                    <p>Monthly spend divided by elapsed days</p>
                  </article>
                </section>

                {budget > 0 && (
                    <section className="panel overview-budget">
                      <div className="panel-heading">
                        <div>
                          <p className="eyebrow">BUDGET GUARD</p>
                          <h2>Your monthly progress</h2>
                        </div>
                        <strong>{Math.round((monthlySpent / budget) * 100)}%</strong>
                      </div>
                      <div className="progress-track">
                        <div
                            className={
                                "progress-fill " +
                                (monthlySpent > budget ? "over-budget" : "")
                            }
                            style={{ width: budgetPercent + "%" }}
                        />
                      </div>
                      <div className="progress-foot">
                        <span>{money(monthlySpent)} spent</span>
                        <span>{money(budget)} budget</span>
                      </div>
                      {monthlySpent >= budget && (
                          <p className="alert-message">
                            Your spending has reached or exceeded your budget.
                          </p>
                      )}
                      {monthlySpent >= budget * 0.8 && monthlySpent < budget && (
                          <p className="warning-message">
                            You've used at least 80% of your budget.
                          </p>
                      )}
                    </section>
                )}

                <div className="content-grid">
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <p className="eyebrow">WHERE IT GOES</p>
                        <h2>Spending by category</h2>
                      </div>
                    </div>

                    {categoryTotals.length === 0 ? (
                        <div className="empty compact-empty">
                          <p>No spending data for this month yet.</p>
                        </div>
                    ) : (
                        <div className="category-list">
                          {categoryTotals.map(([name, total]) => {
                            const percent = monthlySpent > 0
                                ? (total / monthlySpent) * 100
                                : 0;

                            return (
                                <div className="category-row" key={name}>
                                  <div className="category-row-top">
                                    <span>{name}</span>
                                    <strong>{money(total)}</strong>
                                  </div>
                                  <div className="progress-track category-track">
                                    <div
                                        className="progress-fill"
                                        style={{ width: percent + "%" }}
                                    />
                                  </div>
                                  <span className="category-percent">
                                                        {Math.round(percent)}% of monthly spending
                                                    </span>
                                </div>
                            );
                          })}
                        </div>
                    )}
                  </section>

                  <section className="panel insight-panel">
                    <p className="eyebrow">A QUICK INSIGHT</p>
                    {highestCategory ? (
                        <>
                          <span className="insight-mark">↗</span>
                          <h2>{highestCategory[0]} is your top category.</h2>
                          <p className="muted">
                            You spent {money(highestCategory[1])} on{" "}
                            {highestCategory[0].toLowerCase()} this month.
                          </p>
                        </>
                    ) : (
                        <>
                          <span className="insight-mark">✳</span>
                          <h2>Your money story starts here.</h2>
                          <p className="muted">
                            Add expenses to discover your spending patterns.
                          </p>
                        </>
                    )}

                    <button
                        className="secondary-btn"
                        onClick={() => changePage("Transactions")}
                    >
                      View transactions →
                    </button>
                  </section>
                </div>

                {renderTransactions(false)}
              </>
          )}

          {activePage === "Transactions" && renderTransactions(true)}

          {activePage === "Budget" && (
              <>
                <section className="welcome-row">
                  <div>
                    <p className="eyebrow">PLAN BEFORE YOU SPEND</p>
                    <h2>Give every rupee a purpose.</h2>
                    <p className="muted">
                      Your budget is saved by month and stays available after refresh.
                    </p>
                  </div>
                </section>
                {renderBudget()}
                <section className="panel budget-expenses">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">MONTHLY BREAKDOWN</p>
                      <h2>Spending summary</h2>
                    </div>
                  </div>
                  <div className="budget-summary-row">
                    <span>Total spent</span>
                    <strong>{money(monthlySpent)}</strong>
                  </div>
                  <div className="budget-summary-row">
                    <span>Budget</span>
                    <strong>{budget > 0 ? money(budget) : "Not set"}</strong>
                  </div>
                  <div className="budget-summary-row">
                    <span>Transactions</span>
                    <strong>{monthExpenses.length}</strong>
                  </div>
                  <div className="budget-summary-row">
                    <span>Highest spending category</span>
                    <strong>
                      {highestCategory
                          ? highestCategory[0] + " · " + money(highestCategory[1])
                          : "No expenses yet"}
                    </strong>
                  </div>
                </section>
              </>
          )}

          <footer className="app-footer">
            <span>PENNYWISE</span>
            <span>Spend mindfully. Save intentionally.</span>
          </footer>
        </main>
      </div>
  );
}

export default App;
