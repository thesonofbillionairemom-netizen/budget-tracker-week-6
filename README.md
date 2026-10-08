# 💰 SpendWise

**A smart, interactive budget tracker built with vanilla JavaScript.**



## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [What Improved This Week](#what-improved-this-week)
- [How It Works](#how-it-works)
- [Assignment Requirements](#assignment-requirements)
- [Challenges and Solutions](#challenges-and-solutions)
- [Roadmap](#roadmap)
- [Author](#author)

---

## About

SpendWise helps people stay on top of their money. Set a monthly budget in Kenyan Shillings (KES), log expenses as they happen, and the dashboard updates instantly with your remaining balance, spending by category, insights and clear budget warnings.

It is built with **no frameworks and no libraries**: just HTML, CSS and JavaScript. Week 5 delivered the dashboard foundation. **Week 6 turns it into a fully interactive application.**

## Features

- ✅ **Budget tracking:** set a monthly budget and watch a live progress bar and remaining balance
- ✅ **Smart status feedback:** four states (on track, careful, danger, over budget) with colour-coded messages
- ✅ **Expense management:** add expenses with a name, amount, category and date, and delete with **Undo**
- ✅ **Filter and sort:** view by category, or sort by newest, oldest, highest or lowest amount
- ✅ **Spending by category:** coloured bars show where the money goes
- ✅ **Insights panel:** top category, largest expense, average spend and warnings
- ✅ **Form validation:** clear inline error messages instead of silent failures
- ✅ **Persistent data:** saved in `localStorage`, so it survives a page refresh
- ✅ **Dark mode:** a theme toggle that remembers your choice
- ✅ **Responsive and accessible:** works on phones and desktops, with keyboard and screen-reader support

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic elements, `<dialog>`) |
| Styling | CSS3 (Grid, Flexbox, custom properties, media queries) |
| Logic | JavaScript ES6+ (no frameworks) |
| Storage | Browser `localStorage` |

## Getting Started

No installation or build step is required.

### Prerequisites

- A modern web browser (Chrome, Edge, Firefox or Safari)
- Optional: [VS Code](https://code.visualstudio.com/) with the **Live Server** extension

### Installation

1. Clone the repository

```bash
   git clone https://github.com/thesonofbillionairemom-netizen/budget-tracker-week-6.git
```

2. Move into the project folder

```bash
   cd budget-tracker-week-6
```

3. Open `index.html` in your browser, or right-click it in VS Code and choose **Open with Live Server**

## Usage

1. Click **Set budget** and enter your monthly budget.
2. Fill in the **Add expense** form and submit it.
3. Watch the balance, progress bar, category bars and insights update.
4. Use the **filter** and **sort** controls to explore your spending.
5. Delete an expense with ✕. Click **Undo** in the notification if you change your mind.
6. Use the moon icon to switch between light and dark mode.

Your data is stored in your own browser. Clearing site data removes it.

## Project Structure

```
budget-tracker-week-6/
├── index.html    # Page structure, form and dialogs
├── style.css     # Styling, dark theme and responsive layout
├── script.js     # Data, logic, rendering and events
└── README.md
```

## What Improved This Week

Week 5 delivered a working foundation: a dashboard that totalled expenses and showed a balance. This week's improvements make it interactive.

- Replaced `prompt()` pop-ups with proper dialogs for the budget and profile
- Added form validation with inline error messages
- Added delete with Undo, a category filter and sort options
- Added a category breakdown and an insights panel
- Expanded the progress bar from two states to four
- Added `localStorage` persistence, a dark theme, toast notifications and empty states
- Removed the console-only summary so every result shows on the page

## How It Works

SpendWise keeps one source of truth, the `expenses` array, and redraws the page from it. Every interaction follows the same flow:

```
user action  →  event listener  →  update the data  →  render()  →  page updates
```

### Conditionals

`getStatus()` uses an `if / else if` chain to judge the budget and choose the message and bar colour:

```js
if (left < 0)        // over budget  -> red
else if (pct >= 90)  // danger       -> orange
else if (pct >= 70)  // careful      -> amber
else                 // on track     -> green
```

- `validateExpense()` rejects an empty name, an amount of 0 or less, and a future date
- `addExpense()` warns when a new expense pushes the user over budget
- The insights panel flags a category that takes more than half of all spending
- Empty states change depending on whether there are no expenses or no matches for a filter

### Arrays

All records live in one array of objects instead of separate variables:

```js
let expenses = [
  { id: "k3j9x", name: "Lunch", amount: 350, category: "Food", date: "2026-10-08" }
];
```

- `push()` adds a record and `splice()` removes one (and restores it on Undo)
- `sort()` orders the records for display
- A `CATEGORIES` array fills both dropdowns, so categories are defined in one place
- The array is saved to and loaded from `localStorage` as JSON

### Loops

- `for...of` totals spending (`totalSpent`) and groups it by category (`totalsByCategory`)
- A `for` loop walks the array backwards to build the visible list, so the newest entry comes first
- `for...of` creates one table row per expense, one bar per category and one line per insight
- Loops also find the largest expense and the top spending category

### DOM updates

One `render()` function calls `renderSummary()`, `renderTable()`, `renderBreakdown()`, `renderInsights()` and `renderProfile()`.

- Elements are built with `document.createElement()` and filled with `textContent`, never `innerHTML`, so user input cannot inject HTML
- `replaceChildren()` clears the table before each redraw, which prevents duplicate rows
- The progress bar's `style.width` and CSS classes change with the budget status
- `dataset.theme` on the `<html>` element switches the page between light and dark

### Events

| Event | What happens |
|---|---|
| `submit` on the expense form | Validate, add to the array, re-render, show a toast |
| `click` on the table body | Event delegation: one listener handles every delete button |
| `change` on filter and sort | Re-render the table with the new view |
| `submit` on the budget and profile dialogs | Validate, save, re-render |
| `input` on form fields | Clear that field's error as the user fixes it |
| `click` on the theme button | Switch theme and save the choice |
| `click` on Clear all and Undo | Remove all data after confirming, or restore a deleted expense |

## Assignment Requirements

- ✅ Makes decisions using conditional statements
- ✅ Stores multiple expense records using arrays
- ✅ Processes records using loops
- ✅ Updates dashboard content dynamically with DOM manipulation
- ✅ Responds to user interactions with event listeners
- ✅ Displays information directly on the webpage, not just the console
- ✅ Shows a clear flow from user actions to application updates

## Challenges and Solutions

1. **Duplicate table rows.** Each redraw added rows on top of the old ones. Clearing the table body with `replaceChildren()` before drawing fixed it.
2. **Handling many delete buttons.** Attaching a listener to every row got messy. Event delegation on the table body handled all of them with one listener.
3. **Wrong default date.** `new Date().toISOString()` uses UTC, which shows yesterday's date in Kenya in the early morning. I built the date from local time instead.
4. **Losing data on refresh.** Saving the array to `localStorage` after every change, and loading it on start, solved this.

## Roadmap

- [ ] Monthly budgets and month-by-month history
- [ ] Export expenses to CSV
- [ ] Charts for spending trends
- [ ] Edit an existing expense

## Author

**ABDIWALI(Amiir) ABDI**

- GitHub: [@thesonofbillionairemom-netizen](https://github.com/thesonofbillionairemom-netizen)

Built for the Week 6 assignment, "Make SpendWise Interactive".