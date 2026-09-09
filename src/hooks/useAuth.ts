import { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { logActivity } from '../services/auditService';

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
          status: d.status || 'approved', // Legacy users default to approved
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
              status: d.status || 'approved',
              password: d.password,
              createdAt: d.createdAt
            };
          }
        }
      }

      if (matchedUser) {
        if (matchedUser.status === 'pending') {
          return { success: false, message: 'আপনার অ্যাকাউন্টটি অনুমোদনের অপেক্ষায় আছে। সুপার অ্যাডমিন অনুমোদন দিলে লগইন করতে পারবেন।' };
        }
        if (matchedUser.status === 'rejected') {
          return { success: false, message: 'আপনার অ্যাকাউন্টটি বাতিল করা হয়েছে। কর্তৃপক্ষের সাথে যোগাযোগ করুন।' };
        }

        setCurrentUser(matchedUser);
        localStorage.setItem('security_roster_current_user', JSON.stringify(matchedUser));
        localStorage.setItem('security_roster_is_admin', matchedUser.role === 'Admin' || matchedUser.role === 'Super Admin' ? 'true' : 'false');
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
      if (docSnap.exists()) {
        return { success: false, message: 'এই ইউজার আইডি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য আইডি দিয়ে চেষ্টা করুন।' };
      }

      // Bootstrap mechanism: if no Super Admin exists, make this user a Super Admin
      const noSuperAdminExists = !registeredUsers.some(u => u.role === 'Super Admin');

      const newUser: AppUser = {
        id: cleanUsername,
        name: userData.name.trim(),
        mobile: userData.mobile.trim(),
        role: noSuperAdminExists ? 'Super Admin' : userData.role,
        status: noSuperAdminExists ? 'approved' : 'pending',
        password: cleanPass,
        createdAt: new Date().toISOString()
      };

      await setDoc(docRef, newUser);

      logActivity(
        newUser.id,
        newUser.name,
        newUser.role,
        'নতুন ইউজার রেজিস্ট্রেশন',
        `নতুন একাউন্ট তৈরি: ${newUser.name} (${newUser.role}), মোবাইল: ${newUser.mobile} (${noSuperAdminExists ? 'অটো-অ্যাপ্রুভড' : 'অনুমোদনের অপেক্ষায়'})`
      );

      if (noSuperAdminExists) {
        setCurrentUser(newUser);
        localStorage.setItem('security_roster_current_user', JSON.stringify(newUser));
        localStorage.setItem('security_roster_is_admin', 'true');
        return { success: true, message: 'সফলভাবে একাউন্ট তৈরি হয়েছে! (আপনি সিস্টেমের প্রথম Super Admin হিসেবে যুক্ত হয়েছেন)' };
      }

      // Do NOT automatically log in if not the first user. Return a success message that they need approval.
      return { success: true, message: 'সফলভাবে একাউন্ট তৈরি হয়েছে! সুপার অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।' };
    } catch (err) {
      console.error("Registration error:", err);
      return { success: false, message: 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' };
    }
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().role === 'Super Admin') {
        return { success: false, message: 'Super Admin status cannot be changed' };
      }
      await updateDoc(docRef, { status });
      
      logActivity(
        currentUser?.id || 'admin',
        currentUser?.name || 'Admin',
        currentUser?.role || 'Super Admin',
        'ইউজার স্ট্যাটাস পরিবর্তন',
        `ইউজার ${userId} এর স্ট্যাটাস ${status} করা হয়েছে`
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating user status:", error);
      return { success: false };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().role === 'Super Admin') {
        return { success: false, message: 'Super Admin cannot be deleted' };
      }
      await deleteDoc(docRef);
      
      logActivity(
        currentUser?.id || 'admin',
        currentUser?.name || 'Admin',
        currentUser?.role || 'Super Admin',
        'ইউজার ডিলিট',
        `ইউজার ${userId} মুছে ফেলা হয়েছে`
      );
      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      return { success: false };
    }
  };

  const adminResetPassword = async (userId: string, newPass: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, { password: newPass });
      
      logActivity(
        currentUser?.id || 'admin',
        currentUser?.name || 'Admin',
        currentUser?.role || 'Super Admin',
        'পাসওয়ার্ড পরিবর্তন',
        `সুপার এডমিন কর্তৃক ইউজার ${userId} এর পাসওয়ার্ড পরিবর্তন`
      );
      return { success: true };
    } catch (error) {
      console.error("Error resetting password:", error);
      return { success: false, message: 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।' };
    }
  };

  const changePassword = async (newPass: string) => {
    if (!currentUser) return { success: false };
    try {
      const docRef = doc(db, 'users', currentUser.id);
      await updateDoc(docRef, { password: newPass });
      
      // Update local state
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      localStorage.setItem('security_roster_current_user', JSON.stringify(updatedUser));
      
      logActivity(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'পাসওয়ার্ড পরিবর্তন',
        'নিজস্ব পাসওয়ার্ড পরিবর্তন করেছেন'
      );
      return { success: true };
    } catch (error) {
      console.error("Error changing password:", error);
      return { success: false, message: 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।' };
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
    isAdmin: currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin' || currentUser?.id === 'admin',
    isSuperAdmin: currentUser?.role === 'Super Admin' || currentUser?.id === 'admin',
    login,
    register,
    logout,
    registeredUsers,
    updateUserStatus,
    deleteUser,
    adminResetPassword,
    changePassword
  };
};
