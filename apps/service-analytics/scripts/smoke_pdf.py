from app.services.pdf_receipt import generate_receipt_pdf

pdf, name = generate_receipt_pdf(
    receipt_number="RCPT-TEST",
    issued_at="2026-01-01T00:00:00Z",
    society_id="s1",
    snapshot_json='{"bill":{"title":"Maint","amount":1000,"currency":"INR"},"payment":{"amount":1000,"method":"UPI"}}',
)
assert name.endswith(".pdf")
assert pdf[:4] == b"%PDF"
print("ok", name, len(pdf))
