import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { AuditLog } from '../types';

export const logActivity = async (
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  details: string = ''
) => {
  try {
    const newLog: Omit<AuditLog, 'id'> = {
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      action,
      details
    };
    await addDoc(collection(db, 'audit_logs'), newLog);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

export const subscribeToAuditLogs = (
  callback: (logs: AuditLog[]) => void,
  maxLogs: number = 50
) => {
  try {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(maxLogs)
    );

    return onSnapshot(q, (snapshot) => {
      const logs: AuditLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          timestamp: data.timestamp || new Date().toISOString(),
          userId: data.userId || 'system',
          userName: data.userName || 'System',
          userRole: data.userRole || 'Admin',
          action: data.action || '',
          details: data.details || ''
        });
      });
      callback(logs);
    }, (err) => {
      console.error("Audit log subscription error:", err);
    });
  } catch (err) {
    console.error("Error setting up audit log subscription:", err);
    return () => {};
  }
};
