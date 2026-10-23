const sample = {
  propertyName: "Maple Court",
  tenantName: "Avery Stone",
  tenantEmail: "avery@example.com",
  unit: "2B",
  category: "maintenance_request",
  message: "Kitchen sink is leaking under the cabinet.",
  captchaWidgetRecordId: "demo-widget-record",
  captchaToken: "demo-token",
  idempotencyKey: "maintenance-maple-2b-0001"
};

const response = await fetch("http://localhost:3000/submissions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(sample)
});

console.log(response.status);
console.log(await response.text());
