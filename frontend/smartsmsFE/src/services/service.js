import axios from 'axios'

const baseUrl = '/api'

// Automatically attach the login token to every request
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- RESIDENTS ---
export const getResidents = async () => (await axios.get(`${baseUrl}/resident/all`)).data
export const registerResident = async (residentData) => (await axios.post(`${baseUrl}/resident/register`, residentData)).data
export const deleteResident = async (id) => axios.delete(`${baseUrl}/resident/delete/${id}`)
export const updateResident = async (id, data) => (await axios.put(`${baseUrl}/resident/update/${id}`, data)).data

// --- SMS & BROADCAST ---
export const sendSms = async (phoneNumbers, message, createdBy, broadcastType) => {
    try {
        const response = await axios.post(`${baseUrl}/send-sms`, {
            phoneNumbers,
            message,
            broadcastType
        });
        return response.data;
    } catch (error) {
        console.error("Error sending SMS:", error);
        throw error; 
    }
}

export const getBroadcastHistory = async () => (await axios.get(`${baseUrl}/history/getall`)).data
export const deleteBroadcastHistory = async (id) => (await axios.delete(`${baseUrl}/history/delete/${id}`)).data

// --- DOCUMENT REQUESTS ---
export const submitDocumentRequest = async (data) => (await axios.post(`${baseUrl}/resident/documentRequest`, data)).data
export const getAllDocumentRequests = async () => (await axios.get(`${baseUrl}/admin/allrequest`)).data
export const getPendingDocumentRequests = async () => (await axios.get(`${baseUrl}/admin/pendingrequest`)).data

export const updateDocumentRequestStatus = async (id, status, additionalData = {}) => {
  try {
    const response = await axios.put(`${baseUrl}/admin/updaterequests/${id}`, { status, ...additionalData });
    return response.data;
  } catch (error) {
    console.error("Axios Error:", error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || error.response.data.error || "Backend error occurred");
    }
    throw new Error(error.message || "Network error");
  }
}

// --- ADMIN AUTH & ACCOUNTS ---
export const loginAdmin = async (username, password) => (await axios.post(`${baseUrl}/admin/login`, { username, password })).data
export const verifyAdminToken = async () => {
  try {
    await axios.get(`${baseUrl}/admin/verify-token`);
    return true;
  } catch { return false; }
}
export const getAdminAccounts = async () => (await axios.get(`${baseUrl}/admin/accounts`)).data
export const addAdminAccount = async (admin) => (await axios.post(`${baseUrl}/admin/accounts`, admin)).data
export const updateAdminAccount = async (id, update) => (await axios.put(`${baseUrl}/admin/accounts/${id}`, update)).data
export const deleteAdminAccount = async (id) => (await axios.delete(`${baseUrl}/admin/accounts/${id}`)).data
export const getAdminActionHistory = async () => (await axios.get(`${baseUrl}/admin/action-history`)).data

// --- BROADCAST TEMPLATES ---
export const getTemplates = async () => (await axios.get(`${baseUrl}/templates`)).data
export const addTemplate = async (template) => (await axios.post(`${baseUrl}/templates`, template)).data
export const updateTemplate = async (id, template) => (await axios.put(`${baseUrl}/templates/${id}`, template)).data
export const deleteTemplate = async (id) => (await axios.delete(`${baseUrl}/templates/${id}`)).data

// --- HOUSEHOLDS ---
export const getHouseholds = async () => (await axios.get(`${baseUrl}/households`)).data
export const getHousehold = async (id) => (await axios.get(`${baseUrl}/households/${id}`)).data
export const getHouseholdForPrint = async (id) => {
  try {
    return (await axios.get(`${baseUrl}/households/${id}/print`)).data;
  } catch (error) {
    if (error.response?.status === 404) return await getHousehold(id);
    throw error;
  }
}
export const createHousehold = async (householdData, members) => (await axios.post(`${baseUrl}/households`, { householdData, members })).data
export const updateHousehold = async (id, householdData) => (await axios.put(`${baseUrl}/households/${id}`, { householdData })).data
export const addHouseholdMember = async (id, memberData, isExisting = false) => (await axios.post(`${baseUrl}/households/${id}/members`, { memberData, isExisting })).data
export const removeHouseholdMember = async (id, memberId, action = 'unassign') => (await axios.delete(`${baseUrl}/households/${id}/members/${memberId}?action=${action}`)).data
export const changeHouseholdHead = async (id, newHeadId) => (await axios.put(`${baseUrl}/households/${id}/head`, { newHeadId })).data
export const getUnassignedResidents = async () => (await axios.get(`${baseUrl}/residents/unassigned`)).data
export const getHouseholdAudit = async (id) => (await axios.get(`${baseUrl}/households/${id}/audit`)).data
export const deleteHousehold = async (id) => (await axios.delete(`${baseUrl}/households/${id}`)).data
export const deleteHouseholdWithResidents = async (id) => (await axios.delete(`${baseUrl}/households/${id}/with-residents`)).data

// --- EXPORT ALL AS DEFAULT ---
export default {
  getResidents, registerResident, deleteResident, updateResident, sendSms,
  getBroadcastHistory, deleteBroadcastHistory,
  submitDocumentRequest, getAllDocumentRequests, 
  getPendingDocumentRequests, updateDocumentRequestStatus,
  loginAdmin, verifyAdminToken, getAdminAccounts, addAdminAccount, updateAdminAccount,
  deleteAdminAccount, getAdminActionHistory, getTemplates, addTemplate, updateTemplate,
  deleteTemplate, getHouseholds, getHousehold, getHouseholdForPrint, createHousehold,
  updateHousehold, addHouseholdMember, removeHouseholdMember, changeHouseholdHead,
  getUnassignedResidents, getHouseholdAudit, deleteHousehold, deleteHouseholdWithResidents
};