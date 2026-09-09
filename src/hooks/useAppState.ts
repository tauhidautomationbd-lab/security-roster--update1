import { useState, useEffect, useRef } from 'react';
import { Staff, PostRequirement, LeaveRecord, OTRecord, ShiftChangeRecord, AppUser } from '../types';
import { allStaff as initialStaff, postRequirements as initialPosts } from '../data';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { logActivity } from '../services/auditService';

export const useAppState = () => {
  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('roster_staff_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const legacySaved = localStorage.getItem('roster_staff_v2');
    if (legacySaved) {
      try { return JSON.parse(legacySaved); } catch (e) {}
    }
    return initialStaff;
  });

  const [posts, setPosts] = useState<PostRequirement[]>(() => {
    const saved = localStorage.getItem('roster_posts_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const legacy = localStorage.getItem('roster_posts_v2');
    if (legacy) {
      try { return JSON.parse(legacy); } catch (e) {}
    }
    return initialPosts;
  });

  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => {
    const saved = localStorage.getItem('roster_leaves_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [ots, setOts] = useState<OTRecord[]>(() => {
    const saved = localStorage.getItem('roster_ots_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [shiftChanges, setShiftChanges] = useState<ShiftChangeRecord[]>(() => {
    const saved = localStorage.getItem('roster_shift_changes_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastSavedBy, setLastSavedBy] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const isInitialRemoteLoad = useRef(true);

  // Set up real-time listener to Firestore
  useEffect(() => {
    const stateDocRef = doc(db, 'shared_roster', 'state');

    const unsubscribe = onSnapshot(stateDocRef, (docSnap) => {
      setIsCloudSynced(true);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.staff && Array.isArray(data.staff)) {
          setStaff(data.staff);
          localStorage.setItem('roster_staff_v3', JSON.stringify(data.staff));
        }
        if (data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
          localStorage.setItem('roster_posts_v3', JSON.stringify(data.posts));
        }
        if (data.leaves && Array.isArray(data.leaves)) {
          setLeaves(data.leaves);
          localStorage.setItem('roster_leaves_v3', JSON.stringify(data.leaves));
        }
        if (data.ots && Array.isArray(data.ots)) {
          setOts(data.ots);
          localStorage.setItem('roster_ots_v3', JSON.stringify(data.ots));
        }
        if (data.shiftChanges && Array.isArray(data.shiftChanges)) {
          setShiftChanges(data.shiftChanges);
          localStorage.setItem('roster_shift_changes_v3', JSON.stringify(data.shiftChanges));
        }
        if (data.updatedAt) {
          setLastSavedAt(data.updatedAt);
        }
        if (data.lastSavedBy) {
          setLastSavedBy(data.lastSavedBy);
        }
      } else {
        // Document does not exist yet; initialize it
        if (isInitialRemoteLoad.current) {
          setDoc(stateDocRef, {
            staff: initialStaff,
            posts: initialPosts,
            leaves: [],
            ots: [],
            shiftChanges: [],
            updatedAt: new Date().toISOString(),
            lastSavedBy: 'System Initializer'
          });
        }
      }
      isInitialRemoteLoad.current = false;
      setIsLoaded(true);
    }, (error) => {
      console.error("Firestore real-time sync error:", error);
      setIsCloudSynced(false);
      // Fallback: mark loaded so user is not blocked
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const saveData = async (currentUser?: AppUser | null) => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const sanitizedStaff = JSON.parse(JSON.stringify(staff));
      const sanitizedPosts = JSON.parse(JSON.stringify(posts));
      const sanitizedLeaves = JSON.parse(JSON.stringify(leaves));
      const sanitizedOts = JSON.parse(JSON.stringify(ots));
      const sanitizedShiftChanges = JSON.parse(JSON.stringify(shiftChanges));

      const now = new Date().toISOString();
      const userName = currentUser?.name || 'অ্যাডমিন ইউজার';
      const userId = currentUser?.id || 'admin';
      const userRole = currentUser?.role || 'Admin';

      const stateDocRef = doc(db, 'shared_roster', 'state');
      await setDoc(stateDocRef, {
        staff: sanitizedStaff,
        posts: sanitizedPosts,
        leaves: sanitizedLeaves,
        ots: sanitizedOts,
        shiftChanges: sanitizedShiftChanges,
        updatedAt: now,
        lastSavedBy: userName
      });

      // Update local storage backup
      localStorage.setItem('roster_staff_v3', JSON.stringify(sanitizedStaff));
      localStorage.setItem('roster_posts_v3', JSON.stringify(sanitizedPosts));
      localStorage.setItem('roster_leaves_v3', JSON.stringify(sanitizedLeaves));
      localStorage.setItem('roster_ots_v3', JSON.stringify(sanitizedOts));
      localStorage.setItem('roster_shift_changes_v3', JSON.stringify(sanitizedShiftChanges));

      setLastSavedAt(now);
      setLastSavedBy(userName);

      // Count active and resigned
      const activeCount = sanitizedStaff.filter((s: Staff) => s.status !== 'resigned').length;
      const resignedCount = sanitizedStaff.filter((s: Staff) => s.status === 'resigned').length;

      // Add to Firestore Audit Log
      await logActivity(
        userId,
        userName,
        userRole,
        'সকল পরিবর্তন ক্লাউডে সেভ করেছেন',
        `সফলভাবে সেভ: মোট স্টাফ ${sanitizedStaff.length} জন (সক্রিয়: ${activeCount}, পদত্যাগকারী: ${resignedCount}), ছুটি: ${sanitizedLeaves.length}, ওটি: ${sanitizedOts.length}`
      );

      setSaveMessage('success');
      setTimeout(() => setSaveMessage(''), 4000);
      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      setSaveMessage('error');
      setTimeout(() => setSaveMessage(''), 4000);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    staff,
    setStaff,
    posts,
    setPosts,
    leaves,
    setLeaves,
    ots,
    setOts,
    shiftChanges,
    setShiftChanges,
    isLoaded,
    isSaving,
    saveMessage,
    saveData,
    lastSavedAt,
    lastSavedBy,
    isCloudSynced
  };
};
