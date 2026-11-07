/**
 * GOOGLE APPS SCRIPT FOR LAND MANUAL OF JHARKHAND
 * ------------------------------------------------
 * Instructions to connect Google Sheets with your Vercel Backend:
 * 
 * 1. Open Google Sheets (https://sheets.new) and create a new spreadsheet named: "Land Manual Orders"
 * 2. In Row 1, add these column headers:
 *    Col A: Timestamp | Col B: Order ID | Col C: Full Name | Col D: Phone/WhatsApp | Col E: Email | Col F: Format | Col G: Price | Col H: Address | Col I: Payment Method | Col J: Status
 * 3. In Google Sheets menu, click: Extensions -> Apps Script
 * 4. Delete any existing code, paste this entire file, and click "Save" (Floppy disk icon).
 * 5. Click "Deploy" (Blue button top-right) -> "New deployment"
 * 6. Select type: "Web app"
 *    - Description: "Order Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (Important!)
 * 7. Click "Deploy" and Authorize access.
 * 8. Copy the generated "Web App URL" (ends in /exec).
 * 9. Add this URL in your Vercel Project Settings -> Environment Variables as:
 *    Key: GOOGLE_SHEET_WEBHOOK_URL
 *    Value: <your-copied-url>
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var timestamp = data.timestamp || new Date().toISOString();
    var orderId = data.orderId || "N/A";
    var name = (data.customer && data.customer.name) || data.name || "";
    var phone = (data.customer && data.customer.phone) || data.phone || "";
    var email = (data.customer && data.customer.email) || data.email || "";
    var address = (data.customer && data.customer.address) || data.address || "";
    var format = (data.order && data.order.format) || data.format || "";
    var price = (data.order && data.order.price) || data.price || "";
    var paymentMethod = (data.order && data.order.paymentMethod) || data.paymentMethod || "COD / UPI";
    var status = (data.order && data.order.status) || "Confirmed";

    sheet.appendRow([
      timestamp,
      orderId,
      name,
      phone,
      email,
      format,
      price,
      address,
      paymentMethod,
      status
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", orderId: orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
