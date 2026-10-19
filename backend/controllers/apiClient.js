const express = require('express');
const jwt = require('jsonwebtoken');
const Client = require('android-sms-gateway').default;
const History = require('../models/History');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "access denied" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "access denied" });

    try {
        const verified = jwt.verify(token, process.env.SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid token" });
    }
};

const httpFetchClient = {
    get: async (url, headers) => {
        const response = await fetch(url, { method: "GET", headers });
        return response.json();
    },
    post: async (url, body, headers) => {
        const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Phone rejected the request");
        return data;
    },
    delete: async (url, headers) => {
        const response = await fetch(url, { method: "DELETE", headers });
        return response.json();
    }
};

module.exports = () => {
    // REMOVED the Local IP. It will now default to the Cloud API.
    const apiClient = new Client(
        process.env.SMS_GATEWAY_LOGIN,
        process.env.SMS_GATEWAY_PASSWORD,
        httpFetchClient
    );

    const apiRouter = express.Router();

    apiRouter.post('/send-sms', authMiddleware, async (req, res) => {
        const { phoneNumbers, message, broadcastType } = req.body;

        if (!phoneNumbers || phoneNumbers.length === 0) {
            return res.status(400).json({ error: 'No recipients selected.' });
        }

        try {
            const payload = {
                message: message,
                phoneNumbers: phoneNumbers,
                simNumber: parseInt(process.env.SIM_NUMBER) || 1
            };

            // Send to phone
            const response = await apiClient.send(payload);

            // ONLY save to DB if the request was successful
            const historyRecord = new History({
                broadcastType: broadcastType || 'Manual',
                phoneNumbers: phoneNumbers,
                message: message,
                messageId: response.id || 'N/A', 
                createdBy: req.user.username || 'Admin',
                status: 'Sent'
            });
            await historyRecord.save();

            res.status(200).json({ success: true, data: historyRecord });
        } catch (error) {
            console.error('❌ Error sending SMS:', error);
            // DO NOT save to history here. Just send the error back.
            res.status(500).json({ error: 'Failed to send SMS', details: error.message });
        }
    });

    return apiRouter;
};