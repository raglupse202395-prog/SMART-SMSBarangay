const routes = require('express').Router()
const Admin = require('../models/User')
const Resident = require('../models/resident')
const History = require('../models/History')
const Request = require('../models/DocumentRequest')
const BroadcastTemplate = require('../models/BroadcastTemplate');
const AdminActionHistory = require('../models/AdminActionHistory');
const Household = require('../models/Household');
const HouseholdAudit = require('../models/HouseholdAudit');
const nodemailer = require('nodemailer');
const Client = require('android-sms-gateway').default;
require('dotenv').config();

const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");

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

routes.get('/api/admin/verify-token', authMiddleware, (req, res) => {
    res.status(200).json({ valid: true });
});

const requireRole = (role) => (req, res, next) => {
    if (!req.user || !req.user.userId) return res.status(401).json({ error: 'Unauthorized' });
    Admin.findById(req.user.userId).then(user => {
        if (!user || user.role !== role) {
            return res.status(403).json({ error: 'Forbidden: Insufficient role' });
        }
        next();
    }).catch(() => res.status(500).json({ error: 'Server error' }));
};

const requireAnyRole = (roles) => (req, res, next) => {
    if (!req.user || !req.user.userId) return res.status(401).json({ error: 'Unauthorized' });
    Admin.findById(req.user.userId).then(user => {
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient role' });
        }
        next();
    }).catch(() => res.status(500).json({ error: 'Server error' }));
};

routes.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body
        const currentUser = await Admin.findOne({ username })

        if (!currentUser) return res.status(400).json({ error: "USER NOT FOUND" })

        // --- TEMPORARY BYPASS FOR TESTING ---
        const isMatch = true; 
        // ------------------------------------

        if (!isMatch) return res.status(400).json({ error: 'INVALID CREDS!' })

        const token = jwt.sign({
            userId: currentUser._id,
            role: currentUser.role,
            fullname: currentUser.fullname,
            username: currentUser.username
        }, process.env.SECRET_KEY, { expiresIn: "8h" });

        res.json({ token, role: currentUser.role, username: currentUser.username, fullname: currentUser.fullname })
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

