import fs from 'fs';

const initialPosts = [
  { id: 'dev', name: 'Device Checker', supportPersons: ['314356'] }
];
const posts = initialPosts;

const staff = [
  { id: '313178', name: 'Abul Kalam', role: 'Guard', permanentGroup: 'A', subSection: 'Device Checker', offDay: 'Friday' },
  { id: '314356', name: 'Saed', role: 'Guard', permanentGroup: 'Reliever', subSection: 'Reliever + Post-03 & Device Checker', offDay: 'Thursday' }
];

const relievers = staff.filter(s => s.permanentGroup === 'Reliever');

const extractPostNumbers = (str) => {
   const nums = [];
   const regex = /(?:post|rg)[-\s]*([\d\s,&and]+)/gi;
   let match;
   while ((match = regex.exec(str)) !== null) {
       const extracted = match[1].match(/\d+/g);
       if (extracted) {
           extracted.forEach(n => nums.push(parseInt(n, 10)));
       }
   }
   if (nums.length === 0) {
       const allNums = str.match(/\d+/g);
       if (allNums && str.toLowerCase().includes('post')) {
           allNums.forEach(n => nums.push(parseInt(n, 10)));
       }
   }
   return nums;
};

const day = 'Friday';
let unassignedOffStaff = staff.filter(s => {
    if (s.permanentGroup === 'Reliever') return false;
    if (String(s.offDay || '').trim().toLowerCase() !== day.toLowerCase()) return false;
    return true;
});

const dayAssignments = new Map();
const assignedThisDay = new Set();

relievers.forEach(r => {
    const covered = [];
    for (let i = 0; i < unassignedOffStaff.length; i++) {
        const s = unassignedOffStaff[i];
        if (assignedThisDay.has(s.id)) continue;
        
        const supportedPosts = posts.filter(p => {
          const initialPost = initialPosts.find(ip => ip.id === p.id);
          const supports = p.supportPersons || (initialPost ? initialPost.supportPersons : []) || [];
          return supports.includes(r.id);
        });
        
        const sSub = (s.subSection || '').toLowerCase();
        const rSub = (r.subSection || '').toLowerCase();
        
        let matches = false;
        if (r.role !== s.role) {
            matches = false;
        } else {
            const sTags = extractPostNumbers(sSub);
            const rTags = extractPostNumbers(rSub);
            
            if (sTags.length > 0 && rTags.length > 0) {
                if (sTags.some(tag => rTags.includes(tag))) matches = true;
            }
            
            if (!matches && sTags.length === 0 && rTags.length === 0) {
                if (rSub && sSub && (rSub.includes(sSub) || sSub.includes(rSub)) && sSub.length > 3) matches = true;
            }
            
            if (!matches) {
              matches = supportedPosts.some(p => {
                const pTags = extractPostNumbers(p.name);
                if (sTags.length > 0 && pTags.length > 0) {
                    if (sTags.some(tag => pTags.includes(tag))) return true;
                }
                const pName = p.name.toLowerCase();
                if (sSub.includes(pName) || pName.includes(sSub)) return true;
                return false;
              });
            }
        }
        
        if (matches) {
           covered.push(s);
           assignedThisDay.add(s.id);
           unassignedOffStaff.splice(i, 1);
           break;
        }
    }
    dayAssignments.set(r.id, covered);
});

console.log(dayAssignments);

