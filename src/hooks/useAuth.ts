import { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { logActivity } from '../services/auditService';

const DEFAULT_ADMIN: AppUser = {
  id: 'admin',
  name: 'প্রধান অ্যাডমিন (Admin)',
  mobile: '01700000000',
  role: 'Admin',
  password: 'admin123',
  createdAt: '2026-01-01T00:00:00.000Z'
};

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('security_roster_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Check if legacy admin was logged in
    const isLegacyAdmin = localStorage.getItem('security_roster_is_admin') === 'true';
    if (isLegacyAdmin) {
      return DEFAULT_ADMIN;
    }
    return null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);

  // Listen to registered users from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        users.push({
          id: doc.id,
          name: d.name || doc.id,
          mobile: d.mobile || '',
          role: d.role || 'Operator',
          password: d.password || '',
          createdAt: d.createdAt || new Date().toISOString()
        });
      });
      setRegisteredUsers(users);
    }, (err) => {
      console.error("Failed to load users from Firestore:", err);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; message: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Check default admin
    if (
      (cleanId === 'admin' || cleanId === '01700000000' || cleanId === '300045') &&
      (cleanPass === 'admin123' || cleanPass === '123456')
    ) {
      const user = DEFAULT_ADMIN;
      setCurrentUser(user);
      localStorage.setItem('security_roster_current_user', JSON.stringify(user));
      localStorage.setItem('security_roster_is_admin', 'true');
      logActivity(user.id, user.name, user.role, 'লগইন করেছেন (অ্যাডমিন)', 'ডিফল্ট অ্যাডমিন ক্রেডেনশিয়াল ব্যবহার করে লগইন');
      return { success: true, message: 'সফলভাবে লগইন হয়েছে!' };
    }

    // Check Firestore registered users
    try {
      // First check local list
      let matchedUser = registeredUsers.find(
        u => (u.id.toLowerCase() === cleanId || u.mobile === cleanId) && u.password === cleanPass
      );

      // If not in local cache, check directly in Firestore doc
      if (!matchedUser) {
        const docRef = doc(db, 'users', cleanId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const d = docSnap.data();
          if (d.password === cleanPass) {
            matchedUser = {
              id: docSnap.id,
              name: d.name,
              mobile: d.mobile,
              role: d.role,
              password: d.password,
              createdAt: d.createdAt
            };
          }
        }
      }

      if (matchedUser) {
        setCurrentUser(matchedUser);
        localStorage.setItem('security_roster_current_user', JSON.stringify(matchedUser));
        localStorage.setItem('security_roster_is_admin', matchedUser.role === 'Admin' ? 'true' : 'false');
        logActivity(matchedUser.id, matchedUser.name, matchedUser.role, 'লগইন করেছেন', `সফল লগইন - পদবী: ${matchedUser.role}`);
        return { success: true, message: 'সফলভাবে লগইন হয়েছে!' };
      }

      return { success: false, message: 'ইউজার আইডি, মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়!' };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: 'লগইন করতে সমস্যা হয়েছে। দয়া করে ইন্টারনেট সংযোগ চেক করুন।' };
    }
  };

  const register = async (userData: {
    username: string;
    name: string;
    mobile: string;
    role: 'Admin' | 'Supervisor' | 'Officer' | 'Operator';
    password: string;
  }): Promise<{ success: boolean; message: string }> => {
    const cleanUsername = userData.username.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanPass = userData.password.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'ইউজার আইডি কমপক্ষে ৩ অক্ষরের হতে হবে।' };
    }
    if (!userData.name.trim()) {
      return { success: false, message: 'ব্যবহারকারীর পুরো নাম প্রদান করুন।' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' };
    }

    try {
      // Check if user already exists
      const docRef = doc(db, 'users', cleanUsername);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() || cleanUsername === 'admin') {
        return { success: false, message: 'এই ইউজার আইডি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য আইডি দিয়ে চেষ্টা করুন।' };
      }

      const newUser: AppUser = {
        id: cleanUsername,
        name: userData.name.trim(),
        mobile: userData.mobile.trim(),
        role: userData.role,
        password: cleanPass,
        createdAt: new Date().toISOString()
      };

      await setDoc(docRef, newUser);

      // Automatically log in
      setCurrentUser(newUser);
      localStorage.setItem('security_roster_current_user', JSON.stringify(newUser));
      localStorage.setItem('security_roster_is_admin', newUser.role === 'Admin' ? 'true' : 'false');

      logActivity(
        newUser.id,
        newUser.name,
        newUser.role,
        'নতুন ইউজার রেজিস্ট্রেশন',
        `নতুন একাউন্ট তৈরি: ${newUser.name} (${newUser.role}), মোবাইল: ${newUser.mobile}`
      );

      return { success: true, message: 'সফলভাবে একাউন্ট তৈরি হয়েছে!' };
    } catch (err) {
      console.error("Registration error:", err);
      return { success: false, message: 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' };
    }
  };

  const logout = () => {
    if (currentUser) {
      logActivity(currentUser.id, currentUser.name, currentUser.role, 'লগআউট করেছেন', 'ব্যবহারকারী সেশন সমাপ্ত');
    }
    setCurrentUser(null);
    localStorage.removeItem('security_roster_current_user');
    localStorage.removeItem('security_roster_is_admin');
  };

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'Admin' || currentUser?.id === 'admin',
    login,
    register,
    logout,
    registeredUsers
  };
};
