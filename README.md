# Vesting Buddy 🧮  
**Your AI-Powered Personal CFO for Employee Benefits**

Vesting Buddy helps employees stop leaving money on the table.

Every year, billions of dollars are lost due to unclaimed employer 401(k) matches, underutilized tax-advantaged accounts (HSA/FSA), and poor understanding of company benefits. Vesting Buddy bridges the gap between **complex financial documents** and **clear, actionable financial decisions**.

This project was built for the **Commit to Change: AI Agents Hackathon** under the **Financial Health** track, with a strong focus on **responsible, low-risk financial optimization** and **LLM observability using Opik**.

---

## 🚩 The Problem

Most employees:
- Don’t understand their company’s benefits handbook
- Misinterpret vesting schedules and match policies
- Fail to maximize “free money” like employer matches
- Feel overwhelmed by financial jargon and paperwork

Traditional financial tools focus on **budgeting or investing**, but ignore one of the **highest-ROI actions** available to employees:  
👉 *optimizing existing benefits they already have access to*

---

## 💡 The Solution: Vesting Buddy

Vesting Buddy acts as a **Personal CFO**, guiding users through their benefits with clarity and precision.

Users simply upload:
- Paystubs
- Company benefits handbooks (PDFs, docs)

Our **multi-agent system** then transforms messy financial data into a **3-step, personalized action plan** designed to:
- Capture missed employer matches
- Optimize tax-advantaged contributions
- Reduce high-interest debt before risky investing

No speculation. No hype. Just smart financial hygiene.

---

## 🧠 System Architecture (Multi-Agent)

### 1. Extract & Structure Agent
- Parses paystubs and benefits documents
- Converts unstructured text into a clean financial schema
- Identifies key parameters like match %, vesting timelines, contribution limits

### 2. Reason & Optimize Agent
- Analyzes structured data to identify **leaked value**
- Detects missed employer matches or underutilized accounts
- Applies rule-based financial logic (not speculation)

### 3. Strategy Execution Agent
- Generates a **clear, prioritized 3-step action plan**
- Explains *what to do*, *why it matters*, and *how to do it*
- Uses plain language to reduce financial overwhelm

---

## 📊 Why Opik (and How We Use It)

Opik is integrated as a **core evaluation and observability layer**, not just logging.

### What We Track with Opik:
- Accuracy of financial data extraction
- Correct identification of employer match policies
- Quality and clarity of generated action plans
- Consistency across multiple runs and prompt versions

### How We Use It:
- Evaluation datasets with known “correct” outcomes
- LLM-as-judge scoring for recommendation quality
- Experiment tracking across prompt and agent versions
- Dashboards showing improvement over iterations
- Optimizing the agent for better results

This allows us to **prove** that our system improves — not just claim it.

---

## 🛡️ Responsible Financial AI by Design

Vesting Buddy intentionally avoids:
- Stock picking
- Speculative investments
- High-risk financial advice

Instead, we prioritize:
- Employer benefits optimization
- Tax efficiency
- Debt reduction
- Sustainable financial habits

All recommendations are grounded in the **user’s actual documents**, not generic advice.

## 🚀 Future Extensions
- Human-in-the-loop validation for high-impact decisions
- Employer-specific benefit templates
- Notifications for vesting milestones
- Long-term habit tracking for contribution behavior

---

## 🏁 Final Note

Vesting Buddy isn’t trying to replace financial advisors.  
It’s solving a simpler, more urgent problem:

> **Helping people claim the money they already earned.**

That’s real financial health.
