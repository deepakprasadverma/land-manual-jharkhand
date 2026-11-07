// Vercel Serverless Function: api/order.js
// Handles order creation, database/Google Sheet logging, and instant delivery URLs

export default async function handler(req, res) {
    // Set CORS headers so API can be called safely
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    }

    try {
        const { name, phone, email, address, format, price, paymentMethod = 'COD / UPI' } = req.body || {};

        // Validation
        if (!name || !phone || !email || !format) {
            return res.status(400).json({
                success: false,
                error: 'Please provide all required fields: name, phone, email, and format.'
            });
        }

        // Generate a clean professional Order ID
        const timestamp = new Date().toISOString();
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const orderId = `LMJ-${new Date().getFullYear()}-${randomNum}`;

        // Format specific response details
        let deliveryInfo = {};
        if (format === 'ebook') {
            deliveryInfo = {
                type: 'digital_download',
                downloadUrl: 'https://github.com/deepakprasadverma/land-manual-jharkhand/releases/download/v1.0/Land_Manual_Jharkhand_Sample.pdf',
                instructions: 'Your download link is ready. A copy has also been scheduled for your email.'
            };
        } else if (format === 'audiobook') {
            deliveryInfo = {
                type: 'audio_stream',
                streamUrl: 'https://github.com/deepakprasadverma/land-manual-jharkhand',
                instructions: 'Audio chapters are ready for streaming on your mobile/PC.'
            };
        } else {
            deliveryInfo = {
                type: 'physical_shipping',
                shippingEstimate: '3-5 business days across Jharkhand & India',
                trackingNote: 'Courier tracking ID will be sent to your WhatsApp number within 24 hours.'
            };
        }

        const orderRecord = {
            orderId,
            timestamp,
            customer: {
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim(),
                address: (address || 'Digital Edition - No Shipping Required').trim()
            },
            order: {
                format,
                price: price || (format === 'ebook' ? '₹349' : format === 'audiobook' ? '₹499' : '₹699'),
                paymentMethod,
                status: 'Confirmed'
            },
            deliveryInfo
        };

        // Forward to Google Sheets if WEBHOOK URL environment variable is set
        const googleSheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
        if (googleSheetWebhook) {
            try {
                await fetch(googleSheetWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderRecord)
                });
            } catch (err) {
                console.error('Google Sheet forwarding error:', err.message);
                // We do not fail the customer order if spreadsheet logging experiences network latency
            }
        }

        // Return successful order confirmation
        return res.status(200).json({
            success: true,
            message: 'Order created and registered successfully!',
            data: orderRecord
        });

    } catch (error) {
        console.error('Server error processing order:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error processing your order. Please try again.'
        });
    }
}