routes.delete('/api/resident/delete/:id', authMiddleware, requireRole('superadmin'), async (req, res) => {
    try {
        const residentId = req.params.id;
        const resident = await Resident.findById(residentId);
        if (!resident) return res.status(404).json({ message: 'Resident not found' });

        await Resident.findByIdAndDelete(residentId);

        if (req.user && req.user.userId && req.user.username) {
            await AdminActionHistory.create({
                adminId: req.user.userId,
                adminUsername: req.user.username,
                action: 'deleted resident',
                target: residentId,
                details: {
                    residentId,
                    fullName: `${resident.first_name} ${resident.middle_name ? resident.middle_name + ' ' : ''}${resident.last_name} ${resident.suffix || ''}`.trim(),
                    phoneNumber: resident.contact?.phone || 'N/A'
                }
            });
        }

        res.json({ message: 'Resident deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

routes.post('/api/resident/register', authMiddleware, async (req, res) => {
    try {
        const newResident = new Resident(req.body);
        await newResident.save();

        if (req.user && req.user.userId && req.user.username) {
            await AdminActionHistory.create({
                adminId: req.user.userId,
                adminUsername: req.user.username,
                action: 'created resident',
                target: newResident._id,
                details: {
                    residentId: newResident._id,
                    fullName: `${newResident.first_name} ${newResident.middle_name ? newResident.middle_name + ' ' : ''}${newResident.last_name} ${newResident.suffix || ''}`.trim(),
                    phoneNumber: newResident.contact?.phone || 'N/A'
                }
            });
        }

        res.status(201).json(newResident);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

routes.get('/api/resident/all', authMiddleware, async (req, res) => {
    try {
        const residents = await Resident.find().populate('householdId');
        res.status(200).json(residents);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

routes.put('/api/resident/update/:id', authMiddleware, async (req, res) => {
    try {
        const residentId = req.params.id;
        const existingResident = await Resident.findById(residentId);
        if (!existingResident) return res.status(404).json({ message: 'Resident not found' });

        const updatedResident = await Resident.findByIdAndUpdate(
            residentId,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (req.user && req.user.userId && req.user.username) {
            await AdminActionHistory.create({
                adminId: req.user.userId,
                adminUsername: req.user.username,
                action: 'updated resident',
                target: residentId,
                details: {
                    residentId,
                    fullName: `${updatedResident.first_name} ${updatedResident.last_name}`,
                    phoneNumber: updatedResident.contact?.phone || 'N/A'
                }
            });
        }

        res.status(200).json(updatedResident);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

routes.get('/api/history/getall', authMiddleware, async (req, res) => {
    try {
        const history = await History.find()
            .select('phoneNumbers message messageId status createdAt broadcastType')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

routes.delete('/api/history/delete/:id', authMiddleware, async (req, res) => {
    try {
        const historyId = req.params.id;
        const record = await History.findById(historyId);
        
        if (!record) {
            return res.status(404).json({ message: 'Broadcast history not found' });
        }

        await History.findByIdAndDelete(historyId);

        if (req.user && req.user.userId && req.user.username) {
            await AdminActionHistory.create({
                adminId: req.user.userId,
                adminUsername: req.user.username,
                action: 'deleted broadcast history',
                target: historyId,
                details: {
                    message: record.message,
                    recipients: record.phoneNumbers.length
                }
            });
        }

        res.json({ message: 'Broadcast history deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Email helpers ---
async function sendApprovalEmail(email, fullName, documentType, approvalDetails) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });
    const emailContent = `
Dear ${fullName},

Good news! Your document request has been APPROVED.

Document Details:
- Document Type: ${documentType}
- Status: Approved

Pickup Information:
- Date: ${approvalDetails.pickupDate ? new Date(approvalDetails.pickupDate).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'To be advised'}
- Time: ${approvalDetails.pickupTime || 'During office hours'}
- Office Hours: ${approvalDetails.officeHours || 'Monday to Friday, 8:00 AM - 5:00 PM'}

${approvalDetails.instructions ? `Additional Instructions:\n${approvalDetails.instructions}` : ''}

Please bring a valid ID when claiming your document.

Thank you,
Barangay Poblacion 1
Clarin, Misamis Occidental
    `;
    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Document Request Approved - Ready for Pickup',
        text: emailContent
    });
}

async function sendRejectionEmail(email, fullName, documentType, rejectionReason) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });
    const emailContent = `
Dear ${fullName},

We regret to inform you that your document request has been rejected.

Document Type: ${documentType}
Reason: ${rejectionReason}

You may submit a new request with the necessary corrections.

Thank you,
Barangay Poblacion 1
Clarin, Misamis Occidental
    `;
    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Document Request Status Update - Rejected',
        text: emailContent
    });
}

// --- UPDATED: Document Request Route (Auto-saves to Residents) ---
routes.post('/api/resident/documentRequest', async (req, res) => {
    try {
        const { email, phoneNumber, address, fullName, purpose, documentType, birthdate, gender } = req.body;

        // 1. Check if the resident already exists in the database
        let existingResident = await Resident.findOne({ 
            $or: [
                { 'contact.email': email },
                { 'contact.phone': phoneNumber }
            ]
        });

        // 2. If they don't exist, create a new Resident profile automatically
        if (!existingResident) {
            // Split the full name into first and last name (basic split)
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Unknown';

            const newResident = new Resident({
                first_name: firstName,
                last_name: lastName,
                birthdate: birthdate || new Date('1990-01-01'), // Fallback if not provided
                age: birthdate ? new Date().getFullYear() - new Date(birthdate).getFullYear() : 30,
                gender: gender || 'Other',
                marital_status: 'Single',
                contact: { email, phone: phoneNumber },
                address: { 
                    house_number: 'N/A', 
                    street: address, 
                    barangay: 'POBLACION 1', 
                    city: 'CLARIN', 
                    province: 'MISAMIS OCCIDENTAL' 
                },
                registration: { resident_type: 'Temporary' } // Mark as temporary since they registered online
            });
            await newResident.save();
            console.log(`✅ New resident auto-created from request: ${fullName}`);
        }

        // 3. Save the document request
        const newRequest = new Request({
            email, phoneNumber, address, fullName, purpose, documentType,
            status: 'pending'
        });
        await newRequest.save();

        return res.status(201).json({ message: 'Document request submitted successfully!' });

    } catch (error) {
        console.error("❌ DATABASE ERROR:", error);
        return res.status(500).json({ message: 'Error processing request. Please try again.' });
    }
});

routes.get('/api/admin/allrequest', authMiddleware, async (req, res) => {
    try {
        const pendingRequests = await Request.find({}).sort({ createdAt: -1 });
        return res.status(200).json({ count: pendingRequests.length, requests: pendingRequests });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching requests' });
    }
});

routes.get('/api/admin/pendingrequest', authMiddleware, async (req, res) => {
    try {
        const pendingRequests = await Request.find({ status: 'pending' }).sort({ createdAt: -1 });
        return res.status(200).json({ count: pendingRequests.length, requests: pendingRequests });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching requests' });
    }
});

routes.put('/api/admin/updaterequests/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approvalDetails, rejectionReason } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const updatedRequest = await Request.findByIdAndUpdate(
            id,
            { status, ...(approvalDetails && { approvalDetails }), ...(rejectionReason && { rejectionReason }) },
            { new: true }
        );

        if (!updatedRequest) return res.status(404).json({ success: false, message: 'Not found' });

        if (req.user && req.user.userId && req.user.username) {
            await AdminActionHistory.create({
                adminId: req.user.userId,
                adminUsername: req.user.username,
                action: `${status} document request`,
                target: id,
                details: {
                    requestId: id, status,
                    fullName: updatedRequest.fullName,
                    documentType: updatedRequest.documentType
                }
            });
        }

        try {
            if (status === 'approved' && approvalDetails) {
                try {
                    await sendApprovalEmail(updatedRequest.email, updatedRequest.fullName, updatedRequest.documentType, approvalDetails);
                    console.log("✅ Approval Email sent to", updatedRequest.email);
                } catch (emailErr) {
                    console.error("⚠️ Email failed to send:", emailErr.message);
                }
                
                try {
                    const smsMessage = `[POB 1] Hi ${updatedRequest.fullName.split(' ')[0]}, your ${updatedRequest.documentType} is APPROVED. Pickup on ${new Date(approvalDetails.pickupDate).toLocaleDateString('en-PH')} at ${approvalDetails.pickupTime}. Please bring valid ID.`;
                    
                    const httpFetchClient = {
                        get: async (url, headers) => (await fetch(url, { method: "GET", headers })).json(),
                        post: async (url, body, headers) => (await fetch(url, { method: "POST", headers, body: JSON.stringify(body) })).json(),
                        delete: async (url, headers) => (await fetch(url, { method: "DELETE", headers })).json()
                    };
                    
                    const smsClient = new Client(process.env.SMS_GATEWAY_LOGIN, process.env.SMS_GATEWAY_PASSWORD, httpFetchClient);
                    
                    let phone = updatedRequest.phoneNumber;
                    if (phone.startsWith('09')) phone = '+63' + phone.substring(1);

                    await smsClient.send({
                        message: smsMessage,
                        phoneNumbers: [phone],
                        simNumber: parseInt(process.env.SIM_NUMBER) || 1
                    });
                    console.log("✅ Approval SMS sent to", phone);
                } catch (smsErr) {
                    console.error("⚠️ SMS failed to send:", smsErr.message);
                }

            } else if (status === 'rejected' && rejectionReason) {
                try {
                    await sendRejectionEmail(updatedRequest.email, updatedRequest.fullName, updatedRequest.documentType, rejectionReason);
                    console.log("✅ Rejection Email sent to", updatedRequest.email);
                } catch (emailErr) {
                    console.error("⚠️ Rejection Email failed to send:", emailErr.message);
                }
            }
        } catch (notificationError) {
            console.error('❌ Notification Error:', notificationError.message);
        }

        return res.status(200).json({ success: true, data: updatedRequest });
    } catch (error) {
        console.error("❌ APPROVAL DATABASE ERROR:", error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

routes.get('/api/admin/action-history', authMiddleware, requireAnyRole(['superadmin', 'captain', 'admin']), async (req, res) => {
    try {
        const history = await AdminActionHistory.find({}).sort({ createdAt: -1 }).limit(200);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin action history' });
    }
});

routes.delete('/api/templates/:id', authMiddleware, requireAnyRole(['superadmin', 'captain', 'secretary', 'admin']), async (req, res) => {
    try {
        const template = await BroadcastTemplate.findByIdAndDelete(req.params.id);
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ message: 'Template deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

routes.get('/api/templates', authMiddleware, async (req, res) => {
    try {
        const templates = await BroadcastTemplate.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

routes.post('/api/templates', authMiddleware, requireAnyRole(['superadmin', 'captain', 'secretary', 'admin']), async (req, res) => {
    try {
        const { title, message } = req.body;
        const template = new BroadcastTemplate({ title, message });
        await template.save();
        res.status(201).json(template);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

routes.put('/api/templates/:id', authMiddleware, requireAnyRole(['superadmin', 'captain', 'secretary', 'admin']), async (req, res) => {
    try {
        const { title, message } = req.body;
        const template = await BroadcastTemplate.findByIdAndUpdate(
            req.params.id,
            { title, message },
            { new: true, runValidators: true }
        );
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json(template);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

routes.get('/api/admin/accounts', authMiddleware, async (req, res) => {
    try {
        const admins = await Admin.find({}, '-password');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

routes.post('/api/admin/accounts', authMiddleware, async (req, res) => {
    try {
        const { username, password, fullname, phoneNumber, email, role } = req.body;
        if (!username || !password || !fullname || !phoneNumber) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (await Admin.findOne({ username })) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await Admin.create({
            username,
            password: hashedPassword,
            fullname,
            phoneNumber,
            email: email || undefined,
            role: role || 'admin'
        });

        if (req.user && req.user.userId && req.user.username) {
            await AdminActionHistory.create({
                adminId: req.user.userId,
                adminUsername: req.user.username,
                action: 'created admin account',
                target: newAdmin._id,
                details: {
                    adminId: newAdmin._id,
                    username: newAdmin.username,
                    fullName: newAdmin.fullname,
                    phoneNumber: newAdmin.phoneNumber,
                    email: newAdmin.email || 'N/A',
                    role: newAdmin.role
                }
            });
        }

        res.status(201).json({ message: 'Admin created', admin: { ...newAdmin.toObject(), password: undefined } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

routes.put('/api/admin/accounts/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.role !== 'superadmin' && req.user.userId !== id) {
            return res.status(403).json({ error: 'Forbidden: You can only update your own account' });
        }

        const { fullname, phoneNumber, password, email, role } = req.body;
        const admin = await Admin.findById(id);
        
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        if (admin.role === 'superadmin' && req.user.userId !== id && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Cannot update superadmin' });
        }

        const originalValues = { fullname: admin.fullname, phoneNumber: admin.phoneNumber, email: admin.email, role: admin.role };

        if (fullname) admin.fullname = fullname;
        if (phoneNumber) admin.phoneNumber = phoneNumber;
        if (email) admin.email = email;
        if (role && req.user.role === 'superadmin') admin.role = role;
        if (password) admin.password = await bcrypt.hash(password, 10);
        
        await admin.save();

        if (req.user && req.user.userId && req.user.username) {
            const changes = [];
            if (fullname && fullname !== originalValues.fullname) changes.push(`fullname: ${originalValues.fullname} → ${fullname}`);
            if (phoneNumber && phoneNumber !== originalValues.phoneNumber) changes.push(`phone: ${originalValues.phoneNumber} → ${phoneNumber}`);
            if (email && email !== originalValues.email) changes.push(`email: ${originalValues.email} → ${email}`);
            if (role && role !== originalValues.role) changes.push(`role: ${originalValues.role} → ${role}`);
            if (password) changes.push('password updated');

            if (changes.length > 0) {
                await AdminActionHistory.create({
                    adminId: req.user.userId,
                    adminUsername: req.user.username,
                    action: 'updated admin account',
                    target: id,
                    details: {
                        adminId: id,
                        username: admin.username,
                        changes: changes.join(', ')
                    }
                });
            }
        }

        res.json({ message: 'Admin updated', admin: { ...admin.toObject(), password: undefined } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

routes.delete('/api/admin/accounts/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findById(id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        if (admin.role === 'superadmin') return res.status(403).json({ error: 'Cannot delete superadmin' });

        const adminInfo = {
            username: admin.username,
            fullname: admin.fullname,
            phoneNumber: admin.phoneNumber,
            role: admin.role
        };

        await admin.deleteOne();

        if (req.user && req.user.userId && req.user.username) {
            await AdminActionHistory.create({
                adminId: req.user.userId,
                adminUsername: req.user.username,
                action: 'deleted admin account',
                target: id,
                details: { adminId: id, ...adminInfo }
            });
        }

        res.json({ message: 'Admin deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const createHouseholdAudit = async (householdId, action, changedBy, changes = {}, memberDetails = null) => {
    try {
        const audit = new HouseholdAudit({ householdId, action, changedBy, changes, memberDetails });
        await audit.save();
    } catch (error) {
        console.error('Error creating audit log:', error);
    }
};

routes.get('/api/households', authMiddleware, async (req, res) => {
    try {
        const households = await Household.find({ status: 'active' })
            .populate('headMemberId', 'first_name middle_name last_name')
            .populate('createdBy', 'username fullname')
            .sort({ dateCreated: -1 });
        res.json(households);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.get('/api/households/:id', authMiddleware, async (req, res) => {
    try {
        const household = await Household.findById(req.params.id)
            .populate('headMemberId')
            .populate('createdBy', 'username fullname')
            .populate('updatedBy', 'username fullname');
        if (!household) return res.status(404).json({ error: 'Household not found' });
        const members = await Resident.find({ householdId: req.params.id });
        res.json({ household, members });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.get('/api/households/:id/print', authMiddleware, async (req, res) => {
    try {
        const household = await Household.findById(req.params.id)
            .populate('headMemberId')
            .populate('createdBy', 'username fullname')
            .populate('updatedBy', 'username fullname');
        if (!household) return res.status(404).json({ error: 'Household not found' });

        const members = await Resident.find({ householdId: req.params.id })
            .select('first_name last_name middle_name suffix birthdate placeOfBirth age gender marital_status citizenship employment.occupation contact.phone householdId isHouseholdHead specialStatus')
            .sort({ isHouseholdHead: -1, first_name: 1 });

        res.json({
            householdId: household.householdId,
            region: household.region, province: household.province,
            cityMunicipality: household.cityMunicipality, barangay: household.barangay,
            householdAddress: household.householdAddress,
            dateCreated: household.dateCreated,
            headMember: household.headMemberId,
            memberCount: household.memberCount,
            members
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.post('/api/households', authMiddleware, async (req, res) => {
    try {
        const { householdData, members } = req.body;
        if (!members || members.length === 0) return res.status(400).json({ message: 'At least one member required' });
        if (members.length > 18) return res.status(400).json({ message: 'Maximum 18 members' });

        let headMemberId = null;
        const headMemberData = { ...members[0], isHouseholdHead: true, householdAddress: householdData.householdAddress };

        if (members[0].isExisting) {
            await Resident.findByIdAndUpdate(members[0]._id, headMemberData);
            headMemberId = members[0]._id;
        } else {
            delete headMemberData._id;
            delete headMemberData.isExisting;
            const newHeadResident = new Resident(headMemberData);
            await newHeadResident.save();
            headMemberId = newHeadResident._id;
        }

        const household = new Household({ ...householdData, headMemberId, memberCount: members.length, createdBy: req.user.userId });
        await household.save();

        for (let i = 1; i < members.length; i++) {
            const memberData = { ...members[i], householdId: household._id, isHouseholdHead: false, householdAddress: householdData.householdAddress };
            if (members[i].isExisting) {
                await Resident.findByIdAndUpdate(members[i]._id, memberData);
            } else {
                delete memberData._id;
                delete memberData.isExisting;
                await new Resident(memberData).save();
            }
        }

        await Resident.findByIdAndUpdate(headMemberId, { householdId: household._id });
        await createHouseholdAudit(household._id, 'created', req.user.userId, { householdData, memberCount: members.length });

        const populatedHousehold = await Household.findById(household._id)
            .populate('headMemberId', 'first_name middle_name last_name')
            .populate('createdBy', 'username fullname');

        res.status(201).json(populatedHousehold);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.put('/api/households/:id', authMiddleware, async (req, res) => {
    try {
        const { householdData } = req.body;
        const oldHousehold = await Household.findById(req.params.id);
        if (!oldHousehold) return res.status(404).json({ error: 'Household not found' });

        const updatedHousehold = await Household.findByIdAndUpdate(
            req.params.id,
            { ...householdData, updatedBy: req.user.userId, dateUpdated: new Date() },
            { new: true }
        ).populate('headMemberId', 'first_name middle_name last_name');

        if (oldHousehold.householdAddress !== householdData.householdAddress) {
            await Resident.updateMany({ householdId: req.params.id }, { householdAddress: householdData.householdAddress });
        }

        await createHouseholdAudit(req.params.id, 'updated', req.user.userId, { oldData: oldHousehold.toObject(), newData: householdData });

        res.json(updatedHousehold);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.post('/api/households/:id/members', authMiddleware, async (req, res) => {
    try {
        const { memberData, isExisting } = req.body;
        const householdId = req.params.id;

        const household = await Household.findById(householdId);
        if (!household) return res.status(404).json({ error: 'Household not found' });
        if (household.memberCount >= 18) return res.status(400).json({ message: 'Maximum 18 members' });

        let member;
        if (isExisting) {
            member = await Resident.findByIdAndUpdate(memberData._id, {
                ...memberData, householdId, householdAddress: household.householdAddress, isHouseholdHead: false
            }, { new: true });
        } else {
            member = new Resident({
                ...memberData, householdId, householdAddress: household.householdAddress, isHouseholdHead: false
            });
            await member.save();
        }

        household.memberCount += 1;
        household.updatedBy = req.user.userId;
        household.dateUpdated = new Date();
        await household.save();

        await createHouseholdAudit(householdId, 'member_added', req.user.userId, {}, {
            memberId: member._id,
            memberName: `${member.first_name} ${member.last_name}`,
            actionType: 'added'
        });

        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.delete('/api/households/:householdId/members/:memberId', authMiddleware, async (req, res) => {
    try {
        const { householdId, memberId } = req.params;
        const { action } = req.query;

        const household = await Household.findById(householdId);
        if (!household) return res.status(404).json({ error: 'Household not found' });

        const member = await Resident.findById(memberId);
        if (!member) return res.status(404).json({ error: 'Member not found' });
        if (member.isHouseholdHead && household.memberCount > 1) {
            return res.status(400).json({ error: 'Cannot remove household head.' });
        }

        let memberName = `${member.first_name} ${member.last_name}`;

        if (action === 'delete') {
            await Resident.findByIdAndDelete(memberId);
        } else {
            await Resident.findByIdAndUpdate(memberId, { householdId: null, isHouseholdHead: false, householdAddress: null });
        }

        household.memberCount -= 1;
        household.updatedBy = req.user.userId;
        household.dateUpdated = new Date();
        if (household.memberCount === 0) household.status = 'inactive';
        await household.save();

        await createHouseholdAudit(householdId, 'member_removed', req.user.userId, { action }, {
            memberId, memberName, actionType: action === 'delete' ? 'deleted' : 'unassigned'
        });

        res.json({ message: `Member ${action === 'delete' ? 'deleted' : 'unassigned'} successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.put('/api/households/:householdId/head', authMiddleware, async (req, res) => {
    try {
        const { householdId } = req.params;
        const { newHeadId } = req.body;

        const household = await Household.findById(householdId);
        if (!household) return res.status(404).json({ error: 'Household not found' });

        const newHead = await Resident.findById(newHeadId);
        if (!newHead || newHead.householdId.toString() !== householdId) {
            return res.status(400).json({ error: 'Invalid member' });
        }

        const oldHeadId = household.headMemberId;
        await Resident.findByIdAndUpdate(oldHeadId, { isHouseholdHead: false });
        await Resident.findByIdAndUpdate(newHeadId, { isHouseholdHead: true });

        household.headMemberId = newHeadId;
        household.updatedBy = req.user.userId;
        household.dateUpdated = new Date();
        await household.save();

        await createHouseholdAudit(householdId, 'head_changed', req.user.userId, { oldHeadId, newHeadId }, {
            memberId: newHeadId,
            memberName: `${newHead.first_name} ${newHead.last_name}`,
            actionType: 'made_head'
        });

        const updatedHousehold = await Household.findById(householdId)
            .populate('headMemberId', 'first_name middle_name last_name');

        res.json(updatedHousehold);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.get('/api/residents/unassigned', authMiddleware, async (req, res) => {
    try {
        const unassignedResidents = await Resident.find({ householdId: null, 'registration.status': 'active' });
        res.json(unassignedResidents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.get('/api/households/:id/audit', authMiddleware, async (req, res) => {
    try {
        const auditLogs = await HouseholdAudit.find({ householdId: req.params.id })
            .populate('changedBy', 'username fullname')
            .populate('memberDetails.memberId', 'first_name last_name')
            .sort({ timestamp: -1 });
        res.json(auditLogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.delete('/api/households/:id', authMiddleware, async (req, res) => {
    try {
        const household = await Household.findById(req.params.id);
        if (!household) return res.status(404).json({ error: 'Household not found' });

        await Resident.updateMany({ householdId: req.params.id }, { householdId: null, isHouseholdHead: false, householdAddress: null });

        household.status = 'inactive';
        household.updatedBy = req.user.userId;
        household.dateUpdated = new Date();
        await household.save();

        await createHouseholdAudit(req.params.id, 'deleted', req.user.userId, { deletedAt: new Date() });

        res.json({ message: 'Household deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routes.delete('/api/households/:id/with-residents', authMiddleware, async (req, res) => {
    try {
        const household = await Household.findById(req.params.id);
        if (!household) return res.status(404).json({ error: 'Household not found' });

        const members = await Resident.find({ householdId: req.params.id });
        await Resident.deleteMany({ householdId: req.params.id });

        household.status = 'inactive';
        household.updatedBy = req.user.userId;
        household.dateUpdated = new Date();
        await household.save();

        await createHouseholdAudit(req.params.id, 'deleted_with_residents', req.user.userId, {
            deletedAt: new Date(),
            deletedResidents: members.map(m => ({ id: m._id, name: `${m.first_name} ${m.last_name}`, phone: m.contact?.phone }))
        });

        if (req.user && req.user.userId && req.user.username) {
            await AdminActionHistory.create({
                adminId: req.user.userId,
                adminUsername: req.user.username,
                action: 'deleted household with residents',
                target: req.params.id,
                details: {
                    householdId: req.params.id,
                    householdAddress: household.householdAddress,
                    deletedResidentsCount: members.length,
                    deletedResidents: members.map(m => `${m.first_name} ${m.last_name}`).join(', ')
                }
            });
        }

        res.json({ message: 'Household and all residents deleted', deletedResidentsCount: members.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = routes