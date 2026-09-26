"""Rule-based society insights (AI-style summaries without external LLM)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class Insight:
    category: str
    title: str
    detail: str
    severity: str
    score: float


def generate_society_insights(metrics: dict) -> dict:
    society_id = metrics.get("society_id") or ""
    society_name = metrics.get("society_name") or "Society"
    period = metrics.get("period_label") or "current period"

    bills_total = int(metrics.get("bills_total") or 0)
    bills_paid = int(metrics.get("bills_paid") or 0)
    bills_overdue = int(metrics.get("bills_overdue") or 0)
    revenue_collected = float(metrics.get("revenue_collected") or 0)
    revenue_outstanding = float(metrics.get("revenue_outstanding") or 0)
    complaints_open = int(metrics.get("complaints_open") or 0)
    complaints_resolved = int(metrics.get("complaints_resolved") or 0)
    work_orders_open = int(metrics.get("work_orders_open") or 0)
    work_orders_completed = int(metrics.get("work_orders_completed") or 0)
    visitors_expected = int(metrics.get("visitors_expected") or 0)

    insights: list[Insight] = []

    collection_rate = (
        (bills_paid / bills_total) if bills_total > 0 else 1.0
    )
    if bills_total == 0:
        insights.append(
            Insight(
                "FINANCE",
                "No billing activity",
                f"No bills recorded for {period}. Issue maintenance bills to start collections.",
                "INFO",
                0.7,
            )
        )
    elif collection_rate >= 0.85:
        insights.append(
            Insight(
                "FINANCE",
                "Strong collections",
                f"{bills_paid}/{bills_total} bills paid ({collection_rate:.0%}). "
                f"Collected INR {revenue_collected:,.0f}.",
                "INFO",
                0.9,
            )
        )
    elif collection_rate >= 0.5:
        insights.append(
            Insight(
                "FINANCE",
                "Collections need follow-up",
                f"Only {collection_rate:.0%} of bills are paid. Outstanding ~ INR {revenue_outstanding:,.0f}.",
                "WARN",
                0.85,
            )
        )
    else:
        insights.append(
            Insight(
                "FINANCE",
                "Low collection rate",
                f"Paid ratio {collection_rate:.0%} with INR {revenue_outstanding:,.0f} outstanding. "
                "Prioritize reminders and partial-payment plans.",
                "CRITICAL",
                0.92,
            )
        )

    if bills_overdue > 0:
        insights.append(
            Insight(
                "RISK",
                "Overdue bills",
                f"{bills_overdue} bill(s) marked overdue. Escalate notices to affected flats.",
                "WARN" if bills_overdue < 5 else "CRITICAL",
                0.88,
            )
        )

    complaint_total = complaints_open + complaints_resolved
    if complaint_total > 0:
        resolve_rate = complaints_resolved / complaint_total
        if complaints_open >= 5:
            insights.append(
                Insight(
                    "OPERATIONS",
                    "Complaint backlog",
                    f"{complaints_open} open complaints ({resolve_rate:.0%} resolved historically). "
                    "Assign vendors via work orders.",
                    "WARN",
                    0.86,
                )
            )
        else:
            insights.append(
                Insight(
                    "OPERATIONS",
                    "Complaints under control",
                    f"{complaints_open} open / {complaints_resolved} resolved this window.",
                    "INFO",
                    0.75,
                )
            )

    wo_total = work_orders_open + work_orders_completed
    if wo_total > 0:
        if work_orders_open > work_orders_completed:
            insights.append(
                Insight(
                    "OPERATIONS",
                    "Work-order load high",
                    f"{work_orders_open} open vs {work_orders_completed} completed. "
                    "Accept quotes or reassign vendors.",
                    "WARN",
                    0.8,
                )
            )
        else:
            insights.append(
                Insight(
                    "OPERATIONS",
                    "Work orders progressing",
                    f"{work_orders_completed} completed with {work_orders_open} still open.",
                    "INFO",
                    0.78,
                )
            )

    if visitors_expected > 10:
        insights.append(
            Insight(
                "OPPORTUNITY",
                "Busy visitor period",
                f"{visitors_expected} expected visitors. Ensure guards have gate-pass QR verify ready.",
                "INFO",
                0.7,
            )
        )

    if not insights:
        insights.append(
            Insight(
                "INFO",
                "Quiet period",
                "Not enough signal yet — keep recording bills, complaints, and work orders.",
                "INFO",
                0.6,
            )
        )

    critical = sum(1 for i in insights if i.severity == "CRITICAL")
    warns = sum(1 for i in insights if i.severity == "WARN")
    if critical:
        summary = (
            f"{society_name}: {critical} critical insight(s) for {period} — "
            "focus on collections and overdue items first."
        )
    elif warns:
        summary = (
            f"{society_name}: {warns} area(s) need attention during {period}."
        )
    else:
        summary = (
            f"{society_name}: operations look healthy for {period}."
        )

    return {
        "society_id": society_id,
        "summary": summary,
        "insights": [
            {
                "category": i.category,
                "title": i.title,
                "detail": i.detail,
                "severity": i.severity,
                "score": i.score,
            }
            for i in insights
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model": "rules-v1",
    }
