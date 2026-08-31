import { useState, useEffect } from 'react';
import { Staff, PostRequirement, LeaveRecord, OTRecord, ShiftChangeRecord } from '../types';
import { allStaff as initialStaff, postRequirements as initialPosts } from '../data';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useAppState = () => {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [posts, setPosts] = useState<PostRequirement[]>(initialPosts);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [ots, setOts] = useState<OTRecord[]>([]);
  const [shiftChanges, setShiftChanges] = useState<ShiftChangeRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load initial data once when auth is ready
  useEffect(() => {
    // Load from localStorage as fallback immediately
    const savedStaff = localStorage.getItem('roster_staff_v2');
    const savedPosts = localStorage.getItem('roster_posts_v2');
    const savedLeaves = localStorage.getItem('roster_leaves_v2');
    const savedOts = localStorage.getItem('roster_ots_v2');
    const savedShiftChanges = localStorage.getItem('roster_shift_changes_v2');
    
    if (savedStaff) {
       const parsed = JSON.parse(savedStaff);
       const fixed = parsed.map((s: any) => {
           if (s.id === '301098' && s.offDay === 'Tuesday') {
               return { ...s, offDay: 'Saturday' };
           }
           return s;
       });
       setStaff(fixed);
    }
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedLeaves) setLeaves(JSON.parse(savedLeaves));
    if (savedOts) setOts(JSON.parse(savedOts));
    if (savedShiftChanges) setShiftChanges(JSON.parse(savedShiftChanges));
    
    setIsLoaded(true);

    const loadData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'shared_roster', 'state'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.staff) {
             const fixedStaff = data.staff.map((s: any) => {
                 // Auto-fix Abdul Ahad's off day to Saturday if it is currently stuck on Tuesday
                 if (s.id === '301098' && s.offDay === 'Tuesday') {
                     return { ...s, offDay: 'Saturday' };
                 }
                 return s;
             });
             setStaff(fixedStaff);
          }
          if (data.posts) setPosts(data.posts);
          if (data.leaves) setLeaves(data.leaves);
          if (data.ots) setOts(data.ots);
          if (data.shiftChanges) setShiftChanges(data.shiftChanges);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    loadData();
  }, []);

  const saveData = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      // Strip undefined values which Firebase rejects
      const sanitizedStaff = JSON.parse(JSON.stringify(staff));
      const sanitizedPosts = JSON.parse(JSON.stringify(posts));
      const sanitizedLeaves = JSON.parse(JSON.stringify(leaves));
      const sanitizedOts = JSON.parse(JSON.stringify(ots));
      const sanitizedShiftChanges = JSON.parse(JSON.stringify(shiftChanges));

      await setDoc(doc(db, 'shared_roster', 'state'), {
        staff: sanitizedStaff,
        posts: sanitizedPosts,
        leaves: sanitizedLeaves,
        ots: sanitizedOts,
        shiftChanges: sanitizedShiftChanges,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Also save to localStorage as backup
      localStorage.setItem('roster_staff_v2', JSON.stringify(staff));
      localStorage.setItem('roster_posts_v2', JSON.stringify(posts));
      localStorage.setItem('roster_leaves_v2', JSON.stringify(leaves));
      localStorage.setItem('roster_ots_v2', JSON.stringify(ots));
      localStorage.setItem('roster_shift_changes_v2', JSON.stringify(shiftChanges));
      
      setSaveMessage('success');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error("Error saving data:", error);
      setSaveMessage('error');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return { staff, setStaff, posts, setPosts, leaves, setLeaves, ots, setOts, shiftChanges, setShiftChanges, isLoaded, saveData, isSaving, saveMessage };
};
