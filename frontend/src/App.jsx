
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/expenses";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(
      new Date().toISOString().slice(0, 10)
  );
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  async function loadExpenses() {
    try {
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load expenses");
      }

      setExpenses(data);
    } catch (error) {
      setMessage("Could not load expenses. Check the backend.");
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  const total = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
  );

  function resetForm() {
    setTitle("");
    setAmount("");
    setCategory("Food");
    setDate(new Date().toISOString().slice(0, 10));
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
      const url = editId ? `${API}/${editId}` : API;
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

      resetForm();
      setMessage(editId ? "Expense updated." : "Expense added.");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete expense");
      }

      if (editId === id) {
        resetForm();
      }

      setMessage("Expense deleted.");
      await loadExpenses();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
      <main className="app">
        <header className="topbar">
          <div className="brand">Pennywise</div>
          <span>PERSONAL FINANCE</span>
        </header>

        <section className="intro">
          <p className="eyebrow">YOUR MONEY, IN FOCUS</p>
          <h1>Expense Tracker</h1>
          <p>Track your spending. Make every rupee count.</p>
        </section>

        <section className="summary">
          <div>
            <p>Total Amount Spent</p>
            <h2>₹{total.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</h2>
            <span>{expenses.length} recorded expenses</span>
          </div>
          <div className="summary-icon">₹</div>
        </section>

        <section className="panel">
          <h2>{editId ? "Edit Expense" : "Add an Expense"}</h2>

          <form onSubmit={handleSubmit}>
            <label>
              Title
              <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Lunch"
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
                  <option>Food</option>
                  <option>Travel</option>
                  <option>Bills</option>
                  <option>Shopping</option>
                  <option>Other</option>
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

            <div className="form-actions">
              <button type="submit">
                {editId ? "Save Changes" : "Add Expense"}
              </button>

              {editId && (
                  <button type="button" className="cancel-btn"
                          onClick={resetForm}>
                    Cancel
                  </button>
              )}
            </div>
          </form>

          {message && <p className="message" role="status">{message}</p>}
        </section>

        <section className="panel expense-panel">
          <div className="list-heading">
            <div>
              <h2>Recent Expenses</h2>
              <p>Your recorded transactions</p>
            </div>
            <span className="count">{expenses.length} total</span>
          </div>

          {expenses.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">₹</div>
                <h3>No expenses yet</h3>
                <p>Add your first expense using the form above.</p>
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
                  {expenses.map((expense) => (
                      <tr key={expense._id}>
                        <td>{expense.title}</td>
                        <td>
                                            <span className="category">
                                                {expense.category}
                                            </span>
                        </td>
                        <td>
                          {new Date(expense.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="amount">
                          ₹{Number(expense.amount).toFixed(2)}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="edit-btn"
                                    onClick={() => handleEdit(expense)}>
                              Edit
                            </button>
                            <button className="delete-btn"
                                    onClick={() => handleDelete(expense._id)}>
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

        <footer>Spend mindfully. Save intentionally.</footer>
      </main>
  );
}

export default App;
